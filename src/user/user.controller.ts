import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { GetUser } from '../auth/decorators/get-user.decorators';
import { Roles } from '../auth/decorators/get-user.decorators';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('user')
@UseGuards(JwtAuthGuard) // Mengamankan seluruh endpoint di bawah agar wajib login
export class UserController {
  constructor(private readonly userService: UserService) { }

  // ==========================================
  // ENDPOINT UNTUK USER BIASA (PROFILE SENDIRI)
  // ==========================================

  // GET /user/me -> Menampilkan profil user yang sedang login
  @Get('me')
  getProfile(@GetUser('id') userId: string) {
    return this.userService.findById(userId);
  }

  // PATCH /user/me -> Memperbarui profil diri sendiri (nama, phone, bio)
  @Patch('me')
  updateProfile(
    @GetUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(userId, dto);
  }

  // ==========================================
  // ENDPOINT KHUSUS ADMIN (CRUD & ROLE MANAGEMENT)
  // ==========================================

  // GET /user -> Melihat daftar seluruh user
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.userService.findAll();
  }

  // GET /user/:id -> Melihat detail user berdasarkan ID
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  // PATCH /user/:id/role -> Mengubah role user (USER / ADMIN)
  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.userService.updateRole(id, dto);
  }

  // DELETE /user/:id -> Menghapus akun user
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}