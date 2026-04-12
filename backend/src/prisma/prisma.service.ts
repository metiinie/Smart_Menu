import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    let retries = 5;
    while (retries > 0) {
      try {
        await this.$connect();
        console.log('✅ Connected to Database');
        return;
      } catch (err) {
        retries--;
        console.error(`❌ Database connection failed. Retrying... (${retries} attempts left)`);
        await new Promise((res) => setTimeout(res, 3000));
      }
    }
    throw new Error('Could not connect to database after multiple attempts');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
