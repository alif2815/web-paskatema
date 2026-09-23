import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Tandai satu route sebagai publik, melewati JwtAuthGuard meskipun
 * controller-nya di-guard di level class (mis. UserController).
 * Lihat JwtAuthGuard — decorator ini dibaca lewat Reflector di sana.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
