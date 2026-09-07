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

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { EventService } from './event.service';

import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createEventDto: CreateEventDto,
  ) {
    return this.eventService.create(
      createEventDto,
    );
  }

  @Get()
  findAll() {
    return this.eventService.findAll();
  }

  @Get('upcoming')
  findUpcoming() {
    return this.eventService.findUpcoming();
  }

  @Get('past')
  findPast() {
    return this.eventService.findPast();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventService.update(
      id,
      updateEventDto,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }
}