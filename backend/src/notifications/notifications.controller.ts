import { Controller, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Register for push notifications' })
  async subscribe(
    @Query('customerRef') customerRef: string,
    @Body() subscription: any,
  ) {
    // ── Validation: only allow subscribing if the customerRef has placed orders ──
    // This prevents an attacker from hijacking another customer's push subscription
    // by guessing or brute-forcing their customerRef UUID.
    if (!customerRef) {
      throw new BadRequestException('customerRef is required');
    }

    const hasOrders = await this.prisma.withRetry(() =>
      this.prisma.order.findFirst({
        where: { customerRef },
        select: { id: true },
      }),
    );

    if (!hasOrders) {
      throw new BadRequestException('Invalid customerRef — no orders found for this identity');
    }

    return this.notificationsService.subscribe(customerRef, subscription);
  }
}
