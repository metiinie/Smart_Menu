import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        service: 'ArifSmart Menu API',
        database: 'connected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'degraded',
        service: 'ArifSmart Menu API',
        database: 'disconnected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };
    }
  }
}
