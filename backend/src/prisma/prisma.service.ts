import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this._connectWithRetry(15);
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async _connectWithRetry(maxRetries: number) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('✅ Connected to Database');
        return;
      } catch (err) {
        this.logger.error(`❌ DB connect attempt ${attempt}/${maxRetries} failed`);
        if (attempt < maxRetries) {
          await new Promise((res) => setTimeout(res, 3000));
        }
      }
    }
    throw new Error('Could not connect to database after multiple attempts');
  }

  /**
   * Wraps a Prisma operation with automatic reconnect on P1001 (can't reach server).
   * Neon Postgres can go to sleep between requests — this wakes it back up.
   */
  async withRetry<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (err: any) {
        const isConnectionError = err?.code === 'P1001' || err?.message?.includes("Can't reach database server");
        if (isConnectionError && attempt < retries) {
          this.logger.warn(`⚠️ DB connection lost (attempt ${attempt}/${retries}). Reconnecting...`);
          await this.$disconnect().catch(() => {});
          await new Promise((res) => setTimeout(res, 2000 * attempt));
          await this._connectWithRetry(5);
        } else {
          throw err;
        }
      }
    }
    throw new Error('DB operation failed after all retries');
  }
}
