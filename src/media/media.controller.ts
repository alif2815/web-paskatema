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
import { Request as ExpressRequest } from 'express';

import { MediaService } from './media.service';
import { documentMulterConfig } from './document-multer.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/get-user.decorators';
import { AuthenticatedUser } from '../auth/strategy/jwt-strategy';

type RequestWithUser = ExpressRequest & { user: AuthenticatedUser };

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

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
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', documentMulterConfig))
  uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Request() request: RequestWithUser,
  ) {
    const baseUrl = `${request.protocol}://${request.get('host')}`;

    return this.mediaService.create(file, request.user.id, baseUrl);
  }

  @Get()
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
