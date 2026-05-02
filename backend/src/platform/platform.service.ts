import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Platform Stats ────────────────────────────────────────────────────────

  async getPlatformStats() {
    const [
      totalRestaurants,
      activeRestaurants,
      totalBranches,
      totalUsers,
      totalOrders,
      revenueResult,
      newThisMonth,
      subStatusGroups,
    ] = await Promise.all([
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({ where: { isActive: true } }),
      this.prisma.branch.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { totalPrice: true } }),
      this.prisma.restaurant.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.restaurant.groupBy({
        by: ['subscriptionStatus'],
        _count: { id: true },
      }),
    ]);

    const subscriptionBreakdown: Record<string, number> = {};
    subStatusGroups.forEach((g: any) => {
      subscriptionBreakdown[g.subscriptionStatus] = g._count.id;
    });

    return {
      totalRestaurants,
      activeRestaurants,
      suspendedRestaurants: totalRestaurants - activeRestaurants,
      totalBranches,
      totalUsers,
      totalOrders,
      platformRevenue: Number(revenueResult._sum.totalPrice ?? 0),
      newThisMonth,
      subscriptionBreakdown,
    };
  }

  // ─── Restaurants ────────────────────────────────────────────────────────────

  async getRestaurants() {
    return this.prisma.withRetry(() =>
      this.prisma.restaurant.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          plan: { select: { id: true, name: true, priceMonthly: true } },
          _count: { select: { branches: true, users: true } },
        },
      }),
    );
  }

  async getRestaurant(id: string) {
    const restaurant = await this.prisma.withRetry(() =>
      this.prisma.restaurant.findUnique({
        where: { id },
        include: {
          plan: { select: { id: true, name: true, priceMonthly: true } },
          branches: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              createdAt: true,
              _count: { select: { tables: true, users: true } },
            },
          },
          _count: { select: { users: true } },
        },
      }),
    );

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async createRestaurant(data: {
    name: string;
    slug: string;
    planId: string;
    branchName?: string;
    adminEmail: string;
    adminName: string;
    adminPassword: string;
  }) {
    // Validate slug uniqueness
    const existing = await this.prisma.restaurant.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictException('A restaurant with this slug already exists');

    // Validate plan exists
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: data.planId } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    // Create everything in a transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Create restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: data.name,
          slug: data.slug,
          planId: data.planId,
          isActive: true,
          subscriptionStatus: 'TRIALING',
        },
      });

      // 2. Create default branch (every restaurant starts with 1 branch)
      const branch = await tx.branch.create({
        data: {
          restaurantId: restaurant.id,
          name: data.branchName || `${data.name} - Main Branch`,
          address: 'To be configured',
        },
      });

      // 3. Create RESTAURANT_ADMIN user
      const passwordHash = await bcrypt.hash(data.adminPassword, 12);
      const admin = await tx.user.create({
        data: {
          restaurantId: restaurant.id,
          branchId: branch.id,
          name: data.adminName,
          email: data.adminEmail.toLowerCase(),
          passwordHash,
          role: 'RESTAURANT_ADMIN',
          isActive: true,
        },
        select: { id: true, name: true, email: true, role: true },
      });

      return { restaurant, branch, admin };
    });
  }

  async updateRestaurant(
    id: string,
    data: { isActive?: boolean; subscriptionStatus?: string; planId?: string },
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return this.prisma.withRetry(() =>
      this.prisma.restaurant.update({
        where: { id },
        data: {
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
          ...(data.subscriptionStatus ? { subscriptionStatus: data.subscriptionStatus as any } : {}),
          ...(data.planId ? { planId: data.planId } : {}),
        },
        include: {
          plan: { select: { id: true, name: true } },
        },
      }),
    );
  }

  async deleteRestaurant(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    await this.prisma.restaurant.delete({ where: { id } });
    return { message: 'Restaurant permanently deleted' };
  }

  // ─── Subscription Plans ────────────────────────────────────────────────────

  async getAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { priceMonthly: 'asc' },
      include: { _count: { select: { restaurants: true } } },
    });
  }

  async createPlan(data: {
    name: string;
    maxBranches: number;
    maxStaff: number;
    priceMonthly: number;
    features?: Record<string, boolean>;
  }) {
    return this.prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        maxBranches: data.maxBranches,
        maxStaff: data.maxStaff,
        priceMonthly: data.priceMonthly,
        features: data.features ?? {},
      },
    });
  }

  async updatePlan(
    id: string,
    data: {
      name?: string;
      maxBranches?: number;
      maxStaff?: number;
      priceMonthly?: number;
      features?: Record<string, boolean>;
    },
  ) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    return this.prisma.subscriptionPlan.update({ where: { id }, data });
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { restaurants: true } } },
    });
    if (!plan) throw new NotFoundException('Subscription plan not found');
    if ((plan as any)._count.restaurants > 0) {
      throw new ConflictException('Cannot delete a plan that has active restaurants. Reassign them first.');
    }
    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return { message: 'Plan deleted' };
  }

  // ─── Cross-Tenant Users ────────────────────────────────────────────────────

  async getAllUsers(filters?: { restaurantId?: string; role?: string; isActive?: boolean }) {
    return this.prisma.withRetry(() =>
      this.prisma.user.findMany({
        where: {
          ...(filters?.restaurantId ? { restaurantId: filters.restaurantId } : {}),
          ...(filters?.role ? { role: filters.role as any } : {}),
          ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          restaurantId: true,
          branchId: true,
          restaurant: { select: { id: true, name: true, slug: true } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    );
  }

  // ─── Cross-Tenant Branches ─────────────────────────────────────────────────

  async getAllBranches(restaurantId?: string) {
    return this.prisma.withRetry(() =>
      this.prisma.branch.findMany({
        where: restaurantId ? { restaurantId } : {},
        include: {
          restaurant: { select: { id: true, name: true, slug: true, isActive: true } },
          _count: { select: { tables: true, users: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }
}
