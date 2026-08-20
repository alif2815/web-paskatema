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

import { PeriodService } from './period.service';

import { CreatePeriodDto } from './dto/create-period.dto';
import { UpdatePeriodDto } from './dto/update-period.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Period')
@Controller('period')
export class PeriodController {
  constructor(
    private readonly periodService: PeriodService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createPeriodDto: CreatePeriodDto,
  ) {
    return this.periodService.create(
      createPeriodDto,
    );
  }

  @Get()
  findAll() {
    return this.periodService.findAll();
  }

  @Get('active')
  findActive() {
    return this.periodService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.periodService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updatePeriodDto: UpdatePeriodDto,
  ) {
    return this.periodService.update(
      id,
      updatePeriodDto,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.periodService.remove(id);
  }
}