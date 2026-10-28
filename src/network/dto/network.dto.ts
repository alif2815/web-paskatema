import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MemberStatus, OpportunityType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class QueryNetworkMembersDto {
  @ApiPropertyOptional({
    description: 'Cari nama, keahlian, pekerjaan, atau kampus',
  })
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: MemberStatus })
  @IsEnum(MemberStatus)
  @IsOptional()
  memberStatus?: MemberStatus;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  angkatan?: number;

  @ApiPropertyOptional({ description: 'Hanya yang bersedia menjadi mentor' })
  @Transform(
    ({ value }: { value: unknown }) => value === 'true' || value === true,
  )
  @IsBoolean()
  @IsOptional()
  mentor?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;
}

export class QueryOpportunityDto {
  @ApiPropertyOptional({ enum: OpportunityType })
  @IsEnum(OpportunityType)
  @IsOptional()
  type?: OpportunityType;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;
}

export class CreateOpportunityDto {
  @ApiProperty({ example: 'Frontend Developer Intern' })
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  title!: string;

  @ApiProperty({ example: 'PT Telkom Indonesia' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  organization!: string;

  @ApiProperty({ enum: OpportunityType })
  @IsEnum(OpportunityType)
  type!: OpportunityType;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional({ example: 'https://karir.telkom.co.id/...' })
  @Transform(trim)
  @Matches(/^(https?:\/\/\S{3,500})?$/, {
    message: 'Link harus berawalan http:// atau https://',
  })
  @IsOptional()
  link?: string | null;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  deadline?: string | null;
}

export class UpdateOpportunityDto extends PartialType(CreateOpportunityDto) {}
