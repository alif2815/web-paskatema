import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Klaim sebagai purna (alumni): diajukan anggota, diverifikasi admin. */
export class PurnaClaimDto {
  @ApiProperty({ description: 'Angkatan saat menjadi anggota', example: 25 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  angkatan!: number;

  @ApiProperty({
    description: 'Tahun lulus dari SMK Telkom Malang (opsional)',
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
    description: 'Catatan untuk admin, mis. jabatan dulu atau nama panggilan',
    example: 'Danru putra angkatan 25',
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

/** Keputusan admin atas klaim purna. */
export class ReviewPurnaClaimDto {
  @ApiProperty({ description: 'true = setujui, false = tolak' })
  @IsBoolean()
  approve!: boolean;

  @ApiProperty({
    description:
      'Angkatan yang ditetapkan saat menyetujui (default: angkatan yang diklaim)',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  angkatan?: number;
}
