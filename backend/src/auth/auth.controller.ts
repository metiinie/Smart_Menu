import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PinLoginDto } from './dto/pin-login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('pin-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with staff PIN' })
  pinLogin(@Body() dto: PinLoginDto) {
    return this.authService.pinLogin(dto);
  }

  @Get('staff')
  @ApiOperation({ summary: 'List staff for login screen (no sensitive data)' })
  listStaff(@Query('branchId') branchId: string) {
    return this.authService.listStaff(branchId);
  }
}
