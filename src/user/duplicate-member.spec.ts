import { normalizePhone, similarNames } from './duplicate-member';

describe('duplicate member detection', () => {
  it('mencocokkan nama tanpa memedulikan huruf besar, spasi, dan tanda baca', () => {
    expect(similarNames('M. Rizky  Pratama', 'm rizky pratama')).toBe(true);
    expect(similarNames('Budi Santoso', 'Budi Santoso Putra')).toBe(true);
  });

  it('nama satu kata hanya cocok bila sama persis', () => {
    expect(similarNames('Budi', 'Budi Santoso')).toBe(false);
    expect(similarNames('Budi', 'budi')).toBe(true);
    expect(similarNames('Sari Dewi', 'Sari Lestari')).toBe(false);
  });

  it('menyamakan format nomor HP', () => {
    expect(normalizePhone('+62 812-3456-789')).toBe(
      normalizePhone('0812 3456 789'),
    );
    expect(normalizePhone('123')).toBeNull();
  });
});
