import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCandidateDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  vision!: string;

  @IsString()
  @IsNotEmpty()
  mission!: string;

  @IsUUID()
  @IsOptional()
  photoId?: string;
}