import { IsEnum, IsOptional } from 'class-validator';
import { StatusReg } from '@prisma/client';

/**
 * DTO untuk update status pendaftaran (khusus ADMIN).
 * Hanya field status yang bisa diubah oleh admin.
 */
export class UpdateRegistrationDto {
  @IsEnum(StatusReg)
  @IsOptional()
  status?: StatusReg;
}
