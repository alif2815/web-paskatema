import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { GalleryService } from './gallery.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { QueryGalleryDto } from './dto/query-gallery.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorators';
import type { AuthenticatedUser } from '../auth/strategy/jwt-strategy';

@ApiTags('Gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  /** Admin (angkatan mana pun) atau anggota (otomatis angkatannya sendiri). */
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateGalleryDto, @GetUser() user: AuthenticatedUser) {
    return this.galleryService.create(dto, user);
  }

  // Publik. Sengaja tanpa CacheInterceptor: perubahan harus langsung terlihat.
  @Get()
  findAll(@Query() query: QueryGalleryDto) {
    return this.galleryService.findAll(query);
  }

  // Route statis diletakkan sebelum ':id' supaya tidak ditangkap sebagai id.
  @Get('angkatan')
  findAngkatan() {
    return this.galleryService.findAngkatan();
  }

  @Get('mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findMine(@GetUser('id') userId: string) {
    return this.galleryService.findMine(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.galleryService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGalleryDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.galleryService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.galleryService.remove(id, user);
  }
}
