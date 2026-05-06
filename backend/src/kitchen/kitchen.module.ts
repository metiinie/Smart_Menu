import { Module } from '@nestjs/common';
import { KitchenController } from './kitchen.controller';
import { OrdersModule } from '../orders/orders.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [OrdersModule, AdminModule],
  controllers: [KitchenController],
})
export class KitchenModule {}
