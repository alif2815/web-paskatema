import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateThreadDto {
  @ApiProperty({ example: 'Info latihan hari Sabtu' })
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title: string;

  @ApiProperty({ example: 'Latihan dimulai jam 07.00 di lapangan utama.' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  body: string;

  @ApiProperty({
    description:
      'Kosong/null = Forum Umum. Diisi = forum angkatan (anggota hanya boleh angkatannya sendiri).',
    required: false,
    nullable: true,
    example: null,
  })
  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  angkatan?: number | null;
}
