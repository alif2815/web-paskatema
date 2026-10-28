/**
 * Utilitas QRIS (format EMVCo Merchant-Presented QR): parsing TLV dan
 * checksum CRC16-CCITT. Dipakai untuk memvalidasi QRIS statis yang diunggah
 * bendahara. Logika yang sama ada di frontend untuk membuat QRIS dinamis.
 */

export interface TlvField {
  tag: string;
  value: string;
}

/** CRC16-CCITT (poly 0x1021, init 0xFFFF), 4 digit hex huruf besar. */
export function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Pecah payload jadi daftar tag-length-value; null bila formatnya rusak. */
export function parseTlv(payload: string): TlvField[] | null {
  const fields: TlvField[] = [];
  let i = 0;
  while (i < payload.length) {
    const tag = payload.slice(i, i + 2);
    const length = Number(payload.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(tag) || !Number.isInteger(length)) return null;
    const value = payload.slice(i + 4, i + 4 + length);
    if (value.length !== length) return null;
    fields.push({ tag, value });
    i += 4 + length;
  }
  return fields;
}

/**
 * Validasi payload QRIS: diawali "000201", diakhiri CRC (tag 63) yang cocok,
 * dan memuat nama merchant (tag 59). Mengembalikan nama merchant, atau
 * melempar Error dengan alasan.
 */
export function validateQris(payload: string): { merchantName: string } {
  const text = payload.trim();
  if (!text.startsWith('000201')) {
    throw new Error('Bukan kode QRIS yang valid (harus diawali 000201)');
  }
  const crcIndex = text.lastIndexOf('6304');
  if (crcIndex === -1 || crcIndex !== text.length - 8) {
    throw new Error('Kode QRIS tidak lengkap (checksum tidak ditemukan)');
  }
  if (crc16(text.slice(0, crcIndex + 4)) !== text.slice(crcIndex + 4)) {
    throw new Error('Checksum QRIS tidak cocok; pastikan kode disalin utuh');
  }
  const fields = parseTlv(text);
  if (!fields) {
    throw new Error('Struktur kode QRIS rusak');
  }
  const merchant = fields.find((f) => f.tag === '59')?.value;
  if (!merchant) {
    throw new Error('Kode QRIS tidak memuat nama merchant');
  }
  return { merchantName: merchant };
}
