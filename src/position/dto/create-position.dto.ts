import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @IsNotEmpty()
  level!: number;
}