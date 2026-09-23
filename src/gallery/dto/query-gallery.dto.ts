import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryGalleryDto {
  @ApiPropertyOptional({ description: 'Filter per angkatan', example: 32 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  angkatan?: number;
}
