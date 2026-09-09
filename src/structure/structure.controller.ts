import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { StructureService } from './structure.service';

import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/get-user.decorators';

@ApiTags('Structure')
@UseInterceptors(CacheInterceptor)
@CacheTTL(60_000)
@Controller('structure')
export class StructureController {
  constructor(private readonly structureService: StructureService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(
    @Body()
    createStructureDto: CreateStructureDto,
  ) {
    return this.structureService.create(createStructureDto);
  }

  @Get()
  findAll() {
    return this.structureService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.structureService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body()
    updateStructureDto: UpdateStructureDto,
  ) {
    return this.structureService.update(id, updateStructureDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.structureService.remove(id);
  }
}
