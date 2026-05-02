import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlatformService } from './platform.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../shared/types';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Platform (Super Admin)')
@ApiBearerAuth()
@Controller('platform')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  // ─── Platform Stats ──────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get platform-wide KPI stats' })
  getPlatformStats() {
    return this.platformService.getPlatformStats();
  }

  // ─── Restaurants ─────────────────────────────────────────────────────────

  @Get('restaurants')
  @ApiOperation({ summary: 'List all restaurants on the platform' })
  getRestaurants() {
    return this.platformService.getRestaurants();
  }

  @Get('restaurants/:id')
  @ApiOperation({ summary: 'Get a restaurant with full details' })
  getRestaurant(@Param('id') id: string) {
    return this.platformService.getRestaurant(id);
  }

  @Post('restaurants')
  @ApiOperation({ summary: 'Create a new restaurant with a default branch and admin user' })
  createRestaurant(
    @Body()
    body: {
      name: string;
      slug: string;
      planId: string;
      branchName?: string;
      adminEmail: string;
      adminName: string;
      adminPassword: string;
    },
  ) {
    return this.platformService.createRestaurant(body);
  }

  @Patch('restaurants/:id')
  @ApiOperation({ summary: 'Update restaurant status, subscription, or plan' })
  updateRestaurant(
    @Param('id') id: string,
    @Body() body: { isActive?: boolean; subscriptionStatus?: string; planId?: string },
  ) {
    return this.platformService.updateRestaurant(id, body);
  }

  @Delete('restaurants/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete a restaurant and all its data' })
  deleteRestaurant(@Param('id') id: string) {
    return this.platformService.deleteRestaurant(id);
  }

  // ─── Subscription Plans ───────────────────────────────────────────────────

  @Get('plans')
  @ApiOperation({ summary: 'List all subscription plans' })
  getAllPlans() {
    return this.platformService.getAllPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a new subscription plan' })
  createPlan(
    @Body()
    body: {
      name: string;
      maxBranches: number;
      maxStaff: number;
      priceMonthly: number;
      features?: Record<string, boolean>;
    },
  ) {
    return this.platformService.createPlan(body);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update a subscription plan' })
  updatePlan(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      maxBranches?: number;
      maxStaff?: number;
      priceMonthly?: number;
      features?: Record<string, boolean>;
    },
  ) {
    return this.platformService.updatePlan(id, body);
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a subscription plan (only if no restaurants use it)' })
  deletePlan(@Param('id') id: string) {
    return this.platformService.deletePlan(id);
  }

  // ─── Cross-Tenant Users ───────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users across all restaurants' })
  getAllUsers(
    @Query('restaurantId') restaurantId?: string,
    @Query('role') role?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.platformService.getAllUsers({
      restaurantId,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  // ─── Cross-Tenant Branches ────────────────────────────────────────────────

  @Get('branches')
  @ApiOperation({ summary: 'List all branches across all restaurants' })
  getAllBranches(@Query('restaurantId') restaurantId?: string) {
    return this.platformService.getAllBranches(restaurantId);
  }
}
