import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { NotificationsService } from '../notifications/notifications.service';

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
  ) {}

  async createOrder(dto: CreateOrderDto) {
    // 1. Validate session is active
    const session = await this.prisma.withRetry(() =>
      this.prisma.tableSession.findFirst({
        where: { id: dto.sessionId, isActive: true },
      })
    );
    if (!session) {
      this.logger.error(`❌ Order creation failed: Session ${dto.sessionId} is not active or not found.`);
      throw new BadRequestException('Table session is not active');
    }

    // 2. Fetch actual prices from DB — never trust frontend
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.withRetry(() =>
      this.prisma.menuItem.findMany({
        where: { id: { in: menuItemIds }, isAvailable: true },
      })
    );

    if (menuItems.length !== menuItemIds.length) {
      this.logger.error(`❌ Order creation failed: One or more menu items not found or unavailable. IDs: ${menuItemIds}`);
      throw new BadRequestException('One or more items are unavailable or do not exist');
    }

    const priceMap = new Map(menuItems.map((m: any) => [m.id, Number(m.price)]));

    // 3. Calculate subtotal server-side including modifiers
    const subTotal = dto.items.reduce((sum, item) => {
      const basePrice = priceMap.get(item.menuItemId) || 0;
      const optionsTotal = item.options?.reduce((optSum, opt) => optSum + opt.optionPrice, 0) || 0;
      return sum + (basePrice + optionsTotal) * item.quantity;
    }, 0);

    // 4. Get table with branchId and tax rates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const table = await this.prisma.withRetry(() =>
      this.prisma.diningTable.findUnique({
        where: { id: dto.tableId },
        include: { branch: { select: { id: true, vatRate: true, serviceChargeRate: true } } },
      })
    );
    if (!table) throw new NotFoundException('Table not found');

    const vatRate = (table.branch as any)?.vatRate || 15;
    const serviceChargeRate = (table.branch as any)?.serviceChargeRate || 10;

    const serviceChargeAmount = subTotal * (serviceChargeRate / 100);
    const vatAmount = (subTotal + serviceChargeAmount) * (vatRate / 100);
    const totalPrice = subTotal + serviceChargeAmount + vatAmount;

    const lastOrderToday = await this.prisma.withRetry(() =>
      this.prisma.order.findFirst({
        where: {
          table: { branchId: table.branchId },
          createdAt: { gte: today },
        },
        orderBy: { displayNumber: 'desc' },
        select: { displayNumber: true },
      })
    );

    const nextNum = (parseInt(lastOrderToday?.displayNumber || '0', 10) || 0) + 1;
    const displayNumber = nextNum.toString();

    // 5. Create order + items in a single transaction (no withRetry — transactions are ephemeral)
    const order = await this.prisma.$transaction(async (tx: any) => {
      const newOrder = await tx.order.create({
        data: {
          tableId: dto.tableId,
          sessionId: dto.sessionId,
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
            create: dto.items.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: priceMap.get(item.menuItemId)! + (item.options?.reduce((s, o) => s + o.optionPrice, 0) || 0),
              note: item.note,
              options: {
                create: item.options?.map(o => ({
                  optionName: o.optionName,
                  optionPrice: o.optionPrice,
                })) || [],
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
    });

    // 6. Notify kitchen via socket (branch-isolated room)
    this.realtime.emitNewOrder(order, table.branchId);

    return {
      ...order,
      totalPrice: Number(order.totalPrice),
      items: order.items.map((i: any) => ({ ...i, unitPrice: Number(i.unitPrice) })),
    };
  }


  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: { select: { name: true, imageUrl: true } }, options: true } },
        table: { select: { tableNumber: true } },
      },
    });
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

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const allowed = STATUS_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new ForbiddenException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status as OrderStatus },
      include: {
        items: { include: { menuItem: { select: { name: true } }, options: true } },
        table: { select: { tableNumber: true, branchId: true } },
      },
    });

    // Emit realtime update
    this.realtime.emitOrderUpdated(updated);

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
    const orders = await this.prisma.order.findMany({
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
    });

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
    const order = await this.prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) throw new NotFoundException('Order not found');

    // Check if already rated this order (overall or per-item)
    const existing = await this.prisma.rating.findFirst({
      where: {
        orderId: data.orderId,
        customerRef: data.customerRef,
        menuItemId: data.menuItemId ?? null,
      },
    });
    if (existing) {
      // Update existing rating
      return this.prisma.rating.update({
        where: { id: existing.id },
        data: { rating: data.rating, comment: data.comment },
      });
    }

    return this.prisma.rating.create({
      data: {
        orderId: data.orderId,
        menuItemId: data.menuItemId || null,
        rating: data.rating,
        comment: data.comment,
        customerRef: data.customerRef,
      },
    });
  }

  async getRatingsForBranch(branchId: string) {
    return this.prisma.rating.findMany({
      where: { order: { table: { branchId } } },
      include: {
        order: { select: { displayNumber: true, table: { select: { tableNumber: true } } } },
        menuItem: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // ─── Customer Order History ───────────────────────────────────────

  async getOrderHistory(customerRef: string) {
    const orders = await this.prisma.order.findMany({
      where: { customerRef },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        items: { include: { menuItem: { select: { name: true, imageUrl: true } }, options: true } },
        table: { select: { tableNumber: true } },
        ratings: { select: { id: true, rating: true, comment: true, menuItemId: true } },
      },
    });

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
