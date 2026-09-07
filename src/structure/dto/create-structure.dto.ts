import { IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStructureDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsUUID()
  @IsNotEmpty()
  positionId!: string;

  @IsUUID()
  @IsNotEmpty()
  periodId!: string;

  @IsUUID()
  @IsOptional()
  imageId?: string;
  
}