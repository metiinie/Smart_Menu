import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenu(branchId: string, fasting?: boolean) {
    console.log(`[MenuService] getMenu called for branchId: ${branchId}, fasting: ${fasting}`);
    const categories = await this.prisma.category.findMany({
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
        },
      },
    });

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
}
