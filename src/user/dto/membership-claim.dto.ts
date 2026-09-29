import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MemberStatus } from '@prisma/client';

/**
 * Pengajuan keanggotaan oleh anggota yang sudah ada (aktif atau purna):
 * menyebutkan angkatan & status, lalu diverifikasi admin. Calon anggota baru
 * tidak memakai ini — mereka lewat formulir rekrutmen.
 */
export class MembershipClaimDto {
  @ApiProperty({ enum: MemberStatus, example: MemberStatus.AKTIF })
  @IsEnum(MemberStatus)
  status!: MemberStatus;

  @ApiProperty({ description: 'Angkatan', example: 32 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  angkatan!: number;

  @ApiProperty({
    description: 'Tahun lulus dari SMK Telkom Malang (untuk purna, opsional)',
    example: 2021,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1980)
  @Max(2100)
  @IsOptional()
  graduationYear?: number;

  @ApiProperty({
    description: 'Catatan untuk admin, mis. jabatan atau nama panggilan',
    example: 'Danru putri',
    required: false,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(300)
  @IsOptional()
  note?: string;
}

/** Keputusan admin atas satu pengajuan. */
export class ReviewMembershipClaimDto {
  @ApiProperty({ description: 'true = setujui, false = tolak' })
  @IsBoolean()
  approve!: boolean;

  @ApiProperty({
    description: 'Koreksi angkatan saat menyetujui (default: yang diajukan)',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  angkatan?: number;

  @ApiProperty({
    description: 'Koreksi status saat menyetujui (default: yang diajukan)',
    enum: MemberStatus,
    required: false,
  })
  @IsEnum(MemberStatus)
  @IsOptional()
  memberStatus?: MemberStatus;
}

/** Setujui semua pengajuan untuk satu angkatan sekaligus. */
export class ApproveAngkatanDto {
  @ApiProperty({ example: 32 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  angkatan!: number;
}
