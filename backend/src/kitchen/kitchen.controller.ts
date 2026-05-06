import { Controller, Get, Patch, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrdersService } from '../orders/orders.service';
import { AdminService } from '../admin/admin.service';
import { OrderItemStatus } from '@prisma/client';

@ApiTags('Kitchen')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER', 'KITCHEN', 'STAFF')
@Controller('kitchen')
export class KitchenController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly adminService: AdminService,
  ) {}

  @Get('orders')
  @ApiOperation({ summary: 'Get active kitchen orders' })
  async getKitchenOrders(@Req() req: any, @Query('branchId') branchId: string) {
    const resolvedBranchId = req.user?.branchId || branchId;
    return this.ordersService.getOrdersByBranch(resolvedBranchId);
  }

  @Patch('items/:id/status')
  @ApiOperation({ summary: 'Update status of a single order item' })
  async updateItemStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: OrderItemStatus },
  ) {
    return this.ordersService.updateItemStatus(id, body.status, req.user?.branchId);
  }

  @Patch('orders/:id/move-back')
  @ApiOperation({ summary: 'Move order back to previous status (Undo)' })
  async moveOrderBack(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.moveOrderBack(id, req.user?.branchId);
  }

  @Patch('menu-items/:id/availability')
  @ApiOperation({ summary: 'Toggle menu item availability (Out of Stock)' })
  async toggleAvailability(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { isAvailable: boolean },
  ) {
    const restaurantId = req.user?.restaurantId;
    return this.adminService.toggleAvailability(restaurantId, id, body);
  }
}
