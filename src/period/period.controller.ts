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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { PeriodService } from './period.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';
import { QueryPeriodDto } from './dto/query-period.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/get-user.decorators';

@ApiTags('Period')
@Controller('period')
export class PeriodController {
  constructor(private readonly periodService: PeriodService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: Buat periode kepengurusan baru' })
  create(@Body() createPeriodDto: CreatePeriodDto) {
    return this.periodService.create(createPeriodDto);
  }

  @Get()
  @ApiOperation({ summary: 'Public: Lihat semua periode (bisa difilter isActive)' })
  findAll(@Query() query: QueryPeriodDto) {
    return this.periodService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Public: Lihat periode yang sedang aktif' })
  findActive() {
    return this.periodService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Public: Lihat detail periode' })
  findOne(@Param('id') id: string) {
    return this.periodService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: Update periode' })
  update(
    @Param('id') id: string,
    @Body() updatePeriodDto: UpdatePeriodDto,
  ) {
    return this.periodService.update(id, updatePeriodDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: Hapus periode' })
  remove(@Param('id') id: string) {
    return this.periodService.remove(id);
  }
}