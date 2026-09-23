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

export class UpdateGalleryDto {
  @ApiPropertyOptional({
    description: 'Nomor angkatan (hanya admin; diabaikan untuk anggota)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  angkatan?: number;

  @ApiPropertyOptional({ description: 'Keterangan foto (kosong = hapus)' })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  caption?: string;
}
