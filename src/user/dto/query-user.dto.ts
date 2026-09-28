import { ApiProperty } from '@nestjs/swagger';
import { MemberStatus, Role } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryUserDto {
  @ApiProperty({
    description: 'Cari berdasarkan nama atau email (case-insensitive)',
    example: 'budi',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filter berdasarkan role',
    enum: Role,
    example: Role.USER,
    required: false,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({
    description: 'Filter status keanggotaan (Aktif/Purna)',
    enum: MemberStatus,
    required: false,
  })
  @IsEnum(MemberStatus)
  @IsOptional()
  memberStatus?: MemberStatus;

  @ApiProperty({ description: 'Filter angkatan', example: 30, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  angkatan?: number;

  @ApiProperty({
    description: 'Halaman yang ingin ditampilkan (mulai dari 1)',
    example: 1,
    required: false,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Jumlah item per halaman',
    example: 10,
    required: false,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 10;
}
