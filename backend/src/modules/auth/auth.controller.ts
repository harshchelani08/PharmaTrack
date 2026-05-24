import { Controller, Post, Body, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

export class RegisterTenantDto {
  tenantName: string;
  subdomain: string;
  adminEmail: string;
  adminPassword: string;
  firstName: string;
  lastName: string;
}

export class LoginDto {
  email: string;
  password: string;
}

export class RefreshTokenDto {
  refreshToken: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-tenant')
  @ApiOperation({ summary: 'Register a new pharmacy chain tenant + admin account' })
  registerTenant(@Body() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate staff member and return JWT tokens' })
  login(@Body() dto: LoginDto, @Req() req: any) {
    return this.authService.login(dto, req.tenantId);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and return new access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-Auth')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  getProfile(@Req() req: any) {
    return req.user;
  }
}
