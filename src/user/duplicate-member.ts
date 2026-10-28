/**
 * Deteksi kemungkinan anggota ganda (satu orang, dua akun). Dipakai untuk
 * memberi PERINGATAN ke admin saat verifikasi, bukan menolak otomatis:
 * dua orang berbeda bisa saja bernama sama.
 */

/** "M. Rizky  Pratama" → ["m", "rizky", "pratama"] */
export function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Nama dianggap mirip bila sama persis setelah dinormalkan, atau semua kata
 * nama yang lebih pendek (minimal 2 kata) ada di nama yang lain
 * ("Budi Santoso" ~ "Budi Santoso Putra"). Nama satu kata hanya cocok bila
 * sama persis, supaya "Budi" tidak menandai semua Budi.
 */
export function similarNames(a: string, b: string): boolean {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  if (ta.join(' ') === tb.join(' ')) return true;
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  if (short.length < 2) return false;
  const set = new Set(long);
  return short.every((t) => set.has(t));
}

/** "+62 812-3456-789" dan "0812 3456 789" → "8123456789"; null bila terlalu pendek. */
export function normalizePhone(
  phone: string | null | undefined,
): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '').replace(/^(62|0)/, '');
  return digits.length >= 8 ? digits : null;
}
