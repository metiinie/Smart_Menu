import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Place a new order (customers)' })
  createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details + status' })
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }

  @Get('my-orders/active')
  @ApiOperation({ summary: 'Get customer active orders (persistence check)' })
  getMyOrders(
    @Query('branchId') branchId: string,
    @Query('sessionId') sessionId: string,
    @Query('customerRef') customerRef: string,
  ) {
    return this.ordersService.getOrdersByBranch(branchId, undefined, undefined, sessionId, customerRef);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (staff only)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders by branch (staff only)' })
  getOrdersByBranch(
    @Query('branchId') branchId: string,
    @Query('status') status?: string,
    @Query('tableId') tableId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.ordersService.getOrdersByBranch(branchId, status, tableId, sessionId);
  }
}
