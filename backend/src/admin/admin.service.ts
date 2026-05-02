import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { CreateMenuItemDto, ToggleAvailabilityDto } from './dto/create-menu-item.dto';
import { OrderAuditService } from '../orders/order-audit.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly orderAudit: OrderAuditService,
  ) {}

  // ─── Menu Items ──────────────────────────────────────────────────

  async createMenuItem(dto: CreateMenuItemDto) {
    return this.prisma.menuItem.create({
      data: {
        name: dto.name,
        nameTranslations: dto.nameTranslations || {},
        description: dto.description,
        descriptionTranslations: dto.descriptionTranslations || {},
        price: dto.price,
        isAvailable: dto.isAvailable ?? true,
        isFasting: dto.isFasting ?? false,
        imageUrl: dto.imageUrl,
        model3dUrl: dto.model3dUrl,
        categoryId: dto.categoryId,
        ingredients: {
          create: dto.ingredients?.map(i => ({ name: i.name, detail: i.detail })) || [],
        },
        allergens: {
          create: dto.allergens?.map(a => ({ label: a.label, present: a.present })) || [],
        },
        dietaryTags: {
          create: dto.dietaryTags?.map(d => ({ label: d.label })) || [],
        },
        nutritionSections: {
          create: dto.nutritionSections?.map(s => ({
            title: s.title,
            rows: {
              create: s.rows?.map((r: any) => ({
                nutrient: r.nutrient,
                amount: r.amount,
                dailyValue: r.dailyValue,
                sub: r.sub,
              })) || [],
            },
          })) || [],
        },
      },
    });
  }

  async updateMenuItem(id: string, dto: Partial<CreateMenuItemDto>) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');
    
    return this.prisma.menuItem.update({ 
      where: { id }, 
      data: {
        name: dto.name,
        nameTranslations: dto.nameTranslations,
        description: dto.description,
        descriptionTranslations: dto.descriptionTranslations,
        price: dto.price,
        isAvailable: dto.isAvailable,
        isFasting: dto.isFasting,
        imageUrl: dto.imageUrl,
        model3dUrl: dto.model3dUrl,
        categoryId: dto.categoryId,
        
        ...(dto.ingredients && {
          ingredients: { deleteMany: {}, create: dto.ingredients.map(i => ({ name: i.name, detail: i.detail })) },
        }),
        ...(dto.allergens && {
          allergens: { deleteMany: {}, create: dto.allergens.map(a => ({ label: a.label, present: a.present })) },
        }),
        ...(dto.dietaryTags && {
          dietaryTags: { deleteMany: {}, create: dto.dietaryTags.map(d => ({ label: d.label })) },
        }),
        ...(dto.nutritionSections && {
          nutritionSections: { 
            deleteMany: {}, 
            create: dto.nutritionSections.map(s => ({
              title: s.title,
              rows: {
                create: s.rows?.map((r: any) => ({
                  nutrient: r.nutrient,
                  amount: r.amount,
                  dailyValue: r.dailyValue,
                  sub: r.sub,
                })) || [],
              },
            })) 
          },
        }),
      } 
    });
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
    const items = await this.prisma.withRetry(() =>
      this.prisma.menuItem.findMany({
        where: { category: { branchId } },
        include: { 
          category: { select: { name: true } },
          ingredients: true,
          allergens: true,
          dietaryTags: true,
          nutritionSections: { include: { rows: true } },
        },
        orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
      })
    );
    return items.map((i) => ({ ...i, price: Number(i.price) }));
  }

  // ─── Orders (admin view) ─────────────────────────────────────────

  async getAllOrders(branchId: string) {
    return this.ordersService.getOrdersByBranch(branchId);
  }

  async getOrderAudit(branchId: string, limit = 40) {
    return this.orderAudit.list(branchId, limit);
  }

  // ─── Categories ──────────────────────────────────────────────────

  async getCategories(branchId: string) {
    return this.prisma.withRetry(() =>
      this.prisma.category.findMany({
        where: { branchId },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { items: true } } },
      })
    );
  }

  async createCategory(name: string, branchId: string, sortOrder = 0, imageUrl?: string, nameTranslations?: any) {
    return this.prisma.category.create({ data: { name, branchId, sortOrder, imageUrl, nameTranslations: nameTranslations || {} } });
  }

  async updateCategory(id: string, data: { name?: string; sortOrder?: number; imageUrl?: string; nameTranslations?: any }) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return this.prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }

  // ─── Table Management ────────────────────────────────────────────

  async getTables(branchId: string) {
    return this.prisma.withRetry(() =>
      this.prisma.diningTable.findMany({
        where: { branchId },
        include: {
          sessions: {
            where: { isActive: true },
            select: { id: true, startedAt: true },
            take: 1,
          },
          _count: { select: { orders: true } },
        },
        orderBy: { tableNumber: 'asc' },
      })
    );
  }

  async createTable(branchId: string, tableNumber: number) {
    const qrCode = `${branchId}__table_${tableNumber}__${Date.now()}`;
    return this.prisma.diningTable.create({
      data: { branchId, tableNumber, qrCode },
    });
  }

  async deleteTable(id: string) {
    const table = await this.prisma.diningTable.findUnique({ where: { id } });
    if (!table) throw new NotFoundException('Table not found');
    await this.prisma.diningTable.delete({ where: { id } });
    return { message: 'Table deleted' };
  }

  async toggleTableStatus(id: string, isActive: boolean) {
    const table = await this.prisma.diningTable.findUnique({ where: { id } });
    if (!table) throw new NotFoundException('Table not found');
    return this.prisma.diningTable.update({
      where: { id },
      data: { isActive },
    });
  }

  // ─── Dashboard Analytics ─────────────────────────────────────────

  async getDashboardAnalytics(branchId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    // Total Revenue (all-time)
    const revenueResult = await this.prisma.order.aggregate({
      where: { table: { branchId } },
      _sum: { totalPrice: true },
      _count: { id: true },
    });

    // Today's Revenue
    const todayResult = await this.prisma.order.aggregate({
      where: { table: { branchId }, createdAt: { gte: today } },
      _sum: { totalPrice: true },
      _count: { id: true },
    });

    // This Week Revenue
    const weekResult = await this.prisma.order.aggregate({
      where: { table: { branchId }, createdAt: { gte: weekAgo } },
      _sum: { totalPrice: true },
      _count: { id: true },
    });

    // Active tables count
    const activeTables = await this.prisma.diningTable.count({
      where: { branchId, isActive: true },
    });
    const totalTables = await this.prisma.diningTable.count({
      where: { branchId },
    });

    // Pending orders (not delivered)
    const pendingOrders = await this.prisma.order.count({
      where: {
        table: { branchId },
        status: { notIn: ['DELIVERED'] },
      },
    });

    // Top 10 dishes by quantity sold
    const topItems = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: { order: { table: { branchId } } },
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    // Fetch names for top items
    const menuItemIds = topItems.map((t: any) => t.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, imageUrl: true, price: true },
    });
    const nameMap = new Map(menuItems.map((m: any) => [m.id, m]));

    const topDishes = topItems.map((t: any) => ({
      menuItemId: t.menuItemId,
      name: nameMap.get(t.menuItemId)?.name ?? 'Unknown',
      imageUrl: nameMap.get(t.menuItemId)?.imageUrl ?? null,
      price: Number(nameMap.get(t.menuItemId)?.price ?? 0),
      totalSold: t._sum.quantity ?? 0,
      orderCount: t._count.id ?? 0,
    }));

    // Orders by status breakdown
    const statusGroups = await this.prisma.order.groupBy({
      by: ['status'],
      where: { table: { branchId } },
      _count: { id: true },
    });
    const ordersByStatus: Record<string, number> = {};
    statusGroups.forEach((g: any) => {
      ordersByStatus[g.status] = g._count.id;
    });

    // Revenue by day (last 7 days) — single query instead of 7 sequential ones
    const rawRevByDay = await this.prisma.$queryRaw<
      { day: string; revenue: number; orders: bigint }[]
    >(Prisma.sql`
      SELECT
         TO_CHAR("createdAt"::date, 'YYYY-MM-DD') AS day,
         COALESCE(SUM("totalPrice"), 0)::float     AS revenue,
         COUNT(*)                                   AS orders
       FROM "orders" o
       JOIN "dining_tables" t ON o."tableId" = t."id"
       WHERE t."branchId" = ${branchId}
        AND o."createdAt" >= ${weekAgo}
       GROUP BY "createdAt"::date
       ORDER BY "createdAt"::date ASC
    `);

    // Fill missing days with zero values
    const revenueMap = new Map(rawRevByDay.map((r) => [r.day, r]));
    const revenueByDay: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const row = revenueMap.get(key);
      revenueByDay.push({
        date: key,
        revenue: row ? Number(row.revenue) : 0,
        orders: row ? Number(row.orders) : 0,
      });
    }

    // Recent Ratings
    const recentRatings = await this.prisma.rating.findMany({
      where: { order: { table: { branchId } } },
      include: {
        order: { select: { displayNumber: true, table: { select: { tableNumber: true } } } },
        menuItem: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      totalRevenue: Number(revenueResult._sum.totalPrice ?? 0),
      totalOrders: revenueResult._count.id ?? 0,
      todayRevenue: Number(todayResult._sum.totalPrice ?? 0),
      todayOrders: todayResult._count.id ?? 0,
      weekRevenue: Number(weekResult._sum.totalPrice ?? 0),
      weekOrders: weekResult._count.id ?? 0,
      activeTables,
      totalTables,
      pendingOrders,
      topDishes,
      ordersByStatus,
      revenueByDay,
      recentRatings,
    };
  }

  // ─── Staff Management ────────────────────────────────────────────

  async getStaffUsers(branchId: string) {
    return this.prisma.withRetry(() =>
      this.prisma.user.findMany({
        where: { branchId },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      })
    );
  }

  async createStaffUser(data: { name: string; role: string; pin?: string; email: string; password?: string; branchId: string }) {
    const pinHash = data.pin ? await bcrypt.hash(data.pin, 12) : null;
    const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : null;
    
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        role: data.role as any,
        pinHash,
        passwordHash,
        branchId: data.branchId,
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
  }

  async updateStaffUser(id: string, data: { name?: string; role?: string; email?: string; isActive?: boolean }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Staff user not found');
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.role !== undefined && { role: data.role as any }),
        ...(data.email !== undefined && { email: data.email.toLowerCase() }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
  }

  async deactivateStaffUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Staff user not found');
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return { message: 'Staff user deactivated' };
  }

  async resetStaffPin(id: string, newPin: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Staff user not found');
    const pinHash = await bcrypt.hash(newPin, 12);
    await this.prisma.user.update({ where: { id }, data: { pinHash } });
    return { message: 'PIN reset successfully' };
  }

  async resetStaffPassword(id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Staff user not found');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { message: 'Password reset successfully' };
  }

  // ─── Branch Settings ─────────────────────────────────────────────

  async getBranch(branchId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async updateBranch(branchId: string, data: { name?: string; vatRate?: number; serviceChargeRate?: number }) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundException('Branch not found');
    return this.prisma.branch.update({ where: { id: branchId }, data });
  }
}
