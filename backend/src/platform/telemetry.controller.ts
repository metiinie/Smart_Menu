import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Telemetry')
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly platformService: PlatformService) {}

  // ─── Public Ingest Endpoint ────────────────────────────────────────────────

  @Post('error')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Public endpoint to ingest frontend crash logs' })
  logError(
    @Body()
    body: {
      message: string;
      stackTrace?: string;
      url: string;
      userAgent?: string;
      userId?: string;
      restaurantId?: string;
      branchId?: string;
    },
  ) {
    return this.platformService.logFrontendError(body);
  }

  // ─── Super Admin Endpoints ─────────────────────────────────────────────────

  @Get('errors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all frontend errors' })
  getErrors(
    @Query('resolved') resolved?: string,
    @Query('restaurantId') restaurantId?: string,
  ) {
    return this.platformService.getFrontendErrors({
      resolved: resolved !== undefined ? resolved === 'true' : undefined,
      restaurantId,
    });
  }

  @Patch('errors/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark an error as resolved' })
  resolveError(@Param('id') id: string) {
    return this.platformService.resolveFrontendError(id);
  }
}
