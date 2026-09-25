import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

import { CreateThreadDto } from './create-thread.dto';

export class UpdateThreadDto extends PartialType(
  OmitType(CreateThreadDto, ['angkatan'] as const),
) {
  @ApiPropertyOptional({ description: 'Khusus admin: sematkan di atas' })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: 'Khusus admin: tutup balasan' })
  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;
}
