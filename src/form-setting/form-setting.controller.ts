import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Role } from '@prisma/client';

import { Roles } from '../auth/decorators/get-user.decorators';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { FormSettingService } from './form-setting.service';

import { CreateFormSettingDto } from './dto/create-form-setting.dto';

import { UpdateFormSettingDto } from './dto/update-form-setting.dto';
import { ToggleFormStatusDto } from './dto/toggle-form-status.dto';

@ApiTags('Form Setting')
@Controller('form-setting')
export class FormSettingController {
  constructor(private readonly formSettingService: FormSettingService) {}

  // ==========================================================
  // PUBLIC / AUTH USER
  // ==========================================================

  // Publik: halaman /pendaftaran menampilkan pertanyaan sebelum login;
  // mengirim jawaban tetap wajib login (lihat registration).
  @Get('active')
  findActive() {
    return this.formSettingService.findActive();
  }

  // ==========================================================
  // ADMIN
  // ==========================================================

  @Post()
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(
    @Body()
    dto: CreateFormSettingDto,
  ) {
    return this.formSettingService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll() {
    return this.formSettingService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  findOne(@Param('id') id: string) {
    return this.formSettingService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('id') id: string,
    @Body()
    dto: UpdateFormSettingDto,
  ) {
    return this.formSettingService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  toggleStatus(@Param('id') id: string, @Body() dto: ToggleFormStatusDto) {
    return this.formSettingService.toggleFormStatus(id, dto.isActive);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.formSettingService.remove(id);
  }
}
