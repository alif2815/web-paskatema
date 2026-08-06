import { IsString, IsInt, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAchievementDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number) // Memastikan input diubah menjadi angka
  year!: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageId?: string;
}