import { Controller, Get, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

// NOTE: Do NOT import Role from @arifsmart/shared here — that package is ESM-only
// and cannot be required() by the CommonJS NestJS runtime. Use string literals instead.
// The Roles decorator accepts strings; the guard compares user.role (string from JWT).

@ApiTags('Kitchen')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER', 'KITCHEN', 'STAFF')
@Controller('kitchen')
export class KitchenController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('orders')
  @ApiOperation({ summary: 'Get active kitchen orders (CREATED, CONFIRMED, PREPARING, READY)' })
  async getKitchenOrders(@Req() req: any, @Query('branchId') branchId: string) {
    const resolvedBranchId = req.user?.branchId || branchId;
    const orders = await this.prisma.withRetry(() =>
      this.prisma.order.findMany({
        where: {
          table: { branchId: resolvedBranchId },
          status: { in: [OrderStatus.CREATED, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY] },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              menuItem: { select: { id: true, name: true, imageUrl: true } },
              options: true,
            },
          },
          table: { select: { tableNumber: true } },
        },
      }),
    );

    return orders.map((o: any) => ({
      ...o,
      subTotal: Number(o.subTotal),
      vatAmount: Number(o.vatAmount),
      serviceChargeAmount: Number(o.serviceChargeAmount),
      totalPrice: Number(o.totalPrice),
      items: o.items.map((i: any) => ({ ...i, unitPrice: Number(i.unitPrice) })),
    }));
  }
}
