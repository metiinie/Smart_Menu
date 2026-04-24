import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@ApiTags('Kitchen')
@Controller('kitchen')
export class KitchenController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('orders')
  @ApiOperation({ summary: 'Get active kitchen orders (CREATED, CONFIRMED, PREPARING)' })
  async getKitchenOrders(@Query('branchId') branchId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        table: { branchId },
        status: { in: [OrderStatus.CREATED, OrderStatus.CONFIRMED, OrderStatus.PREPARING] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        items: {
          include: { menuItem: { select: { id: true, name: true, imageUrl: true } } },
        },
        table: { select: { tableNumber: true } },
      },
    });

    return orders.map((o: any) => ({
      ...o,
      totalPrice: Number(o.totalPrice),
      items: o.items.map((i: any) => ({ ...i, unitPrice: Number(i.unitPrice) })),
    }));
  }
}
