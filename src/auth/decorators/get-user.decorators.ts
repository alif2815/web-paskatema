import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

/** Key untuk metadata roles yang digunakan RolesGuard */
export const ROLES_KEY = 'roles';

/**
 * Decorator untuk mengambil data user dari request (setelah JWT guard dijalankan).
 *
 * @example
 * // Ambil seluruh object user
 * @GetUser() user: User
 *
 * // Ambil field tertentu dari user
 * @GetUser('id') userId: string
 * @GetUser('role') role: Role
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

/**
 * Decorator untuk membatasi akses route berdasarkan role pengguna.
 * Harus digunakan bersama RolesGuard.
 *
 * @example
 * @Roles(Role.ADMIN)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);