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

import { AchievementService } from './achievement.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Achievement')
@Controller('achievement')
export class AchievementController {
  constructor(
    private readonly achievementService: AchievementService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(
    @Body()
    createAchievementDto: CreateAchievementDto,
  ) {
    return this.achievementService.create(
      createAchievementDto,
    );
  }

  @Get()
  findAll() {
    return this.achievementService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.achievementService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body()
    updateAchievementDto: UpdateAchievementDto,
  ) {
    return this.achievementService.update(
      id,
      updateAchievementDto,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id') id: string,
  ) {
    return this.achievementService.remove(id);
  }
}