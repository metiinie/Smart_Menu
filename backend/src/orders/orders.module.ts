import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { OrderAuditService } from './order-audit.service';

@Module({
  imports: [RealtimeModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderAuditService],
  exports: [OrdersService, OrderAuditService],
})
export class OrdersModule {}
