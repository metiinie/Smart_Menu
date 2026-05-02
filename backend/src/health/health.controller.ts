import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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

  @Get('db')
  @ApiOperation({ summary: 'Detailed database health and baseline-data diagnostics' })
  async dbDiagnostics() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      const [
        branchCount,
        tableCount,
        categoryCount,
        menuItemCount,
        activeStaffCount,
        adminCount,
        kitchenCount,
      ] = await Promise.all([
        this.prisma.withRetry(() => this.prisma.branch.count()),
        this.prisma.withRetry(() => this.prisma.diningTable.count()),
        this.prisma.withRetry(() => this.prisma.category.count()),
        this.prisma.withRetry(() => this.prisma.menuItem.count()),
        this.prisma.withRetry(() => this.prisma.user.count({ where: { isActive: true } })),
        this.prisma.withRetry(() =>
          this.prisma.user.count({ where: { isActive: true, role: 'RESTAURANT_ADMIN' } }),
        ),
        this.prisma.withRetry(() =>
          this.prisma.user.count({ where: { isActive: true, role: 'KITCHEN' } }),
        ),
      ]);

      const hasMinimumBaseline =
        branchCount > 0 &&
        tableCount > 0 &&
        categoryCount > 0 &&
        menuItemCount > 0 &&
        adminCount > 0 &&
        kitchenCount > 0;

      return {
        status: hasMinimumBaseline ? 'ok' : 'degraded',
        service: 'ArifSmart Menu API',
        database: 'connected',
        baseline: {
          hasMinimumData: hasMinimumBaseline,
          expected: {
            branches: '>= 1',
            tables: '>= 1',
            categories: '>= 1',
            menuItems: '>= 1',
            activeAdminUsers: '>= 1',
            activeKitchenUsers: '>= 1',
          },
        },
        counts: {
          branches: branchCount,
          tables: tableCount,
          categories: categoryCount,
          menuItems: menuItemCount,
          activeStaff: activeStaffCount,
          activeAdmins: adminCount,
          activeKitchenUsers: kitchenCount,
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        service: 'ArifSmart Menu API',
        database: 'disconnected',
        error: error?.message ?? 'Database diagnostics failed',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };
    }
  }
}
