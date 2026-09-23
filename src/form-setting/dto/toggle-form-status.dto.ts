import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleFormStatusDto {
  @ApiProperty({ description: 'Status aktif form', example: true })
  @IsBoolean()
  isActive!: boolean;
}
