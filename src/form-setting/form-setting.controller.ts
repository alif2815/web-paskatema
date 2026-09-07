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

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { Role } from '@prisma/client';

import {
  Roles,
} from '../auth/decorators/get-user.decorators';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  RolesGuard,
} from '../auth/guards/roles.guard';

import { FormSettingService } from './form-setting.service';

import {
  CreateFormSettingDto,
} from './dto/create-form-setting.dto';

import {
  UpdateFormSettingDto,
} from './dto/update-form-setting.dto';

@ApiTags('Form Setting')
@UseGuards(JwtAuthGuard)
@Controller('form-setting')
export class FormSettingController {
  constructor(
    private readonly formSettingService: FormSettingService,
  ) {}

  // ==========================================================
  // PUBLIC / AUTH USER
  // ==========================================================

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
  @UseGuards(RolesGuard)
  create(
    @Body()
    dto: CreateFormSettingDto,
  ) {
    return this.formSettingService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findAll() {
    return this.formSettingService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findOne(
    @Param('id') id: string,
  ) {
    return this.formSettingService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  update(
    @Param('id') id: string,
    @Body()
    dto: UpdateFormSettingDto,
  ) {
    return this.formSettingService.update(
      id,
      dto,
    );
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  toggleStatus(
    @Param('id') id: string,
    @Body('isActive')
    isActive: boolean,
  ) {
    return this.formSettingService.toggleFormStatus(
      id,
      isActive,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  remove(
    @Param('id') id: string,
  ) {
    return this.formSettingService.remove(id);
  }
}