import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStructureDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  positionId!: string;

  @IsString()
  @IsNotEmpty()
  periodId!: string;

  @IsString()
  @IsOptional()
  imageId?: string;
  
}