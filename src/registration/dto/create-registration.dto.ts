import { IsNotEmpty, IsObject, IsString } from 'class-validator';

/**
 * DTO untuk mendaftar ke suatu Event/Oprec.
 * User mengirim formId (id FormSetting yang aktif) beserta jawaban dinamis.
 */
export class CreateRegistrationDto {
  @IsString()
  @IsNotEmpty()
  formId: string;

  /**
   * Jawaban dinamis sesuai schema FormSetting.
   * Format bebas, mengikuti pertanyaan yang didefinisikan di FormSetting.schema.
   *
   * Contoh:
   * {
   *   "divisi": "Media",
   *   "motivasi": "Saya ingin berkontribusi...",
   *   "pengalaman": "Pernah menjadi anggota BEM..."
   * }
   */
  @IsObject()
  @IsNotEmpty()
  answers: Record<string, unknown>;
}