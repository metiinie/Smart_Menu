import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderAuditService } from './order-audit.service';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  CREATED: ['CONFIRMED'],
  CONFIRMED: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['DELIVERED'],
  DELIVERED: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
    private readonly orderAudit: OrderAuditService,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    await this.orderAudit.record({
      status: 'ATTEMPT',
      source: 'customer',
      tableId: dto.tableId,
      sessionId: dto.sessionId,
      customerRef: dto.customerRef,
      itemCount: dto.items.length,
    });

    // 1. Validate session is active and get associated table/branch info
    const session = await this.prisma.withRetry(() =>
      this.prisma.tableSession.findFirst({
        where: { id: dto.sessionId, isActive: true },
        include: { 
          table: { 
            include: { 
              branch: { 
                select: { id: true, vatRate: true, serviceChargeRate: true } 
              } 
            } 
          } 
        },
      })
    );

    if (!session || !session.table) {
      this.logger.warn(`⚠️ Session ${dto.sessionId} is not active or has no table. Client will be signaled to refresh.`);
      await this.orderAudit.record({
        status: 'SESSION_EXPIRED',
        source: 'customer',
        tableId: dto.tableId,
        sessionId: dto.sessionId,
        customerRef: dto.customerRef,
        itemCount: dto.items.length,
        reason: 'Session missing or inactive during order create',
      });
      throw new BadRequestException('SESSION_EXPIRED');
    }

    const table = session.table;

    // 2. Fetch actual prices from DB — never trust frontend
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.withRetry(() =>
      this.prisma.menuItem.findMany({
        where: { id: { in: menuItemIds }, isAvailable: true },
        include: {
          modifierGroups: {
            include: { options: true },
          },
        },
      })
    );

    if (menuItems.length !== menuItemIds.length) {
      this.logger.error(`❌ Order creation failed: One or more menu items not found or unavailable. IDs: ${menuItemIds}`);
      await this.orderAudit.record({
        status: 'ITEM_UNAVAILABLE',
        source: 'customer',
        branchId: table.branchId,
        tableId: table.id,
        sessionId: session.id,
        customerRef: dto.customerRef,
        itemCount: dto.items.length,
        reason: 'One or more items were unavailable or invalid',
      });
      throw new BadRequestException('One or more items are unavailable or do not exist');
    }

    // 3. Calculate subtotal server-side including verified modifiers
    const validatedItems = dto.items.map(item => {
      const realItem = menuItems.find(m => m.id === item.menuItemId)!;
      const validatedOptions = item.options?.map(opt => {
        const realOpt = realItem.modifierGroups.flatMap(g => g.options).find(o => o.name === opt.optionName);
        return {
          optionName: opt.optionName,
          optionPrice: realOpt ? Number(realOpt.price) : 0,
        };
      }) || [];
      
      const optionsTotal = validatedOptions.reduce((sum, opt) => sum + opt.optionPrice, 0);
      const unitPrice = Number(realItem.price) + optionsTotal;
      
      return {
        ...item,
        unitPrice,
        validatedOptions,
      };
    });

    const subTotal = validatedItems.reduce((sum, item) => {
      return sum + item.unitPrice * item.quantity;
    }, 0);

    // 4. (Table and branch info already retrieved from session above)
    const counterDate = new Date().toISOString().slice(0, 10);

    const vatRate = (table.branch as any)?.vatRate || 15;
    const serviceChargeRate = (table.branch as any)?.serviceChargeRate || 10;

    const serviceChargeAmount = subTotal * (serviceChargeRate / 100);
    const vatAmount = (subTotal + serviceChargeAmount) * (vatRate / 100);
    const totalPrice = subTotal + serviceChargeAmount + vatAmount;

    // 5. Create order + items in a single transaction.
    const order = await this.prisma.$transaction(async (tx: any) => {
      const counter = await tx.branchOrderCounter.upsert({
        where: {
          branchId_counterDate: {
            branchId: table.branchId,
            counterDate,
          },
        },
        update: {
          lastNumber: { increment: 1 },
        },
        create: {
          branchId: table.branchId,
          counterDate,
          lastNumber: 1,
        },
        select: { lastNumber: true },
      });
      const displayNumber = counter.lastNumber.toString();

      const newOrder = await tx.order.create({
        data: {
          tableId: table.id,
          sessionId: session.id,
          customerRef: dto.customerRef,
          displayNumber,
          subTotal,
          vatAmount,
          serviceChargeAmount,
          totalPrice,
          notes: dto.notes,
          status: OrderStatus.CREATED,
          paymentStatus: 'UNPAID',
          items: {
            create: validatedItems.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              note: item.note,
              options: {
                create: item.validatedOptions.map(o => ({
                  optionName: o.optionName,
                  optionPrice: o.optionPrice,
                })),
              },
            })),
          },
        },
        include: {
          items: { include: { menuItem: { select: { name: true, imageUrl: true } }, options: true } },
          table: { select: { tableNumber: true } },
        },
      });
      return newOrder;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    // 6. Notify kitchen via socket (branch-isolated room)
    this.realtime.emitNewOrder(order, table.branchId);
    await this.orderAudit.record({
      status: 'CREATED',
      source: 'customer',
      branchId: table.branchId,
      tableId: table.id,
      sessionId: session.id,
      customerRef: dto.customerRef,
      orderId: order.id,
      displayNumber: order.displayNumber,
      itemCount: dto.items.length,
    });

    return {
      ...order,
      totalPrice: Number(order.totalPrice),
      items: order.items.map((i: any) => ({ ...i, unitPrice: Number(i.unitPrice) })),
    };
  }


  async getOrder(id: string) {
    const order = await this.prisma.withRetry(() =>
      this.prisma.order.findUnique({
        where: { id },
        include: {
          items: { include: { menuItem: { select: { name: true, imageUrl: true } }, options: true } },
          table: { select: { tableNumber: true } },
        },
      }),
    );
    if (!order) throw new NotFoundException('Order not found');

    return {
      ...order,
      subTotal: Number(order.subTotal),
      vatAmount: Number(order.vatAmount),
      serviceChargeAmount: Number(order.serviceChargeAmount),
      totalPrice: Number(order.totalPrice),
      items: order.items.map((i: any) => ({ ...i, unitPrice: Number(i.unitPrice) })),
    };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, actingBranchId?: string) {
    const order = await this.prisma.withRetry(() =>
      this.prisma.order.findUnique({
        where: { id },
        select: { id: true, status: true, table: { select: { branchId: true } } },
      }),
    );
    if (!order) throw new NotFoundException('Order not found');
    if (actingBranchId) {
      if (order.table?.branchId && order.table.branchId !== actingBranchId) {
        throw new ForbiddenException('Order does not belong to your branch');
      }
    }

    const allowed = STATUS_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new ForbiddenException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    const transition = await this.prisma.withRetry(() =>
      this.prisma.order.updateMany({
        where: { id, status: order.status },
        data: { status: dto.status as OrderStatus },
      }),
    );
    if (transition.count === 0) {
      throw new ConflictException('Order status changed by another request. Please retry.');
    }

    const updated = await this.prisma.withRetry(() =>
      this.prisma.order.findUnique({
        where: { id },
        include: {
          items: { include: { menuItem: { select: { name: true } }, options: true } },
          table: { select: { tableNumber: true, branchId: true } },
        },
      }),
    );
    if (!updated) throw new NotFoundException('Order not found after update');

    // Emit realtime update
    this.realtime.emitOrderUpdated(updated);
    await this.orderAudit.record({
      status: 'STATUS_UPDATED',
      source: 'staff',
      branchId: updated.table?.branchId,
      tableId: updated.tableId,
      sessionId: updated.sessionId,
      customerRef: updated.customerRef,
      orderId: updated.id,
      displayNumber: updated.displayNumber,
      reason: `Order moved to ${updated.status}`,
      itemCount: updated.items.length,
    });

    // Push Notification
    if (updated.status === 'READY') {
      await this.notifications.sendNotification(
        updated.customerRef,
        'Order Ready! 🥘',
        `Your order #${updated.displayNumber} is ready to be served.`,
        { orderId: updated.id }
      );
    } else if (updated.status === 'DELIVERED') {
      await this.notifications.sendNotification(
        updated.customerRef,
        'Enjoy your meal! 🍽️',
        `Order #${updated.displayNumber} has been delivered. Thank you!`,
        { orderId: updated.id }
      );
    }

    return { 
      ...updated, 
      subTotal: Number(updated.subTotal),
      vatAmount: Number(updated.vatAmount),
      serviceChargeAmount: Number(updated.serviceChargeAmount),
      totalPrice: Number(updated.totalPrice) 
    };
  }

  async getOrdersByBranch(
    branchId: string, 
    status?: string, 
    tableId?: string, 
    sessionId?: string,
    customerRef?: string
  ) {
    const orders = await this.prisma.withRetry(() =>
      this.prisma.order.findMany({
        where: {
          table: { branchId },
          ...(status ? { status: status as OrderStatus } : {}),
          ...(tableId ? { tableId } : {}),
          ...(sessionId ? { sessionId } : {}),
          ...(customerRef ? { customerRef } : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { menuItem: { select: { name: true } }, options: true } },
          table: { select: { tableNumber: true } },
        },
      }),
    );

    return orders.map((o: any) => ({ 
      ...o, 
      subTotal: Number(o.subTotal),
      vatAmount: Number(o.vatAmount),
      serviceChargeAmount: Number(o.serviceChargeAmount),
      totalPrice: Number(o.totalPrice) 
    }));
  }

  // ─── Ratings ──────────────────────────────────────────────────────

  async submitRating(data: {
    orderId: string;
    menuItemId?: string;
    rating: number;
    comment?: string;
    customerRef: string;
  }) {
    const order = await this.prisma.withRetry(() => this.prisma.order.findUnique({ where: { id: data.orderId } }));
    if (!order) throw new NotFoundException('Order not found');

    // Check if already rated this order (overall or per-item)
    const existing = await this.prisma.withRetry(() =>
      this.prisma.rating.findFirst({
        where: {
          orderId: data.orderId,
          customerRef: data.customerRef,
          menuItemId: data.menuItemId ?? null,
        },
      }),
    );
    if (existing) {
      // Update existing rating
      return this.prisma.withRetry(() =>
        this.prisma.rating.update({
          where: { id: existing.id },
          data: { rating: data.rating, comment: data.comment },
        }),
      );
    }

    return this.prisma.withRetry(() =>
      this.prisma.rating.create({
        data: {
          orderId: data.orderId,
          menuItemId: data.menuItemId || null,
          rating: data.rating,
          comment: data.comment,
          customerRef: data.customerRef,
        },
      }),
    );
  }

  async getRatingsForBranch(branchId: string) {
    return this.prisma.withRetry(() =>
      this.prisma.rating.findMany({
        where: { order: { table: { branchId } } },
        include: {
          order: { select: { displayNumber: true, table: { select: { tableNumber: true } } } },
          menuItem: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    );
  }

  // ─── Customer Order History ───────────────────────────────────────

  async getOrderHistory(customerRef: string) {
    const orders = await this.prisma.withRetry(() =>
      this.prisma.order.findMany({
        where: { customerRef },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          items: { include: { menuItem: { select: { name: true, imageUrl: true } }, options: true } },
          table: { select: { tableNumber: true } },
          ratings: { select: { id: true, rating: true, comment: true, menuItemId: true } },
        },
      }),
    );

    return orders.map((o: any) => ({
      ...o,
      subTotal: Number(o.subTotal),
      vatAmount: Number(o.vatAmount),
      serviceChargeAmount: Number(o.serviceChargeAmount),
      totalPrice: Number(o.totalPrice),
      items: o.items.map((i: any) => ({ ...i, unitPrice: Number(i.unitPrice) })),
    }));
  }
}
