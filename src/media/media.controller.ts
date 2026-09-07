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

import { MediaService } from './media.service';
import { multerConfig } from './multer.config';
import { documentMulterConfig } from './document-multer.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
    @Request() request: any,
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
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
