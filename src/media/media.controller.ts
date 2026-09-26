import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { Request as ExpressRequest } from 'express';

import { MediaService } from './media.service';
import { documentMulterConfig } from './document-multer.config';
import { videoMulterConfig } from './video-multer.config';
import { multerConfig } from './multer.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/get-user.decorators';
import { AuthenticatedUser } from '../auth/strategy/jwt-strategy';

type RequestWithUser = ExpressRequest & { user: AuthenticatedUser };

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * POST /media/upload
   * Upload gambar (JPG/PNG/WEBP, maks 5MB). Untuk semua user yang login:
   * anggota memakainya untuk foto galeri angkatan. Dibatasi rate-limit agar
   * tidak dipakai mengisi disk.
   */
  @Post('upload')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() request: RequestWithUser,
  ) {
    const baseUrl = `${request.protocol}://${request.get('host')}`;

    return this.mediaService.create(file, request.user.id, baseUrl);
  }

  /**
   * POST /media/upload-video
   * Upload video (MP4/WEBM/MOV, maks 100MB) untuk galeri angkatan dan
   * dokumentasi event. Untuk semua user yang login, dengan rate-limit ketat.
   */
  @Post('upload-video')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', videoMulterConfig))
  uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Request() request: RequestWithUser,
  ) {
    const baseUrl = `${request.protocol}://${request.get('host')}`;

    return this.mediaService.create(file, request.user.id, baseUrl);
  }

  @Post('upload-document')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('file', documentMulterConfig))
  uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Request() request: RequestWithUser,
  ) {
    const baseUrl = `${request.protocol}://${request.get('host')}`;

    return this.mediaService.create(file, request.user.id, baseUrl);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.mediaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
