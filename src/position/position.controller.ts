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

import { PositionService } from './position.service';

import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Position')
@Controller('position')
export class PositionController {
  constructor(
    private readonly positionService: PositionService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createPositionDto: CreatePositionDto,
  ) {
    return this.positionService.create(
      createPositionDto,
    );
  }

  @Get()
  findAll() {
    return this.positionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.positionService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updatePositionDto: UpdatePositionDto,
  ) {
    return this.positionService.update(
      id,
      updatePositionDto,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.positionService.remove(id);
  }
}