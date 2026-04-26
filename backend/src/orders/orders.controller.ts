import { Controller, Post, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';

/**
 * IMPORTANT — route registration order:
 * NestJS resolves routes top-to-bottom. Static path segments must be declared
 * BEFORE parameterised routes that share the same prefix.
 *   ✅  GET /orders/my-orders/active   (static — registered first)
 *   ✅  GET /orders/history/customer   (static — registered first)
 *   ✅  GET /orders/:id               (param — registered last)
 *
 * Reversing this order causes NestJS to treat "my-orders" and "history" as
 * an orderId, returning a 404/500 instead of the intended handler.
 */

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ── Customer: place a new order ────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Place a new order (customers)' })
  createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  // ── Static routes MUST come before /:id ────────────────────────────────

  @Get('my-orders/active')
  @ApiOperation({ summary: "Get customer's active orders (persistence check)" })
  getMyOrders(
    @Query('branchId')    branchId: string,
    @Query('sessionId')   sessionId: string,
    @Query('customerRef') customerRef: string,
  ) {
    return this.ordersService.getOrdersByBranch(branchId, undefined, undefined, sessionId, customerRef);
  }

  @Get('history/customer')
  @ApiOperation({ summary: 'Get order history by customerRef' })
  getOrderHistory(@Query('customerRef') customerRef: string) {
    return this.ordersService.getOrderHistory(customerRef);
  }

  // ── List all orders for a branch (staff) ───────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List orders by branch (staff only)' })
  getOrdersByBranch(
    @Query('branchId')  branchId: string,
    @Query('status')    status?: string,
    @Query('tableId')   tableId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.ordersService.getOrdersByBranch(branchId, status, tableId, sessionId);
  }

  // ── Parameterised routes AFTER all static routes ────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get order details + status' })
  getOrder(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (staff only)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  // ── Ratings ────────────────────────────────────────────────────────────

  @Post(':id/rate')
  @ApiOperation({ summary: 'Submit a rating for an order' })
  submitRating(
    @Param('id') orderId: string,
    @Body() body: { rating: number; comment?: string; customerRef: string; menuItemId?: string },
  ) {
    return this.ordersService.submitRating({
      orderId,
      menuItemId: body.menuItemId,
      rating: body.rating,
      comment: body.comment,
      customerRef: body.customerRef,
    });
  }
}
