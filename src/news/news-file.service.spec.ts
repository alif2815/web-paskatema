import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { NewsFileService } from './news-file.service';

describe('NewsFileService', () => {
  let dir: string;
  let service: NewsFileService;

  const meta = {
    title: 'Juara "1" PBB: Kota Malang',
    slug: 'juara-1-pbb',
    author: 'Admin',
    createdAt: new Date('2026-09-24T10:00:00.000Z'),
    cover: 'https://example.com/api/uploads/a.jpg',
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'news-md-'));
    process.env.NEWS_CONTENT_DIR = dir;
    service = new NewsFileService();
  });

  afterEach(() => {
    delete process.env.NEWS_CONTENT_DIR;
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes a .md file with frontmatter and reads the body back', async () => {
    await service.write('a.md', meta, '# Judul\n\nIsi berita.');

    const raw = readFileSync(join(dir, 'a.md'), 'utf8');
    expect(raw.startsWith('---\n')).toBe(true);
    expect(raw).toContain('title: "Juara \\"1\\" PBB: Kota Malang"');
    expect(raw).toContain('cover: "https://example.com/api/uploads/a.jpg"');
    expect(await service.readBody('a.md')).toBe('# Judul\n\nIsi berita.');
  });

  it('keeps body intact when it contains --- lines', async () => {
    const body = 'Awal\n\n---\n\nTengah\n---\nAkhir';
    await service.write('b.md', meta, body);

    expect(await service.readBody('b.md')).toBe(body);
  });

  it('returns null for a missing file', async () => {
    expect(await service.readBody('nope.md')).toBeNull();
  });

  it('overwrites atomically without leaving temp files', async () => {
    await service.write('c.md', meta, 'v1');
    await service.write('c.md', meta, 'v2');

    expect(await service.readBody('c.md')).toBe('v2');
    expect(readdirSync(dir)).toEqual(['c.md']);
  });

  it('restores previous content, or removes when there was none', async () => {
    await service.write('d.md', meta, 'lama');
    const previous = await service.readRaw('d.md');
    await service.write('d.md', meta, 'baru');

    await service.restoreRaw('d.md', previous);
    expect(await service.readBody('d.md')).toBe('lama');

    await service.restoreRaw('d.md', null);
    expect(await service.readRaw('d.md')).toBeNull();
  });

  it('rejects file names that escape the content directory', async () => {
    await expect(service.write('../evil.md', meta, 'x')).rejects.toThrow();
    await expect(service.readRaw('../../etc/passwd')).rejects.toThrow();
  });
});
