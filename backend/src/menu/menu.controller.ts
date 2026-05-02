import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MenuService } from './menu.service';

@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get(':branchId/trending')
  @ApiOperation({ summary: 'Get trending menu items for a branch' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTrending(
    @Param('branchId') branchId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.menuService.getTrending(branchId, parsedLimit);
  }

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
