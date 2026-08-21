import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateVotingDto } from './dto/create-voting.dto';
import { UpdateVotingDto } from './dto/update-voting.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CastVoteDto } from './dto/cast-vote.dto';

@Injectable()
export class VotingService {
  constructor(private readonly prisma: PrismaService) {}

  // bagian
  // voting period

  async create(createVotingDto: CreateVotingDto) {
    const { title, periodId, isActive = false } = createVotingDto;

    // Pastikan Period ada
    const period = await this.prisma.period.findUnique({
      where: {
        id: periodId,
      },
    });

    if (!period) {
      throw new NotFoundException('Periode organisasi tidak ditemukan');
    }

    return this.prisma.$transaction(async (tx) => {
      // Hanya satu VotingPeriod yang aktif
      if (isActive) {
        await tx.votingPeriod.updateMany({
          where: {
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });
      }

      return tx.votingPeriod.create({
        data: {
          title,
          periodId,
          isActive,
        },
        include: {
          period: true,
          candidates: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
              photo: true,
            },
          },
        },
      });
    });
  }

  async findAll() {
    return this.prisma.votingPeriod.findMany({
      orderBy: {
        title: 'asc',
      },
      include: {
        period: true,
        candidates: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            photo: true,
          },
        },
      },
    });
  }

  async findActive() {
    const voting = await this.prisma.votingPeriod.findFirst({
      where: {
        isActive: true,
      },
      include: {
        period: true,
        candidates: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            photo: true,
          },
        },
      },
    });

    if (!voting) {
      throw new NotFoundException('Tidak ada voting yang sedang aktif');
    }

    return voting;
  }

  async findOne(id: string) {
    const voting = await this.prisma.votingPeriod.findUnique({
      where: {
        id,
      },
      include: {
        period: true,
        candidates: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            photo: true,
          },
        },
      },
    });

    if (!voting) {
      throw new NotFoundException('Voting tidak ditemukan');
    }

    return voting;
  }

  async update(id: string, updateVotingDto: UpdateVotingDto) {
    const existingVoting = await this.prisma.votingPeriod.findUnique({
      where: {
        id,
      },
    });

    if (!existingVoting) {
      throw new NotFoundException('Voting tidak ditemukan');
    }

    const { title, periodId, isActive } = updateVotingDto;

    if (periodId) {
      const period = await this.prisma.period.findUnique({
        where: {
          id: periodId,
        },
      });

      if (!period) {
        throw new NotFoundException('Periode organisasi tidak ditemukan');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (isActive === true) {
        await tx.votingPeriod.updateMany({
          where: {
            isActive: true,
            id: {
              not: id,
            },
          },
          data: {
            isActive: false,
          },
        });
      }

      return tx.votingPeriod.update({
        where: {
          id,
        },
        data: {
          ...(title !== undefined && {
            title,
          }),
          ...(periodId !== undefined && {
            periodId,
          }),
          ...(isActive !== undefined && {
            isActive,
          }),
        },
        include: {
          period: true,
          candidates: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
              photo: true,
            },
          },
        },
      });
    });
  }

  async remove(id: string) {
    const existingVoting = await this.prisma.votingPeriod.findUnique({
      where: {
        id,
      },
    });

    if (!existingVoting) {
      throw new NotFoundException('Voting tidak ditemukan');
    }

    // kalau sudah voting gk oleh hapus votingnya buat voting lagi
    const voteCount = await this.prisma.vote.count({
      where: {
        votingPeriodId: id,
      },
    });

    if (voteCount > 0) {
      throw new ConflictException(
        'Voting tidak dapat dihapus karena sudah memiliki suara',
      );
    }

    return this.prisma.votingPeriod.delete({
      where: {
        id,
      },
    });
  }

  // bagian
  // candidate

  async createCandidate(
    votingId: string,
    createCandidateDto: CreateCandidateDto,
  ) {
    const voting = await this.prisma.votingPeriod.findUnique({
      where: {
        id: votingId,
      },
    });

    if (!voting) {
      throw new NotFoundException('Voting tidak ditemukan');
    }

    const { userId, vision, mission, photoId } = createCandidateDto;

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User calon tidak ditemukan');
    }

    const existingCandidate = await this.prisma.candidate.findFirst({
      where: {
        votingPeriodId: votingId,
        userId,
      },
    });

    if (existingCandidate) {
      throw new ConflictException(
        'User tersebut sudah menjadi kandidat pada voting ini',
      );
    }

    if (photoId) {
      const photo = await this.prisma.media.findUnique({
        where: {
          id: photoId,
        },
      });

      if (!photo) {
        throw new NotFoundException('Foto kandidat tidak ditemukan');
      }
    }

    return this.prisma.candidate.create({
      data: {
        votingPeriodId: votingId,
        userId,
        vision,
        mission,
        photoId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        photo: true,
      },
    });
  }

  async findCandidates(votingId: string) {
    const voting = await this.prisma.votingPeriod.findUnique({
      where: {
        id: votingId,
      },
    });

    if (!voting) {
      throw new NotFoundException('Voting tidak ditemukan');
    }

    return this.prisma.candidate.findMany({
      where: {
        votingPeriodId: votingId,
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        photo: true,
      },
    });
  }

  async findCandidate(votingId: string, candidateId: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: {
        id: candidateId,
        votingPeriodId: votingId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        photo: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Kandidat tidak ditemukan');
    }

    return candidate;
  }

  async updateCandidate(
    votingId: string,
    candidateId: string,
    updateData: Partial<CreateCandidateDto>,
  ) {
    await this.findCandidate(votingId, candidateId);

    const { userId, vision, mission, photoId } = updateData;

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new NotFoundException('User calon tidak ditemukan');
      }
    }

    if (photoId) {
      const photo = await this.prisma.media.findUnique({
        where: {
          id: photoId,
        },
      });

      if (!photo) {
        throw new NotFoundException('Foto kandidat tidak ditemukan');
      }
    }

    return this.prisma.candidate.update({
      where: {
        id: candidateId,
      },
      data: {
        ...(userId !== undefined && {
          userId,
        }),
        ...(vision !== undefined && {
          vision,
        }),
        ...(mission !== undefined && {
          mission,
        }),
        ...(photoId !== undefined && {
          photoId,
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        photo: true,
      },
    });
  }

  async removeCandidate(votingId: string, candidateId: string) {
    await this.findCandidate(votingId, candidateId);

    const voteCount = await this.prisma.vote.count({
      where: {
        candidateId,
      },
    });

    if (voteCount > 0) {
      throw new ConflictException(
        'Kandidat tidak dapat dihapus karena sudah menerima suara',
      );
    }

    return this.prisma.candidate.delete({
      where: {
        id: candidateId,
      },
    });
  }

  // Bagian
  // vote
  async castVote(votingId: string, voterId: string, castVoteDto: CastVoteDto) {
    const voting = await this.prisma.votingPeriod.findUnique({
      where: {
        id: votingId,
      },
    });

    if (!voting) {
      throw new NotFoundException('Voting tidak ditemukan');
    }

    if (!voting.isActive) {
      throw new ForbiddenException('Voting sedang tidak aktif');
    }

    const candidate = await this.prisma.candidate.findFirst({
      where: {
        id: castVoteDto.candidateId,
        votingPeriodId: votingId,
      },
    });

    if (!candidate) {
      throw new NotFoundException('Kandidat tidak ditemukan pada voting ini');
    }

    // Database-level unique constraint tetap menjadi
    // perlindungan terakhir agar satu user hanya vote sekali.
    const existingVote = await this.prisma.vote.findUnique({
      where: {
        votingPeriodId_voterId: {
          votingPeriodId: votingId,
          voterId,
        },
      },
    });

    if (existingVote) {
      throw new ConflictException(
        'Anda sudah memberikan suara pada voting ini',
      );
    }

    try {
      return await this.prisma.vote.create({
        data: {
          votingPeriodId: votingId,
          candidateId: castVoteDto.candidateId,
          voterId,
        },
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw new ConflictException(
        'Anda sudah memberikan suara pada voting ini',
      );
    }
  }

  async getMyVote(votingId: string, voterId: string) {
    const vote = await this.prisma.vote.findUnique({
      where: {
        votingPeriodId_voterId: {
          votingPeriodId: votingId,
          voterId,
        },
      },
      include: {
        candidate: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return vote;
  }

  async getResults(votingId: string) {
    const voting = await this.prisma.votingPeriod.findUnique({
      where: {
        id: votingId,
      },
    });

    if (!voting) {
      throw new NotFoundException('Voting tidak ditemukan');
    }

    // Hasil penuh hanya dibuka setelah voting ditutup.
    if (voting.isActive) {
      throw new ForbiddenException(
        'Hasil voting belum dapat ditampilkan selama voting masih berlangsung',
      );
    }

    const candidates = await this.prisma.candidate.findMany({
      where: {
        votingPeriodId: votingId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        photo: true,
        _count: {
          select: {
            votes: true,
          },
        },
      },
      orderBy: {
        votes: {
          _count: 'desc',
        },
      },
    });

    return {
      votingId: voting.id,
      title: voting.title,
      totalVotes: await this.prisma.vote.count({
        where: {
          votingPeriodId: votingId,
        },
      }),
      results: candidates.map((candidate, index) => ({
        rank: index + 1,
        candidateId: candidate.id,
        name: candidate.user.name,
        photo: candidate.photo,
        votes: candidate._count.votes,
      })),
    };
  }
}
