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

import { StructureService } from './structure.service';

import { CreateStructureDto } from './dto/create-structure.dto';
import { UpdateStructureDto } from './dto/update-structure.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Structure')
@Controller('structure')
export class StructureController {
  constructor(
    private readonly structureService: StructureService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(
    @Body()
    createStructureDto: CreateStructureDto,
  ) {
    return this.structureService.create(
      createStructureDto,
    );
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
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body()
    updateStructureDto: UpdateStructureDto,
  ) {
    return this.structureService.update(
      id,
      updateStructureDto,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.structureService.remove(id);
  }
}