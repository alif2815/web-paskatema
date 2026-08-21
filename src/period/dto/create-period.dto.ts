import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreatePeriodDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}