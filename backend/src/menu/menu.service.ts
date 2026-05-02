import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenu(branchId: string, fasting?: boolean) {
    console.log(`[MenuService] getMenu called for branchId: ${branchId}, fasting: ${fasting}`);
    let categories = await this.prisma.withRetry(() =>
      this.prisma.category.findMany({
        where: { branchId }, // Branch Isolation Enforcement
        orderBy: { sortOrder: 'asc' },
        include: {
          items: {
            where: {
              isAvailable: true,
              ...(fasting === true ? { isFasting: true } : {}),
              // Items implicitly belong to the branch because they belong to branch categories
            },
            orderBy: { name: 'asc' },
            include: {
              ingredients: true,
              allergens: true,
              dietaryTags: true,
              nutritionSections: { include: { rows: true } },
            },
          },
        },
      }),
    );

    // Recovery fallback for stale branch IDs: if nothing found for requested branch
    // and only one branch exists, serve that branch's menu.
    if (categories.length === 0) {
      const allBranches = await this.prisma.withRetry(() =>
        this.prisma.branch.findMany({
          orderBy: { createdAt: 'asc' },
          select: { id: true },
          take: 2,
        }),
      );
      if (allBranches.length === 1) {
        categories = await this.prisma.withRetry(() =>
          this.prisma.category.findMany({
            where: { branchId: allBranches[0].id },
            orderBy: { sortOrder: 'asc' },
            include: {
              items: {
                where: {
                  isAvailable: true,
                  ...(fasting === true ? { isFasting: true } : {}),
                },
                orderBy: { name: 'asc' },
                include: {
                  ingredients: true,
                  allergens: true,
                  dietaryTags: true,
                  nutritionSections: { include: { rows: true } },
                },
              },
            },
          }),
        );
      }
    }

    // Hidden categories rule: filter categories that don't have available items
    return categories
      .filter((cat: any) => cat.items.length > 0)
      .map((cat: any) => ({
        category: {
          id: cat.id,
          name: cat.name,
          sortOrder: cat.sortOrder,
          imageUrl: cat.imageUrl,
          branchId: cat.branchId,
          createdAt: cat.createdAt,
        },
        items: cat.items.map((item: any) => ({
          ...item,
          price: Number(item.price),
        })),
      }));
  }

  async getTrending(branchId: string, limit: number = 6) {
    const items = await this.prisma.withRetry(() =>
      this.prisma.menuItem.findMany({
        where: {
          isAvailable: true,
          category: {
            branchId,
          },
        },
        include: {
          _count: {
            select: { orderItems: true },
          },
        },
        orderBy: {
          orderItems: {
            _count: 'desc',
          },
        },
        take: limit,
      }),
    );

    return items.map(item => {
      const { _count, ...rest } = item;
      return {
        ...rest,
        price: Number(rest.price),
      };
    });
  }
}
