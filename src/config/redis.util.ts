import { ConfigService } from '@nestjs/config';

/**
 * Bangun connection string Redis dari environment variable, dipakai bersama
 * oleh CacheModule (cache response) dan ThrottlerModule (rate limiting) di
 * app.module.ts supaya konfigurasi koneksi Redis-nya satu sumber saja.
 *
 * Env yang dibaca:
 *   REDIS_HOST     wajib
 *   REDIS_PORT     opsional, default 6379
 *   REDIS_PASSWORD opsional (kosongkan kalau Redis tidak pakai auth)
 *   REDIS_DB       opsional, default 0
 */
export function buildRedisUrl(config: ConfigService): string {
  const host = config.getOrThrow<string>('REDIS_HOST');
  const port = config.get<string>('REDIS_PORT') ?? '6379';
  const password = config.get<string>('REDIS_PASSWORD');
  const db = config.get<string>('REDIS_DB') ?? '0';

  const auth = password ? `:${encodeURIComponent(password)}@` : '';

  return `redis://${auth}${host}:${port}/${db}`;
}
