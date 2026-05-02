import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Favorites')
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get(':customerRef')
  @ApiOperation({ summary: 'Get all favorites for a customer' })
  getFavorites(@Param('customerRef') customerRef: string) {
    return this.favoritesService.getFavorites(customerRef);
  }

  @Post()
  @ApiOperation({ summary: 'Add a favorite' })
  addFavorite(@Body() data: { customerRef: string; menuItemId: string }) {
    return this.favoritesService.addFavorite(data.customerRef, data.menuItemId);
  }

  @Delete(':customerRef/:menuItemId')
  @ApiOperation({ summary: 'Remove a favorite' })
  removeFavorite(
    @Param('customerRef') customerRef: string,
    @Param('menuItemId') menuItemId: string,
  ) {
    return this.favoritesService.removeFavorite(customerRef, menuItemId);
  }
}
