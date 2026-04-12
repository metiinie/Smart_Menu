import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateMenuItemDto, ToggleAvailabilityDto } from './dto/create-menu-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Menu Items ──────────────────────────────────────────────────

  @Get('menu-items')
  @ApiOperation({ summary: 'Get all menu items (admin view)' })
  getAllMenuItems(@Query('branchId') branchId: string) {
    return this.adminService.getAllMenuItems(branchId);
  }

  @Post('menu-items')
  @ApiOperation({ summary: 'Create a new menu item' })
  createMenuItem(@Body() dto: CreateMenuItemDto) {
    return this.adminService.createMenuItem(dto);
  }

  @Patch('menu-items/:id')
  @ApiOperation({ summary: 'Update a menu item' })
  updateMenuItem(@Param('id') id: string, @Body() dto: Partial<CreateMenuItemDto>) {
    return this.adminService.updateMenuItem(id, dto);
  }

  @Patch('menu-items/:id/availability')
  @ApiOperation({ summary: 'Toggle item availability' })
  toggleAvailability(@Param('id') id: string, @Body() dto: ToggleAvailabilityDto) {
    return this.adminService.toggleAvailability(id, dto);
  }

  @Delete('menu-items/:id')
  @ApiOperation({ summary: 'Delete a menu item' })
  deleteMenuItem(@Param('id') id: string) {
    return this.adminService.deleteMenuItem(id);
  }

  // ─── Orders ──────────────────────────────────────────────────────

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders (admin view)' })
  getAllOrders(@Query('branchId') branchId: string) {
    return this.adminService.getAllOrders(branchId);
  }

  // ─── Categories ──────────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  getCategories(@Query('branchId') branchId: string) {
    return this.adminService.getCategories(branchId);
  }
}
