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

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorators';

import { NewsService } from './news.service';

import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createNewsDto: CreateNewsDto,
    @GetUser('id') userId: string,
  ) {
    return this.newsService.create(
      createNewsDto,
      userId,
    );
  }

  @Get()
  findAll() {
    return this.newsService.findAll();
  }

  @Get('slug/:slug')
  findBySlug(
    @Param('slug') slug: string,
  ) {
    return this.newsService.findBySlug(slug);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.newsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateNewsDto: UpdateNewsDto,
  ) {
    return this.newsService.update(
      id,
      updateNewsDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id') id: string,
  ) {
    return this.newsService.remove(id);
  }
}