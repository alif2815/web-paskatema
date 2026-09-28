import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { SettingsService } from './settings.service';
import { UpdateActiveAngkatanDto } from './dto/active-angkatan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/get-user.decorators';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('active-angkatan')
  @ApiOperation({ summary: 'Public: Angkatan yang masih anggota aktif' })
  async getActiveAngkatan() {
    return { angkatan: await this.settings.getActiveAngkatan() };
  }

  @Patch('active-angkatan')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Admin: Ubah angkatan aktif (opsional: terapkan status ke semua anggota)',
  })
  updateActiveAngkatan(@Body() dto: UpdateActiveAngkatanDto) {
    return this.settings.updateActiveAngkatan(dto);
  }
}
