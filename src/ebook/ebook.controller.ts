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

import { EbookService } from './ebook.service';

import { CreateEbookDto } from './dto/create-ebook.dto';
import { UpdateEbookDto } from './dto/update-ebook.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('EBook')
@Controller('ebook')
export class EbookController {
  constructor(
    private readonly ebookService: EbookService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createEbookDto: CreateEbookDto,
  ) {
    return this.ebookService.create(
      createEbookDto,
    );
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
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateEbookDto: UpdateEbookDto,
  ) {
    return this.ebookService.update(
      id,
      updateEbookDto,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.ebookService.remove(id);
  }
}