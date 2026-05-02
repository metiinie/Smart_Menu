import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async getFavorites(customerRef: string) {
    const favorites = await this.prisma.withRetry(() =>
      this.prisma.favorite.findMany({
        where: { customerRef },
        include: {
          menuItem: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
    
    return favorites.map((fav: any) => ({
      menuItemId: fav.menuItemId,
      name: fav.menuItem.name,
      price: Number(fav.menuItem.price),
      imageUrl: fav.menuItem.imageUrl,
      description: fav.menuItem.description,
      addedAt: fav.createdAt.getTime(),
    }));
  }

  async addFavorite(customerRef: string, menuItemId: string) {
    // Upsert to prevent duplicate unique constraint errors
    return this.prisma.withRetry(() =>
      this.prisma.favorite.upsert({
        where: {
          customerRef_menuItemId: {
            customerRef,
            menuItemId,
          },
        },
        update: {},
        create: {
          customerRef,
          menuItemId,
        },
      }),
    );
  }

  async removeFavorite(customerRef: string, menuItemId: string) {
    try {
      return await this.prisma.withRetry(() =>
        this.prisma.favorite.delete({
          where: {
            customerRef_menuItemId: {
              customerRef,
              menuItemId,
            },
          },
        }),
      );
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }
}
