import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateGalleryDto {
  @ApiPropertyOptional({
    description:
      'Nomor angkatan. Wajib untuk admin; untuk anggota diabaikan dan selalu memakai angkatan miliknya sendiri.',
    example: 32,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  angkatan?: number;

  @ApiPropertyOptional({ description: 'Keterangan foto' })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  caption?: string;

  @ApiProperty({ description: 'ID media foto (dari POST /media/upload)' })
  @IsUUID()
  @IsNotEmpty()
  imageId!: string;
}
