import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategory } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateEbookDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  fileId!: string;

  @ApiPropertyOptional({
    enum: DocumentCategory,
    description:
      'Kategori dokumen (AD_ART tampil paling atas di /administrasi)',
  })
  @IsEnum(DocumentCategory)
  @IsOptional()
  category?: DocumentCategory;
}
