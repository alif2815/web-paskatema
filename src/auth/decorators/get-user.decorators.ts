import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

// Key untuk metadata roles
export const ROLES_KEY = 'roles';

/**
 * Decorator untuk mengambil user dari request (setelah JWT guard)
 * Penggunaan: @GetUser() user: User
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

/**
 * Decorator untuk membatasi akses berdasarkan role
 * Penggunaan: @Roles(Role.ADMIN)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);