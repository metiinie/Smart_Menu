import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PinLoginDto } from './dto/pin-login.dto';
import { LoginDto } from './dto/login.dto';


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

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

  @Get('default-branch')
  @ApiOperation({ summary: 'Get default branch for public screens' })
  getDefaultBranch() {
    return this.authService.getDefaultBranch();
  }
}
