import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join, resolve, sep } from 'path';

export interface NewsFileMeta {
  title: string;
  slug: string;
  author: string;
  createdAt: Date;
  /** URL foto sampul (satu-satunya foto berita), jika ada. */
  cover: string | null;
}

/**
 * Penyimpanan isi berita sebagai file Markdown (`<id>.md`) di folder
 * `content/news` (di-mount sebagai volume, lihat docker-compose.yml).
 *
 * Format file: frontmatter satu baris per field (nilai di-JSON-kan supaya
 * aman untuk karakter khusus) lalu isi berita. Database tetap menjadi sumber
 * metadata; frontmatter di file hanya salinan agar file bisa dibaca sendiri.
 */
@Injectable()
export class NewsFileService {
  private readonly dir = resolve(
    process.env.NEWS_CONTENT_DIR ?? join(process.cwd(), 'content', 'news'),
  );

  fileNameFor(id: string): string {
    return `${id}.md`;
  }

  /** Path absolut, dipastikan tidak keluar dari folder konten. */
  private pathFor(fileName: string): string {
    const full = resolve(this.dir, fileName);
    if (!full.startsWith(this.dir + sep)) {
      throw new Error('Path file berita tidak valid');
    }
    return full;
  }

  private serialize(meta: NewsFileMeta, body: string): string {
    const front = [
      `title: ${JSON.stringify(meta.title)}`,
      `slug: ${JSON.stringify(meta.slug)}`,
      `author: ${JSON.stringify(meta.author)}`,
      `date: ${JSON.stringify(meta.createdAt.toISOString())}`,
      `cover: ${JSON.stringify(meta.cover)}`,
    ].join('\n');

    return `---\n${front}\n---\n\n${body}\n`;
  }

  /** Ambil isi berita (tanpa frontmatter) dari teks file. */
  private parseBody(raw: string): string {
    const text = raw.replace(/\r\n/g, '\n');
    if (!text.startsWith('---\n')) {
      return text.trim();
    }
    const end = text.indexOf('\n---\n', 4);
    if (end === -1) {
      return text.trim();
    }
    return text.slice(end + 5).trim();
  }

  /** Tulis atomik (file sementara lalu rename) agar tidak pernah setengah jadi. */
  async write(
    fileName: string,
    meta: NewsFileMeta,
    body: string,
  ): Promise<void> {
    const target = this.pathFor(fileName);
    await fs.mkdir(this.dir, { recursive: true });

    const temp = `${target}.${randomUUID()}.tmp`;
    try {
      await fs.writeFile(temp, this.serialize(meta, body), 'utf8');
      await fs.rename(temp, target);
    } catch (error) {
      await fs.rm(temp, { force: true });
      throw error;
    }
  }

  /** Teks mentah file (untuk rollback), atau null jika belum ada. */
  async readRaw(fileName: string): Promise<string | null> {
    try {
      return await fs.readFile(this.pathFor(fileName), 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async readBody(fileName: string): Promise<string | null> {
    const raw = await this.readRaw(fileName);
    return raw === null ? null : this.parseBody(raw);
  }

  /** Kembalikan file ke teks mentah sebelumnya (rollback best-effort). */
  async restoreRaw(fileName: string, raw: string | null): Promise<void> {
    if (raw === null) {
      await this.remove(fileName);
      return;
    }
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(this.pathFor(fileName), raw, 'utf8');
  }

  async remove(fileName: string): Promise<void> {
    await fs.rm(this.pathFor(fileName), { force: true });
  }
}
