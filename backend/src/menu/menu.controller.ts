import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MenuService } from './menu.service';

@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get(':branchId')
  @ApiOperation({ summary: 'Get full menu for a branch with optional fasting filter' })
  @ApiQuery({ name: 'fasting', required: false, type: Boolean })
  getMenu(
    @Param('branchId') branchId: string,
    @Query('fasting') fasting?: string,
  ) {
    const fastingFilter = fasting === 'true' ? true : fasting === 'false' ? false : undefined;
    return this.menuService.getMenu(branchId, fastingFilter);
  }
}
