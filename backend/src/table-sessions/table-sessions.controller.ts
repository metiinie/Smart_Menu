import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TableSessionsService } from './table-sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../shared/types';

@ApiTags('Table Sessions & Context')
@Controller()
export class TableSessionsController {
  constructor(private readonly tableSessionsService: TableSessionsService) {}

  /**
   * Public endpoint — customers hit this when they scan a QR code.
   * No auth required: the QR code contains branchId + tableId.
   */
  @Get('table-context/:branchId/:tableId')
  @ApiOperation({ summary: 'Get or initialize table context (public — QR scan entry point)' })
  async getTableContext(
    @Param('branchId') branchId: string,
    @Param('tableId') tableId: string,
  ) {
    return this.tableSessionsService.getTableContext(branchId, tableId);
  }

  /**
   * Staff-only — closing a session resets the table for the next customer.
   * Must be authenticated as ADMIN or KITCHEN staff.
   */
  @Patch('table-sessions/:id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.RESTAURANT_ADMIN, Role.MANAGER, Role.KITCHEN, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close an active table session (staff only)' })
  async closeSession(@Param('id') id: string) {
    return this.tableSessionsService.closeSession(id);
  }
}
