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

import { NetworkService } from './network.service';
import {
  CreateOpportunityDto,
  QueryNetworkMembersDto,
  QueryOpportunityDto,
  UpdateOpportunityDto,
} from './dto/network.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorators';
import type { AuthenticatedUser } from '../auth/strategy/jwt-strategy';

@ApiTags('Jaringan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('network')
export class NetworkController {
  constructor(private readonly network: NetworkService) {}

  @Get('members')
  @ApiOperation({
    summary: 'Anggota: cari anggota/purna (nama, keahlian, pekerjaan, kampus)',
  })
  findMembers(
    @Query() query: QueryNetworkMembersDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.network.findMembers(query, user);
  }

  @Get('opportunities')
  @ApiOperation({ summary: 'Anggota: papan peluang' })
  findOpportunities(
    @Query() query: QueryOpportunityDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.network.findOpportunities(query, user);
  }

  @Post('opportunities')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Purna/Admin: bagikan peluang' })
  createOpportunity(
    @Body() dto: CreateOpportunityDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.network.createOpportunity(dto, user);
  }

  @Patch('opportunities/:id')
  @ApiOperation({ summary: 'Penulis/Admin: ubah peluang' })
  updateOpportunity(
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.network.updateOpportunity(id, dto, user);
  }

  @Delete('opportunities/:id')
  @ApiOperation({ summary: 'Penulis/Admin: hapus peluang' })
  removeOpportunity(
    @Param('id') id: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.network.removeOpportunity(id, user);
  }
}
