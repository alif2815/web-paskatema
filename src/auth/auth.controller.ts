import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/register.dto';
import { LoginAuthDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register
  @ApiOperation({
    summary: 'Registrasi akun baru. Selalu membuat akun dengan role USER.',
  })
  // Rate-limit lebih ketat dari baseline global (default 120/menit) untuk
  // mencegah spam pendaftaran akun / enumerasi email lewat error "sudah terdaftar".
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: CreateAuthDto) {
    return this.authService.register(dto);
  }

  // POST /auth/login
  @ApiOperation({ summary: 'Login dan dapatkan JWT token' })
  // Rate-limit lebih ketat untuk mencegah brute-force password.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginAuthDto) {
    return this.authService.login(dto);
  }

  // GET /auth/me
  @ApiOperation({ summary: 'Ambil profil user yang sedang login' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@GetUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  // PATCH /auth/change-password
  @ApiOperation({ summary: 'Ganti password user yang sedang login' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(
    @GetUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  // PATCH /auth/update-email
  @ApiOperation({
    summary:
      'Update email user yang sedang login. Admin wajib menggunakan email @paskatema.com',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('update-email')
  updateEmail(@GetUser('id') userId: string, @Body() dto: UpdateEmailDto) {
    return this.authService.updateEmail(userId, dto);
  }
}
