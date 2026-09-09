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

import { EbookService } from './ebook.service';

import { CreateEbookDto } from './dto/create-ebook.dto';
import { UpdateEbookDto } from './dto/update-ebook.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/get-user.decorators';

@ApiTags('EBook')
@UseInterceptors(CacheInterceptor)
@CacheTTL(60_000)
@Controller('ebook')
export class EbookController {
  constructor(private readonly ebookService: EbookService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createEbookDto: CreateEbookDto) {
    return this.ebookService.create(createEbookDto);
  }

  @Get()
  findAll() {
    return this.ebookService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ebookService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateEbookDto: UpdateEbookDto) {
    return this.ebookService.update(id, updateEbookDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.ebookService.remove(id);
  }
}
