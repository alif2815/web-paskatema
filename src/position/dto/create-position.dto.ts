import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(1)
  // fungsi min ini nanti bisa kayak gini
  // 1 = ketua
  // 2 = wakit ketua
  // 3 = sekre
  // 4 = bendahara
  level!: number;
}