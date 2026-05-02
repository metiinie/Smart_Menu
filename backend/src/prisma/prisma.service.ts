import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { tenantStorage } from '../common/tenant/tenant.storage';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this._connectWithRetry(5);
    
    // SaaS Tenant Isolation Middleware
    this.$use(async (params, next) => {
      const context = tenantStorage.getStore();
      const tenantModels = ['Branch', 'Category', 'MenuItem', 'DiningTable', 'Order', 'OrderAudit'];
      
      if (context && context.role !== 'SUPER_ADMIN' && params.model && tenantModels.includes(params.model)) {
        const readWriteActions = ['findUnique', 'findFirst', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany'];
        if (readWriteActions.includes(params.action)) {
          if (!params.args) params.args = {};
          if (!params.args.where) params.args.where = {};
          // Deeply inject the tenant filter
          params.args.where.restaurantId = context.restaurantId;
        }
      }
      return next(params);
    });

    await this._ensureBaselineData();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async _connectWithRetry(maxRetries: number) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Connected to database');
        return;
      } catch (err) {
        this.logger.error(`DB connect attempt ${attempt}/${maxRetries} failed`);
        if (attempt < maxRetries) {
          const delayMs = Math.min(1000 * 2 ** (attempt - 1), 5000);
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }
    }
    throw new Error('Could not connect to database after multiple attempts');
  }

  /**
   * Wraps Prisma operations with retry for transient connectivity issues.
   */
  async withRetry<T>(operation: () => Promise<T>, retries = 2): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (err: any) {
        const isConnectionError =
          err?.code === 'P1001' ||
          err?.code === 'P1002' ||
          err?.code === 'P1017' ||
          err?.message?.includes("Can't reach database server");
        if (isConnectionError && attempt < retries) {
          this.logger.warn(`DB connection issue (attempt ${attempt}/${retries}), retrying...`);
          await new Promise((res) => setTimeout(res, 300 * attempt));
          await this.$connect().catch(() => undefined);
        } else {
          throw err;
        }
      }
    }
    throw new Error('DB operation failed after all retries');
  }

  /**
   * Self-heals empty or partially reset databases so app screens never boot with no staff/menu.
   */
  private async _ensureBaselineData() {
    const branchCount = await this.withRetry(() => this.branch.count());
    if (branchCount === 0) {
      this.logger.warn('No branches found. Bootstrapping baseline data...');

      const branch = await this.withRetry(() =>
        this.branch.create({
          data: {
            name: 'ArifSmart Restaurant',
            address: 'Bole Road, Addis Ababa, Ethiopia',
            phone: '+251 91 234 5678',
          },
        }),
      );

      await this.withRetry(() =>
        this.diningTable.createMany({
          data: Array.from({ length: 10 }, (_, i) => ({
            branchId: branch.id,
            tableNumber: i + 1,
            qrCode: `ARIF-${branch.id.slice(0, 8)}-T${i + 1}`,
          })),
        }),
      );

      const tableOne = await this.withRetry(() =>
        this.diningTable.findUnique({
          where: { branchId_tableNumber: { branchId: branch.id, tableNumber: 1 } },
          select: { id: true },
        }),
      );
      if (tableOne) {
        await this.withRetry(() =>
          this.tableSession.create({
            data: { tableId: tableOne.id, isActive: true },
          }),
        );
      }
    }

    const fallbackBranch = await this.withRetry(() =>
      this.branch.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      }),
    );
    if (!fallbackBranch) return;

    const branchId = fallbackBranch.id;
    const baselineCategories = [
      { name: 'Appetizers', sortOrder: 1, imageUrl: '/images/categories/appetizers.jpg' },
      { name: 'Main Dishes', sortOrder: 2, imageUrl: '/images/categories/main.jpg' },
      { name: 'Fasting Menu', sortOrder: 3, imageUrl: '/images/categories/fasting.jpg' },
      { name: 'Drinks', sortOrder: 4, imageUrl: '/images/categories/drinks.jpg' },
      { name: 'Desserts', sortOrder: 5, imageUrl: '/images/categories/desserts.jpg' },
    ];

    for (const category of baselineCategories) {
      const existing = await this.withRetry(() =>
        this.category.findFirst({
          where: { branchId, name: category.name },
          select: { id: true },
        }),
      );
      if (!existing) {
        await this.withRetry(() =>
          this.category.create({
            data: { ...category, branchId },
          }),
        );
      }
    }

    const allBranchCategories = await this.withRetry(() =>
      this.category.findMany({
        where: { branchId },
        select: { id: true, name: true },
      }),
    );
    const categoryByName = new Map(allBranchCategories.map((c) => [c.name, c.id]));

    const baselineItems = [
      {
        categoryName: 'Appetizers',
        name: 'Sambusa',
        description: 'Crispy fried pastry filled with spiced lentils or meat',
        price: 35,
        isFasting: false,
        imageUrl: '/images/menu/sambusa.png',
      },
      {
        categoryName: 'Main Dishes',
        name: 'Doro Wat',
        description: 'Spicy Ethiopian chicken stew with boiled eggs in berbere sauce',
        price: 280,
        isFasting: false,
        imageUrl: '/images/menu/doro-wat.png',
      },
      {
        categoryName: 'Fasting Menu',
        name: 'Misir Wat',
        description: 'Spiced red lentil stew',
        price: 160,
        isFasting: true,
        imageUrl: null,
      },
      {
        categoryName: 'Drinks',
        name: 'Ethiopian Coffee',
        description: 'Traditional coffee ceremony brew',
        price: 60,
        isFasting: true,
        imageUrl: '/images/menu/coffee.png',
      },
      {
        categoryName: 'Desserts',
        name: 'Baklava',
        description: 'Honey-soaked pastry with mixed nuts',
        price: 90,
        isFasting: false,
        imageUrl: null,
      },
    ];

    for (const item of baselineItems) {
      const categoryId = categoryByName.get(item.categoryName);
      if (!categoryId) continue;

      const existing = await this.withRetry(() =>
        this.menuItem.findFirst({
          where: { categoryId, name: item.name },
          select: { id: true },
        }),
      );
      if (!existing) {
        await this.withRetry(() =>
          this.menuItem.create({
            data: {
              categoryId,
              name: item.name,
              description: item.description,
              price: item.price,
              isAvailable: true,
              isFasting: item.isFasting,
              imageUrl: item.imageUrl,
            },
          }),
        );
      }
    }

    const adminExists = await this.withRetry(() =>
      this.user.findFirst({
        where: { branchId, role: Role.RESTAURANT_ADMIN, isActive: true },
        select: { id: true },
      }),
    );
    if (!adminExists) {
      await this.withRetry(() =>
        this.user.create({
          data: {
            branchId,
            name: 'Arif Manager',
            role: Role.RESTAURANT_ADMIN,
            pinHash: bcrypt.hashSync('1234', 12),
            isActive: true,
          },
        }),
      );
    }

    const kitchenExists = await this.withRetry(() =>
      this.user.findFirst({
        where: { branchId, role: Role.KITCHEN, isActive: true },
        select: { id: true },
      }),
    );
    if (!kitchenExists) {
      await this.withRetry(() =>
        this.user.create({
          data: {
            branchId,
            name: 'Kitchen Staff',
            role: Role.KITCHEN,
            pinHash: bcrypt.hashSync('5678', 12),
            isActive: true,
          },
        }),
      );
    }

    this.logger.log('Baseline data check complete.');
  }
}
