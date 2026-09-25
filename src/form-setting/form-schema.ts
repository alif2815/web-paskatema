import { BadRequestException } from '@nestjs/common';

/**
 * Tipe field yang didukung formulir pendaftaran dinamis. Upload file sengaja
 * tidak didukung: anggota tidak punya endpoint untuk mengunggah dokumen.
 */
export const FORM_FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'email',
  'tel',
  'date',
  'select',
] as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
}

const MAX_FIELDS = 40;
const MAX_ANSWER_LENGTH = 5000;
const KEY_PATTERN = /^[a-z][a-z0-9_]{0,49}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validasi & normalisasi schema form dari admin. Melempar BadRequest dengan
 * pesan yang menyebut field yang salah.
 */
export function parseFormSchema(schema: unknown): FormField[] {
  if (!Array.isArray(schema) || schema.length === 0) {
    throw new BadRequestException('Formulir minimal punya satu pertanyaan');
  }
  if (schema.length > MAX_FIELDS) {
    throw new BadRequestException(`Formulir maksimal ${MAX_FIELDS} pertanyaan`);
  }

  const seen = new Set<string>();
  return schema.map((raw, index) => {
    const where = `Pertanyaan #${index + 1}`;
    if (!isRecord(raw)) {
      throw new BadRequestException(`${where} tidak valid`);
    }
    const key = typeof raw.key === 'string' ? raw.key.trim() : '';
    const label = typeof raw.label === 'string' ? raw.label.trim() : '';
    const type = raw.type as FormFieldType;

    if (!KEY_PATTERN.test(key)) {
      throw new BadRequestException(
        `${where}: key harus huruf kecil/angka/underscore, diawali huruf`,
      );
    }
    if (seen.has(key)) {
      throw new BadRequestException(`${where}: key "${key}" dipakai dua kali`);
    }
    seen.add(key);
    if (!label || label.length > 200) {
      throw new BadRequestException(
        `${where}: label wajib diisi (maks. 200 karakter)`,
      );
    }
    if (!FORM_FIELD_TYPES.includes(type)) {
      throw new BadRequestException(
        `${where}: tipe "${String(raw.type)}" tidak didukung`,
      );
    }

    const field: FormField = {
      key,
      label,
      type,
      required: raw.required === true,
    };
    if (type === 'select') {
      const options = Array.isArray(raw.options)
        ? raw.options
            .filter((o): o is string => typeof o === 'string')
            .map((o) => o.trim())
            .filter(Boolean)
        : [];
      if (options.length === 0) {
        throw new BadRequestException(`${where}: pilihan wajib diisi`);
      }
      field.options = [...new Set(options)];
    }
    return field;
  });
}

/**
 * Validasi jawaban pendaftar terhadap schema. Hanya key yang ada di schema
 * yang disimpan; jawaban kosong untuk field opsional dibuang.
 */
export function validateAnswers(
  schema: unknown,
  answers: Record<string, unknown>,
): Record<string, string | number> {
  const fields = parseFormSchema(schema);
  const clean: Record<string, string | number> = {};

  for (const field of fields) {
    const raw = answers[field.key];
    const text =
      typeof raw === 'string'
        ? raw.trim()
        : typeof raw === 'number' && Number.isFinite(raw)
          ? String(raw)
          : '';

    if (!text) {
      if (field.required) {
        throw new BadRequestException(`"${field.label}" wajib diisi`);
      }
      continue;
    }
    if (text.length > MAX_ANSWER_LENGTH) {
      throw new BadRequestException(`"${field.label}" terlalu panjang`);
    }

    switch (field.type) {
      case 'number': {
        const value = Number(text);
        if (!Number.isFinite(value)) {
          throw new BadRequestException(`"${field.label}" harus berupa angka`);
        }
        clean[field.key] = value;
        continue;
      }
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
          throw new BadRequestException(
            `"${field.label}" bukan email yang valid`,
          );
        }
        break;
      case 'tel':
        if (!/^\+?[0-9\s-]{8,20}$/.test(text)) {
          throw new BadRequestException(
            `"${field.label}" bukan nomor telepon yang valid`,
          );
        }
        break;
      case 'date':
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(text) ||
          Number.isNaN(Date.parse(text))
        ) {
          throw new BadRequestException(
            `"${field.label}" bukan tanggal yang valid`,
          );
        }
        break;
      case 'select':
        if (!field.options?.includes(text)) {
          throw new BadRequestException(`Pilihan "${field.label}" tidak valid`);
        }
        break;
      default:
        break;
    }
    clean[field.key] = text;
  }

  return clean;
}
