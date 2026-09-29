import { BadRequestException } from '@nestjs/common';

import {
  isCompatibleSchemaChange,
  parseFormSchema,
  validateAnswers,
} from './form-schema';

describe('form schema', () => {
  const schema = [
    { key: 'nama', label: 'Nama', type: 'text', required: true },
    {
      key: 'kelas',
      label: 'Kelas',
      type: 'select',
      required: true,
      options: ['X RPL 1', 'X TKJ 1'],
    },
    { key: 'wa', label: 'WhatsApp', type: 'tel', required: false },
  ];

  it('menolak tipe yang tidak didukung dan key ganda', () => {
    expect(() =>
      parseFormSchema([{ key: 'cv', label: 'CV', type: 'file' }]),
    ).toThrow(BadRequestException);
    expect(() =>
      parseFormSchema([
        { key: 'a', label: 'A', type: 'text' },
        { key: 'a', label: 'B', type: 'text' },
      ]),
    ).toThrow(BadRequestException);
  });

  it('menyimpan hanya key dari schema dan memangkas spasi', () => {
    expect(
      validateAnswers(schema, {
        nama: '  Budi ',
        kelas: 'X RPL 1',
        wa: '',
        hack: 'x',
      }),
    ).toEqual({ nama: 'Budi', kelas: 'X RPL 1' });
  });

  it('menolak jawaban wajib yang kosong dan pilihan di luar opsi', () => {
    expect(() => validateAnswers(schema, { kelas: 'X RPL 1' })).toThrow(
      BadRequestException,
    );
    expect(() =>
      validateAnswers(schema, { nama: 'Budi', kelas: 'XII' }),
    ).toThrow(BadRequestException);
  });
});

describe('isCompatibleSchemaChange', () => {
  const base = [
    { key: 'nama', label: 'Nama', type: 'text', required: true },
    {
      key: 'kelas',
      label: 'Kelas',
      type: 'select',
      required: true,
      options: ['X RPL 1'],
    },
  ];

  it('mengizinkan dropdown dijadikan isian teks', () => {
    const next = [
      base[0],
      { key: 'kelas', label: 'Kelas', type: 'text', required: true },
    ];
    expect(isCompatibleSchemaChange(base, next)).toBe(true);
  });

  it('menolak menambah pertanyaan atau mengubah label', () => {
    expect(
      isCompatibleSchemaChange(base, [
        ...base,
        { key: 'x', label: 'X', type: 'text', required: false },
      ]),
    ).toBe(false);
    expect(
      isCompatibleSchemaChange(base, [
        { ...base[0], label: 'Nama Lengkap' },
        base[1],
      ]),
    ).toBe(false);
  });
});
