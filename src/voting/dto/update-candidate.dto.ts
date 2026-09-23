import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateCandidateDto } from './create-candidate.dto';

/**
 * `userId` sengaja tidak bisa diubah: mengganti orang di balik kandidat
 * setelah suara masuk akan memindahkan suara ke orang lain, dan melewati
 * pengecekan duplikat kandidat saat create. Untuk mengganti orangnya, hapus
 * kandidat lalu buat baru.
 */
export class UpdateCandidateDto extends PartialType(
  OmitType(CreateCandidateDto, ['userId'] as const),
) {}
