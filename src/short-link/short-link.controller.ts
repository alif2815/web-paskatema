import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { Response } from 'express';

import { ShortLinkService } from './short-link.service';

import { CreateShortLinkDto } from './dto/create-short-link.dto';
import { UpdateShortLinkDto } from './dto/update-short-link.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Short Link')
@Controller('short-link')
export class ShortLinkController {
  constructor(
    private readonly shortLinkService: ShortLinkService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(
    @Body()
    createShortLinkDto: CreateShortLinkDto,
  ) {
    return this.shortLinkService.create(
      createShortLinkDto,
    );
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.shortLinkService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.shortLinkService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body()
    updateShortLinkDto: UpdateShortLinkDto,
  ) {
    return this.shortLinkService.update(
      id,
      updateShortLinkDto,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.shortLinkService.remove(id);
  }
}