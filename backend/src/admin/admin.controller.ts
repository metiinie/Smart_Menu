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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateMenuItemDto, ToggleAvailabilityDto } from './dto/create-menu-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'model/gltf-binary', 'model/gltf+json', 'application/octet-stream',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.glb', '.gltf']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER', 'STAFF')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private resolveRestaurantId(req: any): string {
    const rId = req.user?.restaurantId;
    if (!rId) throw new BadRequestException('No restaurant context found for user');
    return rId;
  }

  private resolveBranchId(req: any, fallback?: string) {
    return req.user?.branchId || fallback;
  }

  // ─── Dashboard & Analytics ──────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  getDashboard(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.adminService.getDashboardAnalytics(this.resolveRestaurantId(req), branchId || this.resolveBranchId(req, undefined));
  }

  // ─── Menu Items ──────────────────────────────────────────────────

  @Get('menu-items')
  @ApiOperation({ summary: 'Get all menu items (admin view)' })
  getAllMenuItems(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.adminService.getAllMenuItems(this.resolveRestaurantId(req), branchId || this.resolveBranchId(req, undefined));
  }

  @Post('menu-items')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new menu item' })
  createMenuItem(@Req() req: any, @Body() dto: CreateMenuItemDto) {
    return this.adminService.createMenuItem(this.resolveRestaurantId(req), dto);
  }

  @Patch('menu-items/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update a menu item' })
  updateMenuItem(@Req() req: any, @Param('id') id: string, @Body() dto: Partial<CreateMenuItemDto>) {
    return this.adminService.updateMenuItem(this.resolveRestaurantId(req), id, dto, req.user?.branchId);
  }

  @Patch('menu-items/:id/availability')
  @ApiOperation({ summary: 'Toggle item availability' })
  toggleAvailability(@Req() req: any, @Param('id') id: string, @Body() dto: ToggleAvailabilityDto) {
    return this.adminService.toggleAvailability(this.resolveRestaurantId(req), id, dto, req.user?.branchId);
  }

  @Delete('menu-items/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete a menu item' })
  deleteMenuItem(@Req() req: any, @Param('id') id: string) {
    return this.adminService.deleteMenuItem(this.resolveRestaurantId(req), id, req.user?.branchId);
  }

  // ─── Categories ──────────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  getCategories(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.adminService.getCategories(this.resolveRestaurantId(req), branchId || this.resolveBranchId(req, undefined));
  }

  @Post('categories')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a category' })
  createCategory(
    @Req() req: any,
    @Body() body: { name: string; branchId?: string; sortOrder?: number; imageUrl?: string; nameTranslations?: any },
  ) {
    const branchId = this.resolveBranchId(req, body.branchId);
    if (!branchId) throw new BadRequestException('branchId is required');
    return this.adminService.createCategory(this.resolveRestaurantId(req), body.name, branchId, body.sortOrder, body.imageUrl, body.nameTranslations);
  }

  @Patch('categories/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(@Req() req: any, @Param('id') id: string, @Body() body: { name?: string; sortOrder?: number; imageUrl?: string; nameTranslations?: any }) {
    return this.adminService.updateCategory(this.resolveRestaurantId(req), id, body, req.user?.branchId);
  }

  @Delete('categories/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete a category' })
  deleteCategory(@Req() req: any, @Param('id') id: string) {
    return this.adminService.deleteCategory(this.resolveRestaurantId(req), id, req.user?.branchId);
  }

  // ─── Table Management ────────────────────────────────────────────

  @Get('tables')
  @ApiOperation({ summary: 'Get all dining tables' })
  getTables(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.adminService.getTables(this.resolveRestaurantId(req), branchId || this.resolveBranchId(req, undefined));
  }

  @Post('tables')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new dining table' })
  createTable(@Req() req: any, @Body() body: { branchId?: string; tableNumber: number }) {
    const branchId = this.resolveBranchId(req, body.branchId);
    if (!branchId) throw new BadRequestException('branchId is required');
    return this.adminService.createTable(this.resolveRestaurantId(req), branchId, body.tableNumber);
  }

  @Patch('tables/:id/status')
  @ApiOperation({ summary: 'Toggle table active status' })
  toggleTableStatus(@Req() req: any, @Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.toggleTableStatus(this.resolveRestaurantId(req), id, body.isActive, req.user?.branchId);
  }

  @Delete('tables/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete a dining table' })
  deleteTable(@Req() req: any, @Param('id') id: string) {
    return this.adminService.deleteTable(this.resolveRestaurantId(req), id, req.user?.branchId);
  }

  // ─── Orders ──────────────────────────────────────────────────────

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders (admin view)' })
  getAllOrders(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.adminService.getAllOrders(this.resolveRestaurantId(req), branchId || this.resolveBranchId(req, undefined));
  }

  @Get('orders/audit')
  @ApiOperation({ summary: 'Get recent order audit events (admin debug)' })
  getOrderAudit(@Req() req: any, @Query('branchId') branchId?: string, @Query('limit') limit?: string) {
    const resolvedLimit = limit ? Number(limit) : undefined;
    return this.adminService.getOrderAudit(this.resolveRestaurantId(req), branchId || this.resolveBranchId(req, undefined), resolvedLimit);
  }

  // ─── Staff ───────────────────────────────────────────────────────

  @Get('users')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN')
  @ApiOperation({ summary: 'Get all staff users' })
  getStaff(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.adminService.getStaffUsers(this.resolveRestaurantId(req), branchId || this.resolveBranchId(req, undefined));
  }

  @Post('users')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN')
  @ApiOperation({ summary: 'Create a new staff user' })
  createStaff(
    @Req() req: any,
    @Body() body: { name: string; role: string; email: string; pin?: string; password?: string; branchId?: string },
  ) {
    const branchId = this.resolveBranchId(req, body.branchId);
    if (!branchId) throw new BadRequestException('branchId is required');
    return this.adminService.createStaffUser(this.resolveRestaurantId(req), { ...body, branchId });
  }

  @Patch('users/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN')
  @ApiOperation({ summary: 'Update a staff user' })
  updateStaff(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; role?: string; email?: string; isActive?: boolean },
  ) {
    return this.adminService.updateStaffUser(this.resolveRestaurantId(req), id, body);
  }

  @Delete('users/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN')
  @ApiOperation({ summary: 'Deactivate a staff user' })
  deleteStaff(@Req() req: any, @Param('id') id: string) {
    return this.adminService.deactivateStaffUser(this.resolveRestaurantId(req), id);
  }

  @Post('users/:id/reset-pin')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Reset a staff user PIN' })
  resetStaffPin(@Req() req: any, @Param('id') id: string, @Body() body: { newPin: string }) {
    return this.adminService.resetStaffPin(this.resolveRestaurantId(req), id, body.newPin);
  }

  @Post('users/:id/reset-password')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Reset a staff user password' })
  resetStaffPassword(@Req() req: any, @Param('id') id: string, @Body() body: { newPassword: string }) {
    return this.adminService.resetStaffPassword(this.resolveRestaurantId(req), id, body.newPassword);
  }

  // ─── Branches ────────────────────────────────────────────────────

  @Get('branches')
  @Roles('RESTAURANT_ADMIN')
  @ApiOperation({ summary: 'Get all branches for the restaurant' })
  getBranches(@Req() req: any) {
    return this.adminService.getAllBranches(this.resolveRestaurantId(req));
  }

  @Post('branches')
  @Roles('RESTAURANT_ADMIN')
  @ApiOperation({ summary: 'Create a new branch' })
  createBranch(
    @Req() req: any,
    @Body() body: { name: string; address: string; phone?: string; vatRate?: number; serviceChargeRate?: number }
  ) {
    return this.adminService.createBranch(this.resolveRestaurantId(req), body);
  }

  @Get('branches/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get branch details' })
  getBranch(@Req() req: any, @Param('id') id: string) {
    return this.adminService.getBranch(this.resolveRestaurantId(req), id);
  }

  @Patch('branches/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update branch settings' })
  updateBranch(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; address?: string; phone?: string; vatRate?: number; serviceChargeRate?: number },
  ) {
    return this.adminService.updateBranch(this.resolveRestaurantId(req), id, body);
  }

  @Delete('branches/:id')
  @Roles('RESTAURANT_ADMIN')
  @ApiOperation({ summary: 'Delete branch' })
  deleteBranch(@Req() req: any, @Param('id') id: string) {
    return this.adminService.deleteBranch(this.resolveRestaurantId(req), id);
  }

  // ─── Uploads ──────────────────────────────────────────────────────

  @Post('upload')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Upload an asset (image or 3D model, max 5MB)' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (ALLOWED_MIME_TYPES.has(file.mimetype) || ALLOWED_EXTENSIONS.has(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(
            `File type not allowed. Accepted: ${[...ALLOWED_EXTENSIONS].join(', ')}`,
          ), false);
        }
      },
    }),
  )
  uploadAsset(@UploadedFile() file: any, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${file.filename}`;
    return { url: fileUrl };
  }
}
