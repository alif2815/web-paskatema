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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { ForumService } from './forum.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { PostBodyDto } from './dto/post-body.dto';
import { QueryThreadDto } from './dto/query-thread.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorators';
import type { AuthenticatedUser } from '../auth/strategy/jwt-strategy';

// Batas kirim untuk mencegah spam topik/balasan.
const WRITE_LIMIT = { default: { limit: 10, ttl: 60_000 } };

/**
 * Forum anggota. Semua endpoint wajib login; hanya anggota yang angkatannya
 * sudah diisi admin (dan admin) yang bisa mengakses. Forum Umum terbuka untuk
 * semua angkatan, forum angkatan hanya untuk anggota angkatan itu.
 */
@ApiTags('Forum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get('boards')
  @ApiOperation({ summary: 'Daftar forum yang bisa dibuka user ini' })
  boards(@GetUser() user: AuthenticatedUser) {
    return this.forumService.boards(user);
  }

  @Get('threads')
  @ApiOperation({ summary: 'Daftar topik (Forum Umum atau per angkatan)' })
  findThreads(
    @Query() query: QueryThreadDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.forumService.findThreads(query, user);
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'Detail topik beserta balasannya' })
  findThread(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.forumService.findThread(id, user);
  }

  @Post('threads')
  @Throttle(WRITE_LIMIT)
  @ApiOperation({ summary: 'Buat topik baru' })
  createThread(
    @Body() dto: CreateThreadDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.forumService.createThread(dto, user);
  }

  @Patch('threads/:id')
  @ApiOperation({
    summary: 'Edit topik sendiri; admin juga bisa sematkan/kunci',
  })
  updateThread(
    @Param('id') id: string,
    @Body() dto: UpdateThreadDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.forumService.updateThread(id, dto, user);
  }

  @Delete('threads/:id')
  @ApiOperation({ summary: 'Hapus topik (penulis atau admin)' })
  removeThread(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.forumService.removeThread(id, user);
  }

  @Post('threads/:id/posts')
  @Throttle(WRITE_LIMIT)
  @ApiOperation({ summary: 'Balas topik' })
  createPost(
    @Param('id') id: string,
    @Body() dto: PostBodyDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.forumService.createPost(id, dto, user);
  }

  @Patch('posts/:id')
  @ApiOperation({ summary: 'Edit balasan sendiri' })
  updatePost(
    @Param('id') id: string,
    @Body() dto: PostBodyDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.forumService.updatePost(id, dto, user);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Hapus balasan (penulis atau admin)' })
  removePost(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.forumService.removePost(id, user);
  }
}
