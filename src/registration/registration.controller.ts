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
import { Role, StatusReg } from '@prisma/client';

import { GetUser, Roles } from '../auth/decorators/get-user.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { RegistrationService } from './registration.service';

@UseGuards(JwtAuthGuard)
@Controller('registrations')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  // ─────────────────────────────────────────────────────────────
  // USER Routes
  // ─────────────────────────────────────────────────────────────

  /**
   * POST /registrations
   * User mendaftar ke Event/Oprec yang sedang dibuka.
   */
  @Post()
  register(
    @GetUser('id') userId: string,
    @Body() dto: CreateRegistrationDto,
  ) {
    return this.registrationService.register(userId, dto);
  }

  /**
   * GET /registrations/me
   * User melihat seluruh riwayat pendaftaran miliknya.
   */
  @Get('me')
  findMyRegistrations(@GetUser('id') userId: string) {
    return this.registrationService.findMyRegistrations(userId);
  }

  /**
   * GET /registrations/me/:id
   * User melihat detail satu pendaftaran miliknya.
   */
  @Get('me/:id')
  findMyRegistrationById(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.registrationService.findMyRegistrationById(userId, id);
  }

  // ─────────────────────────────────────────────────────────────
  // ADMIN Routes
  // ─────────────────────────────────────────────────────────────

  /**
   * GET /registrations
   * Admin melihat semua pendaftaran.
   * Query params opsional: ?formId=xxx&status=PENDING|ACCEPTED|REJECTED
   */
  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findAll(
    @Query('formId') formId?: string,
    @Query('status') status?: StatusReg,
  ) {
    return this.registrationService.findAll({ formId, status });
  }

  /**
   * GET /registrations/:id
   * Admin melihat detail satu pendaftaran berdasarkan id.
   */
  @Get(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findOne(@Param('id') id: string) {
    return this.registrationService.findOne(id);
  }

  /**
   * PATCH /registrations/:id/status
   * Admin mengubah status pendaftaran: ACCEPTED atau REJECTED.
   */
  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRegistrationDto,
  ) {
    return this.registrationService.updateStatus(id, dto);
  }

  /**
   * DELETE /registrations/:id
   * Admin menghapus data pendaftaran.
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.registrationService.remove(id);
  }
}
