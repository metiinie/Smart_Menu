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

// ── Allowed file types for uploads ───────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'model/gltf-binary',   // .glb
  'model/gltf+json',     // .gltf
  'application/octet-stream', // .glb fallback MIME
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
  '.glb', '.gltf',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER', 'STAFF')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
  private resolveBranchId(req: any, fallback?: string) {
    return req.user?.branchId || fallback;
  }

  // ─── Dashboard & Analytics ──────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  getDashboard(@Req() req: any, @Query('branchId') branchId: string) {
    return this.adminService.getDashboardAnalytics(this.resolveBranchId(req, branchId));
  }

  // ─── Menu Items ──────────────────────────────────────────────────

  @Get('menu-items')
  @ApiOperation({ summary: 'Get all menu items (admin view)' })
  getAllMenuItems(@Req() req: any, @Query('branchId') branchId: string) {
    return this.adminService.getAllMenuItems(this.resolveBranchId(req, branchId));
  }

  @Post('menu-items')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new menu item' })
  createMenuItem(@Body() dto: CreateMenuItemDto) {
    return this.adminService.createMenuItem(dto);
  }

  @Patch('menu-items/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
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
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete a menu item' })
  deleteMenuItem(@Param('id') id: string) {
    return this.adminService.deleteMenuItem(id);
  }

  // ─── Categories ──────────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  getCategories(@Req() req: any, @Query('branchId') branchId: string) {
    return this.adminService.getCategories(this.resolveBranchId(req, branchId));
  }

  @Post('categories')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a category' })
  createCategory(
    @Req() req: any,
    @Body() body: { name: string; branchId?: string; sortOrder?: number; imageUrl?: string; nameTranslations?: any },
  ) {
    const branchId = this.resolveBranchId(req, body.branchId);
    return this.adminService.createCategory(body.name, branchId, body.sortOrder, body.imageUrl, body.nameTranslations);
  }

  @Patch('categories/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(@Param('id') id: string, @Body() body: { name?: string; sortOrder?: number; imageUrl?: string; nameTranslations?: any }) {
    return this.adminService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete a category' })
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  // ─── Table Management ────────────────────────────────────────────

  @Get('tables')
  @ApiOperation({ summary: 'Get all dining tables' })
  getTables(@Req() req: any, @Query('branchId') branchId: string) {
    return this.adminService.getTables(this.resolveBranchId(req, branchId));
  }

  @Post('tables')
  @ApiOperation({ summary: 'Create a new dining table' })
  createTable(@Req() req: any, @Body() body: { branchId?: string; tableNumber: number }) {
    const branchId = this.resolveBranchId(req, body.branchId);
    return this.adminService.createTable(branchId, body.tableNumber);
  }

  @Patch('tables/:id/status')
  @ApiOperation({ summary: 'Toggle table active status' })
  toggleTableStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.toggleTableStatus(id, body.isActive);
  }

  @Delete('tables/:id')
  @ApiOperation({ summary: 'Delete a dining table' })
  deleteTable(@Param('id') id: string) {
    return this.adminService.deleteTable(id);
  }

  // ─── Orders ──────────────────────────────────────────────────────

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders (admin view)' })
  getAllOrders(@Req() req: any, @Query('branchId') branchId: string) {
    return this.adminService.getAllOrders(this.resolveBranchId(req, branchId));
  }

  @Get('orders/audit')
  @ApiOperation({ summary: 'Get recent order audit events (admin debug)' })
  getOrderAudit(@Req() req: any, @Query('branchId') branchId: string, @Query('limit') limit?: string) {
    const resolvedLimit = limit ? Number(limit) : undefined;
    return this.adminService.getOrderAudit(this.resolveBranchId(req, branchId), resolvedLimit);
  }

  // ─── Staff ───────────────────────────────────────────────────────

  @Get('staff')
  @ApiOperation({ summary: 'Get all staff users' })
  getStaff(@Req() req: any, @Query('branchId') branchId: string) {
    return this.adminService.getStaffUsers(this.resolveBranchId(req, branchId));
  }

  @Post('staff')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new staff user' })
  createStaff(
    @Req() req: any,
    @Body() body: { name: string; role: string; email: string; pin?: string; password?: string; branchId?: string },
  ) {
    const branchId = this.resolveBranchId(req, body.branchId);
    return this.adminService.createStaffUser({ ...body, branchId });
  }

  @Patch('staff/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update a staff user' })
  updateStaff(
    @Param('id') id: string,
    @Body() body: { name?: string; role?: string; email?: string; isActive?: boolean },
  ) {
    return this.adminService.updateStaffUser(id, body);
  }

  @Delete('staff/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Deactivate a staff user' })
  deleteStaff(@Param('id') id: string) {
    return this.adminService.deactivateStaffUser(id);
  }

  @Post('staff/:id/reset-pin')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Reset a staff user PIN' })
  resetStaffPin(@Param('id') id: string, @Body() body: { newPin: string }) {
    return this.adminService.resetStaffPin(id, body.newPin);
  }

  @Post('staff/:id/reset-password')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Reset a staff user password' })
  resetStaffPassword(@Param('id') id: string, @Body() body: { newPassword: string }) {
    return this.adminService.resetStaffPassword(id, body.newPassword);
  }

  // ─── Branch Settings ─────────────────────────────────────────────

  @Get('branch')
  @ApiOperation({ summary: 'Get branch details' })
  getBranch(@Req() req: any, @Query('branchId') branchId: string) {
    return this.adminService.getBranch(this.resolveBranchId(req, branchId));
  }

  @Patch('branch/:id')
  @Roles('SUPER_ADMIN', 'RESTAURANT_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update branch settings' })
  updateBranch(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; vatRate?: number; serviceChargeRate?: number },
  ) {
    const branchId = this.resolveBranchId(req, id);
    return this.adminService.updateBranch(branchId, body);
  }

  // ─── Uploads ──────────────────────────────────────────────────────

  @Post('upload')
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
