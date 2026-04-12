import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  CREATED: ['CONFIRMED'],
  CONFIRMED: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['DELIVERED'],
  DELIVERED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    // 1. Validate session is active
    const session = await this.prisma.tableSession.findFirst({
      where: { id: dto.sessionId, isActive: true },
    });
    if (!session) throw new BadRequestException('Table session is not active');

    // 2. Fetch actual prices from DB — never trust frontend
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, isAvailable: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('One or more items are unavailable or do not exist');
    }

    const priceMap = new Map(menuItems.map((m) => [m.id, Number(m.price)]));

    // 3. Calculate total server-side
    const totalPrice = dto.items.reduce((sum, item) => {
      return sum + priceMap.get(item.menuItemId)! * item.quantity;
    }, 0);

    // 4. Calculate Sequential Display Number (FIX 10)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get table with branchId
    const table = await this.prisma.diningTable.findUnique({
      where: { id: dto.tableId },
      select: { branchId: true },
    });
    if (!table) throw new NotFoundException('Table not found');

    const lastOrderToday = await this.prisma.order.findFirst({
      where: {
        table: { branchId: table.branchId },
        createdAt: { gte: today },
      },
      orderBy: { displayNumber: 'desc' },
      select: { displayNumber: true },
    });

    // We store numbering as a string, but calculate as int
    // or we can store it as padded string like "001", "002"
    const nextNum = (parseInt(lastOrderToday?.displayNumber || '0', 10) || 0) + 1;
    const displayNumber = nextNum.toString();

    // 5. Create order + items in a single transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tableId: dto.tableId,
          sessionId: dto.sessionId,
          customerRef: dto.customerRef,
          displayNumber,
          totalPrice,
          notes: dto.notes,
          status: OrderStatus.CREATED,
          items: {
            create: dto.items.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPrice: priceMap.get(item.menuItemId)!,
              note: item.note,
            })),
          },
        },
        include: {
          items: { include: { menuItem: { select: { name: true, imageUrl: true } } } },
          table: { select: { tableNumber: true } },
        },
      });
      return newOrder;
    });

    // 5. Notify kitchen via socket
    this.realtime.emitNewOrder(order);

    return {
      ...order,
      totalPrice: Number(order.totalPrice),
      items: order.items.map((i) => ({ ...i, unitPrice: Number(i.unitPrice) })),
    };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menuItem: { select: { name: true, imageUrl: true } } } },
        table: { select: { tableNumber: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    return {
      ...order,
      totalPrice: Number(order.totalPrice),
      items: order.items.map((i) => ({ ...i, unitPrice: Number(i.unitPrice) })),
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
        items: { include: { menuItem: { select: { name: true } } } },
        table: { select: { tableNumber: true } },
      },
    });

    // Emit realtime update
    this.realtime.emitOrderUpdated(updated);

    return { ...updated, totalPrice: Number(updated.totalPrice) };
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
        items: { include: { menuItem: { select: { name: true } } } },
        table: { select: { tableNumber: true } },
      },
    });

    return orders.map((o) => ({ ...o, totalPrice: Number(o.totalPrice) }));
  }
}
