import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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

  async createMenuItem(restaurantId: string, dto: CreateMenuItemDto) {
    return this.prisma.menuItem.create({
      data: {
        restaurantId,
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

  async updateMenuItem(restaurantId: string, id: string, dto: Partial<CreateMenuItemDto>, actingBranchId?: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id }, include: { category: true } });
    if (!item) throw new NotFoundException('Menu item not found');
    if (item.restaurantId && item.restaurantId !== restaurantId) throw new ForbiddenException();
    if (actingBranchId && item.category?.branchId !== actingBranchId) throw new ForbiddenException('Menu item does not belong to your branch');
    
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

  async toggleAvailability(restaurantId: string, id: string, dto: ToggleAvailabilityDto, actingBranchId?: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id }, include: { category: true } });
    if (!item) throw new NotFoundException('Menu item not found');
    if (item.restaurantId && item.restaurantId !== restaurantId) throw new ForbiddenException();
    if (actingBranchId && item.category?.branchId !== actingBranchId) throw new ForbiddenException('Menu item does not belong to your branch');
    return this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: dto.isAvailable },
    });
  }

  async deleteMenuItem(restaurantId: string, id: string, actingBranchId?: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id }, include: { category: true } });
    if (!item) throw new NotFoundException('Menu item not found');
    if (item.restaurantId && item.restaurantId !== restaurantId) throw new ForbiddenException();
    if (actingBranchId && item.category?.branchId !== actingBranchId) throw new ForbiddenException('Menu item does not belong to your branch');
    await this.prisma.menuItem.delete({ where: { id } });
    return { message: 'Menu item deleted' };
  }

  async getAllMenuItems(restaurantId: string, branchId?: string) {
    const whereClause: any = { restaurantId };
    if (branchId) {
      whereClause.category = { branchId };
    }
    const items = await this.prisma.withRetry(() =>
      this.prisma.menuItem.findMany({
        where: whereClause,
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

  async getAllOrders(restaurantId: string, branchId?: string) {
    // ordersService needs branchId, or we could fetch by restaurantId
    // Currently ordersService.getOrdersByBranch exists.
    if (branchId) {
      // Validate branch belongs to restaurant
      const branch = await this.prisma.branch.findUnique({ where: { id: branchId }});
      if (branch?.restaurantId !== restaurantId) throw new ForbiddenException();
      return this.ordersService.getOrdersByBranch(branchId);
    }
    // If no branch specified, fetch all orders for restaurant
    const orders = await this.prisma.order.findMany({
      where: { table: { branch: { restaurantId } } },
      include: {
        table: true,
        items: { include: { menuItem: { select: { name: true, imageUrl: true } }, options: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return orders.map((o: any) => ({
      ...o,
      subTotal: Number(o.subTotal),
      vatAmount: Number(o.vatAmount),
      serviceChargeAmount: Number(o.serviceChargeAmount),
      totalPrice: Number(o.totalPrice),
      items: o.items.map((i: any) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        options: i.options?.map((opt: any) => ({
          ...opt,
          optionPrice: Number(opt.optionPrice)
        }))
      }))
    }));
  }

  async getOrderAudit(restaurantId: string, branchId?: string, limit = 40) {
    if (branchId) {
      const branch = await this.prisma.branch.findUnique({ where: { id: branchId }});
      if (branch?.restaurantId !== restaurantId) throw new ForbiddenException();
      return this.orderAudit.list(branchId, limit);
    }
    // Fetch audits for all branches in restaurant
    const audits = await this.prisma.orderAudit.findMany({
      where: { order: { table: { branch: { restaurantId } } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        order: { select: { displayNumber: true, status: true, table: true } },
      },
    });
    return audits;
  }

  // ─── Categories ──────────────────────────────────────────────────

  async getCategories(restaurantId: string, branchId?: string) {
    const whereClause: any = { restaurantId };
    if (branchId) whereClause.branchId = branchId;
    
    return this.prisma.withRetry(() =>
      this.prisma.category.findMany({
        where: whereClause,
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { items: true } } },
      })
    );
  }

  async createCategory(restaurantId: string, name: string, branchId: string, sortOrder = 0, imageUrl?: string, nameTranslations?: any) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId }});
    if (branch?.restaurantId !== restaurantId) throw new ForbiddenException('Branch does not belong to your restaurant');
    
    return this.prisma.category.create({ 
      data: { restaurantId, name, branchId, sortOrder, imageUrl, nameTranslations: nameTranslations || {} } 
    });
  }

  async updateCategory(restaurantId: string, id: string, data: { name?: string; sortOrder?: number; imageUrl?: string; nameTranslations?: any }, actingBranchId?: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    if (cat.restaurantId !== restaurantId) throw new ForbiddenException();
    if (actingBranchId && cat.branchId !== actingBranchId) throw new ForbiddenException('Category does not belong to your branch');
    return this.prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(restaurantId: string, id: string, actingBranchId?: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    if (cat.restaurantId !== restaurantId) throw new ForbiddenException();
    if (actingBranchId && cat.branchId !== actingBranchId) throw new ForbiddenException('Category does not belong to your branch');
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }

  // ─── Table Management ────────────────────────────────────────────

  async getTables(restaurantId: string, branchId?: string) {
    const whereClause: any = { branch: { restaurantId } };
    if (branchId) whereClause.branchId = branchId;
    
    return this.prisma.withRetry(() =>
      this.prisma.diningTable.findMany({
        where: whereClause,
        include: {
          branch: { select: { name: true } },
          sessions: {
            where: { isActive: true },
            include: {
              orders: {
                select: { id: true, status: true, totalPrice: true },
              },
            },
            take: 1,
          },
          _count: { select: { orders: true } },
        },
        orderBy: { tableNumber: 'asc' },
      })
    );
  }

  async createTable(restaurantId: string, branchId: string, tableNumber: number) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId }});
    if (branch?.restaurantId !== restaurantId) throw new ForbiddenException('Branch does not belong to your restaurant');
    
    const qrCode = `${branchId}__table_${tableNumber}__${Date.now()}`;
    return this.prisma.diningTable.create({
      data: { branchId, tableNumber, qrCode },
    });
  }

  async deleteTable(restaurantId: string, id: string, actingBranchId?: string) {
    const table = await this.prisma.diningTable.findUnique({ where: { id }, include: { branch: true } });
    if (!table) throw new NotFoundException('Table not found');
    if (table.branch.restaurantId !== restaurantId) throw new ForbiddenException();
    if (actingBranchId && table.branchId !== actingBranchId) throw new ForbiddenException('Table does not belong to your branch');
    await this.prisma.diningTable.delete({ where: { id } });
    return { message: 'Table deleted' };
  }

  async toggleTableStatus(restaurantId: string, id: string, isActive: boolean, actingBranchId?: string) {
    const table = await this.prisma.diningTable.findUnique({ where: { id }, include: { branch: true } });
    if (!table) throw new NotFoundException('Table not found');
    if (table.branch.restaurantId !== restaurantId) throw new ForbiddenException();
    if (actingBranchId && table.branchId !== actingBranchId) throw new ForbiddenException('Table does not belong to your branch');
    return this.prisma.diningTable.update({
      where: { id },
      data: { isActive },
    });
  }

  // ─── Dashboard Analytics ─────────────────────────────────────────

  async getDashboardAnalytics(restaurantId: string, branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const tableWhere = branchId ? { branchId } : { branch: { restaurantId } };

    // Total Revenue (all-time)
    const revenueResult = await this.prisma.order.aggregate({
      where: { table: tableWhere },
      _sum: { totalPrice: true },
      _count: { id: true },
    });

    // Today's Revenue
    const todayResult = await this.prisma.order.aggregate({
      where: { table: tableWhere, createdAt: { gte: today } },
      _sum: { totalPrice: true },
      _count: { id: true },
    });

    // This Week Revenue
    const weekResult = await this.prisma.order.aggregate({
      where: { table: tableWhere, createdAt: { gte: weekAgo } },
      _sum: { totalPrice: true },
      _count: { id: true },
    });

    // Active tables count
    const activeTables = await this.prisma.diningTable.count({
      where: { ...tableWhere, isActive: true },
    });
    const totalTables = await this.prisma.diningTable.count({
      where: tableWhere,
    });

    // Pending orders (not delivered)
    const pendingOrders = await this.prisma.order.count({
      where: {
        table: tableWhere,
        status: { notIn: ['DELIVERED'] },
      },
    });

    // Top 10 dishes by quantity sold
    const topItems = await this.prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: { order: { table: tableWhere } },
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
      where: { table: tableWhere },
      _count: { id: true },
    });
    const ordersByStatus: Record<string, number> = {};
    statusGroups.forEach((g: any) => {
      ordersByStatus[g.status] = g._count.id;
    });

    // Revenue by day (last 7 days)
    // We adjust the raw query for tenant vs branch scoping
    let rawRevByDay;
    if (branchId) {
      rawRevByDay = await this.prisma.$queryRaw<
        { day: string; revenue: number; orders: bigint }[]
      >(Prisma.sql`
        SELECT
           TO_CHAR(o."createdAt"::date, 'YYYY-MM-DD') AS day,
           COALESCE(SUM(o."totalPrice"), 0)::float     AS revenue,
           COUNT(*)                                   AS orders
         FROM "orders" o
         JOIN "dining_tables" t ON o."tableId" = t."id"
         WHERE t."branchId" = ${branchId}
          AND o."createdAt" >= ${weekAgo}
         GROUP BY o."createdAt"::date
         ORDER BY o."createdAt"::date ASC
      `);
    } else {
      rawRevByDay = await this.prisma.$queryRaw<
        { day: string; revenue: number; orders: bigint }[]
      >(Prisma.sql`
        SELECT
           TO_CHAR(o."createdAt"::date, 'YYYY-MM-DD') AS day,
           COALESCE(SUM(o."totalPrice"), 0)::float     AS revenue,
           COUNT(*)                                   AS orders
         FROM "orders" o
         JOIN "dining_tables" t ON o."tableId" = t."id"
         JOIN "branches" b ON t."branchId" = b."id"
         WHERE b."restaurantId" = ${restaurantId}
          AND o."createdAt" >= ${weekAgo}
         GROUP BY o."createdAt"::date
         ORDER BY o."createdAt"::date ASC
      `);
    }

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
      where: { order: { table: tableWhere } },
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

  async getStaffUsers(restaurantId: string, branchId?: string) {
    const whereClause: any = { restaurantId };
    if (branchId) whereClause.branchId = branchId;
    return this.prisma.withRetry(() =>
      this.prisma.user.findMany({
        where: whereClause,
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, branch: { select: { name: true }} },
        orderBy: { createdAt: 'desc' },
      })
    );
  }

  async createStaffUser(restaurantId: string, data: { name: string; role: string; pin?: string; email: string; password?: string; branchId: string }) {
    // 1. Check max staff limit
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { plan: true, _count: { select: { users: true } } }
    });
    
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    if (restaurant._count.users >= restaurant.plan.maxStaff) {
      throw new BadRequestException(`Staff limit reached. Your current plan allows up to ${restaurant.plan.maxStaff} staff members.`);
    }

    // 2. Ensure branch belongs to restaurant
    const branch = await this.prisma.branch.findUnique({ where: { id: data.branchId }});
    if (branch?.restaurantId !== restaurantId) throw new ForbiddenException('Branch does not belong to your restaurant');

    const pinHash = data.pin ? await bcrypt.hash(data.pin, 12) : null;
    const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : null;
    
    return this.prisma.user.create({
      data: {
        restaurantId,
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

  async updateStaffUser(restaurantId: string, id: string, data: { name?: string; role?: string; email?: string; isActive?: boolean }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Staff user not found');
    if (user.restaurantId !== restaurantId) throw new ForbiddenException();

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

  async deactivateStaffUser(restaurantId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Staff user not found');
    if (user.restaurantId !== restaurantId) throw new ForbiddenException();

    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    return { message: 'Staff user deactivated' };
  }

  async resetStaffPin(restaurantId: string, id: string, newPin: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Staff user not found');
    if (user.restaurantId !== restaurantId) throw new ForbiddenException();

    const pinHash = await bcrypt.hash(newPin, 12);
    await this.prisma.user.update({ where: { id }, data: { pinHash } });
    return { message: 'PIN reset successfully' };
  }

  async resetStaffPassword(restaurantId: string, id: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Staff user not found');
    if (user.restaurantId !== restaurantId) throw new ForbiddenException();

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { message: 'Password reset successfully' };
  }

  // ─── Branch Management ────────────────────────────────────────────

  async getAllBranches(restaurantId: string) {
    return this.prisma.branch.findMany({
      where: { restaurantId },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { tables: true, users: true, categories: true } }
      }
    });
  }

  async createBranch(restaurantId: string, data: { name: string; address: string; phone?: string; vatRate?: number; serviceChargeRate?: number }) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { plan: true, _count: { select: { branches: true } } }
    });
    
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    if (restaurant._count.branches >= restaurant.plan.maxBranches) {
      throw new BadRequestException(`Branch limit reached. Your current plan allows up to ${restaurant.plan.maxBranches} branches.`);
    }

    return this.prisma.branch.create({
      data: {
        restaurantId,
        ...data,
      }
    });
  }

  async getBranch(restaurantId: string, branchId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundException('Branch not found');
    if (branch.restaurantId !== restaurantId) throw new ForbiddenException();
    return branch;
  }

  async updateBranch(restaurantId: string, branchId: string, data: { name?: string; address?: string; phone?: string; vatRate?: number; serviceChargeRate?: number }) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundException('Branch not found');
    if (branch.restaurantId !== restaurantId) throw new ForbiddenException();
    return this.prisma.branch.update({ where: { id: branchId }, data });
  }

  async deleteBranch(restaurantId: string, branchId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundException('Branch not found');
    if (branch.restaurantId !== restaurantId) throw new ForbiddenException();
    
    const count = await this.prisma.branch.count({ where: { restaurantId }});
    if (count <= 1) {
      throw new BadRequestException('Cannot delete the last remaining branch of a restaurant');
    }

    await this.prisma.branch.delete({ where: { id: branchId }});
    return { message: 'Branch deleted' };
  }
}
