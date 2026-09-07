import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateShortLinkDto {
  @IsUrl({
    require_protocol: true,
  })
  @IsNotEmpty()
  originalUrl!: string;

  @IsString()
  @IsOptional()
  @MinLength(4)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Code hanya boleh mengandung huruf, angka, underscore, dan dash',
  })
  code?: string;
}