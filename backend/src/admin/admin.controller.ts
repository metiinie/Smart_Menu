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
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Dashboard & Analytics ──────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  getDashboard(@Query('branchId') branchId: string) {
    return this.adminService.getDashboardAnalytics(branchId);
  }

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

  // ─── Categories ──────────────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  getCategories(@Query('branchId') branchId: string) {
    return this.adminService.getCategories(branchId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a category' })
  createCategory(@Body() body: { name: string; branchId: string; sortOrder?: number; imageUrl?: string; nameTranslations?: any }) {
    return this.adminService.createCategory(body.name, body.branchId, body.sortOrder, body.imageUrl, body.nameTranslations);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  updateCategory(@Param('id') id: string, @Body() body: { name?: string; sortOrder?: number; imageUrl?: string; nameTranslations?: any }) {
    return this.adminService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a category' })
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  // ─── Table Management ────────────────────────────────────────────

  @Get('tables')
  @ApiOperation({ summary: 'Get all dining tables' })
  getTables(@Query('branchId') branchId: string) {
    return this.adminService.getTables(branchId);
  }

  @Post('tables')
  @ApiOperation({ summary: 'Create a new dining table' })
  createTable(@Body() body: { branchId: string; tableNumber: number }) {
    return this.adminService.createTable(body.branchId, body.tableNumber);
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
  getAllOrders(@Query('branchId') branchId: string) {
    return this.adminService.getAllOrders(branchId);
  }

  // ─── Staff ───────────────────────────────────────────────────────

  @Get('staff')
  @ApiOperation({ summary: 'Get all staff users' })
  getStaff(@Query('branchId') branchId: string) {
    return this.adminService.getStaffUsers(branchId);
  }

  // ─── Branch Settings ─────────────────────────────────────────────

  @Get('branch')
  @ApiOperation({ summary: 'Get branch details' })
  getBranch(@Query('branchId') branchId: string) {
    return this.adminService.getBranch(branchId);
  }

  @Patch('branch/:id')
  @ApiOperation({ summary: 'Update branch settings' })
  updateBranch(@Param('id') id: string, @Body() body: { name?: string; vatRate?: number; serviceChargeRate?: number }) {
    return this.adminService.updateBranch(id, body);
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
