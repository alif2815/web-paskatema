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

import { VotingService } from './voting.service';

import { CreateVotingDto } from './dto/create-voting.dto';
import { UpdateVotingDto } from './dto/update-voting.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CastVoteDto } from './dto/cast-vote.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorators';

@ApiTags('Voting')
@Controller('voting')
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  // bagian
  // voting period
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Body() createVotingDto: CreateVotingDto) {
    return this.votingService.create(createVotingDto);
  }

  @Get()
  findAll() {
    return this.votingService.findAll();
  }

  @Get('active')
  findActive() {
    return this.votingService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.votingService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateVotingDto: UpdateVotingDto) {
    return this.votingService.update(id, updateVotingDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.votingService.remove(id);
  }

  // bagian
  // candidate

  @Post(':votingId/candidates')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createCandidate(
    @Param('votingId') votingId: string,
    @Body()
    createCandidateDto: CreateCandidateDto,
  ) {
    return this.votingService.createCandidate(votingId, createCandidateDto);
  }

  @Get(':votingId/candidates')
  findCandidates(@Param('votingId') votingId: string) {
    return this.votingService.findCandidates(votingId);
  }

  @Get(':votingId/candidates/:candidateId')
  findCandidate(
    @Param('votingId') votingId: string,
    @Param('candidateId') candidateId: string,
  ) {
    return this.votingService.findCandidate(votingId, candidateId);
  }

  @Patch(':votingId/candidates/:candidateId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateCandidate(
    @Param('votingId') votingId: string,
    @Param('candidateId') candidateId: string,
    @Body()
    updateData: Partial<CreateCandidateDto>,
  ) {
    return this.votingService.updateCandidate(
      votingId,
      candidateId,
      updateData,
    );
  }

  @Delete(':votingId/candidates/:candidateId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  removeCandidate(
    @Param('votingId') votingId: string,
    @Param('candidateId') candidateId: string,
  ) {
    return this.votingService.removeCandidate(votingId, candidateId);
  }

  // bagian
  // vote

  @Post(':votingId/vote')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  castVote(
    @Param('votingId') votingId: string,
    @GetUser('id') voterId: string,
    @Body() castVoteDto: CastVoteDto,
  ) {
    return this.votingService.castVote(votingId, voterId, castVoteDto);
  }

  @Get(':votingId/my-vote')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getMyVote(
    @Param('votingId') votingId: string,
    @GetUser('id') voterId: string,
  ) {
    return this.votingService.getMyVote(votingId, voterId);
  }

  @Get(':votingId/results')
  getResults(@Param('votingId') votingId: string) {
    return this.votingService.getResults(votingId);
  }
}
