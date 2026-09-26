import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Seperti JwtAuthGuard, tapi tidak menolak request tanpa/dengan token tidak
 * valid: `request.user` diisi bila token valid, selain itu null. Dipakai untuk
 * endpoint publik yang menampilkan lebih banyak data ke anggota yang login.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_error: unknown, user: TUser | false): TUser | null {
    return user || null;
  }
}
