import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { CreateMenuItemDto, ToggleAvailabilityDto } from './dto/create-menu-item.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {}

  // ─── Menu Items ──────────────────────────────────────────────────

  async createMenuItem(dto: CreateMenuItemDto) {
    return this.prisma.menuItem.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        isAvailable: dto.isAvailable ?? true,
        isFasting: dto.isFasting ?? false,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
      },
    });
  }

  async updateMenuItem(id: string, dto: Partial<CreateMenuItemDto>) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');
    return this.prisma.menuItem.update({ where: { id }, data: dto });
  }

  async toggleAvailability(id: string, dto: ToggleAvailabilityDto) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');
    return this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: dto.isAvailable },
    });
  }

  async deleteMenuItem(id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');
    await this.prisma.menuItem.delete({ where: { id } });
    return { message: 'Menu item deleted' };
  }

  async getAllMenuItems(branchId: string) {
    const items = await this.prisma.menuItem.findMany({
      where: { category: { branchId } },
      include: { category: { select: { name: true } } },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });
    return items.map((i) => ({ ...i, price: Number(i.price) }));
  }

  // ─── Orders (admin view) ─────────────────────────────────────────

  async getAllOrders(branchId: string) {
    return this.ordersService.getOrdersByBranch(branchId);
  }

  // ─── Categories ──────────────────────────────────────────────────

  async getCategories(branchId: string) {
    return this.prisma.category.findMany({
      where: { branchId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(name: string, branchId: string, sortOrder = 0) {
    return this.prisma.category.create({ data: { name, branchId, sortOrder } });
  }
}
