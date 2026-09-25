import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class QueryThreadDto {
  @ApiPropertyOptional({
    description: 'Kosong = Forum Umum. Diisi = forum angkatan tersebut.',
    example: 32,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  angkatan?: number;

  @ApiPropertyOptional({ description: 'Cari di judul topik' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;
}
