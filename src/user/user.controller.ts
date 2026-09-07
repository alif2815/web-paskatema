import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Body,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { GetUser, Roles } from '../auth/decorators/get-user.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ==========================================
  // ENDPOINT UNTUK USER BIASA (PROFILE SENDIRI)
  // ==========================================

  /**
   * GET /user/me
   * Menampilkan profil user yang sedang login
   */
  @ApiOperation({ summary: 'Ambil profil user yang sedang login' })
  @ApiResponse({ status: 200, description: 'Profil berhasil diambil' })
  @ApiResponse({ status: 401, description: 'Tidak terautentikasi' })
  @Get('me')
  getProfile(@GetUser('id') userId: string) {
    return this.userService.findById(userId);
  }

  /**
   * PATCH /user/me
   * Memperbarui profil diri sendiri (nama, phone, bio, avatarId)
   */
  @ApiOperation({
    summary: 'Update profil user yang sedang login (nama, phone, bio, avatarId)',
  })
  @ApiResponse({ status: 200, description: 'Profil berhasil diperbarui' })
  @ApiResponse({ status: 404, description: 'Media avatar tidak ditemukan' })
  @Patch('me')
  updateProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  /**
   * POST /user/me/avatar
   * Upload foto profil user yang sedang login
   */
  @ApiOperation({
    summary: 'Upload foto profil (avatar). Format: JPEG, PNG, WebP. Maks: 2MB',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File gambar untuk dijadikan foto profil',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File gambar (JPEG / PNG / WebP, maks 2MB)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Avatar berhasil diupload' })
  @ApiResponse({ status: 400, description: 'Format atau ukuran file tidak valid' })
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @GetUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.uploadAvatar(userId, file);
  }

  // ==========================================
  // ENDPOINT KHUSUS ADMIN (CRUD & ROLE MANAGEMENT)
  // ==========================================

  /**
   * GET /user
   * Melihat daftar seluruh user dengan filter, search, dan pagination
   */
  @ApiOperation({
    summary:
      '[Admin] Ambil daftar semua user. Support: search (nama/email), filter role, pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar user berhasil diambil dengan metadata pagination',
  })
  @ApiResponse({ status: 403, description: 'Akses ditolak — hanya untuk Admin' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  /**
   * GET /user/:id
   * Melihat detail user berdasarkan ID
   */
  @ApiOperation({ summary: '[Admin] Ambil detail user berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'UUID user', example: 'a1b2c3d4-...' })
  @ApiResponse({ status: 200, description: 'Detail user berhasil diambil' })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  /**
   * PATCH /user/:id/role
   * Mengubah role user (USER / ADMIN) — khusus Admin
   */
  @ApiOperation({ summary: '[Admin] Ubah role user (USER / ADMIN)' })
  @ApiParam({ name: 'id', description: 'UUID user', example: 'a1b2c3d4-...' })
  @ApiResponse({ status: 200, description: 'Role berhasil diubah' })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.userService.updateRole(id, dto);
  }

  /**
   * DELETE /user/:id
   * Menghapus akun user — khusus Admin
   */
  @ApiOperation({ summary: '[Admin] Hapus akun user berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'UUID user', example: 'a1b2c3d4-...' })
  @ApiResponse({ status: 200, description: 'User berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}