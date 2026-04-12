import { Controller, Get, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TableSessionsService } from './table-sessions.service';

@ApiTags('Table Sessions & Context')
@Controller()
export class TableSessionsController {
  constructor(private readonly tableSessionsService: TableSessionsService) {}

  @Get('table-context/:branchId/:tableId')
  @ApiOperation({ summary: 'Get or initialize table context' })
  async getTableContext(
    @Param('branchId') branchId: string,
    @Param('tableId') tableId: string,
  ) {
    return this.tableSessionsService.getTableContext(branchId, tableId);
  }

  @Patch('table-sessions/:id/close')
  @ApiOperation({ summary: 'Close an active table session' })
  async closeSession(@Param('id') id: string) {
    return this.tableSessionsService.closeSession(id);
  }
}
