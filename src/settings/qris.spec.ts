import { crc16, parseTlv, validateQris } from './qris';

// Payload contoh (bukan QRIS sungguhan) dengan CRC yang dihitung ulang.
const body =
  '00020101021126570011ID.DANA.WWW011893600915300000000102090000000010303UMI51440014ID.CO.QRIS.WWW0215ID10200000000010303UMI5204899953033605802ID5910PASKATEMA 6006MALANG61056514162070703A016304';
const sample = body + crc16(body);

describe('qris', () => {
  it('menghitung CRC16-CCITT sesuai standar (vektor uji 123456789 = 29B1)', () => {
    expect(crc16('123456789')).toBe('29B1');
  });

  it('memvalidasi payload dan mengambil nama merchant', () => {
    expect(validateQris(sample)).toEqual({ merchantName: 'PASKATEMA ' });
    expect(parseTlv(sample)?.[0]).toEqual({ tag: '00', value: '01' });
  });

  it('menolak payload yang checksum-nya salah atau bukan QRIS', () => {
    expect(() => validateQris(body + '0000')).toThrow('Checksum');
    expect(() => validateQris('hello')).toThrow('000201');
  });
});
