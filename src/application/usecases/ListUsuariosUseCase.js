import { AuthUtils } from '../../shared/utils/AuthUtils.js';

export class ListUsuariosUseCase {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  /**
   * - Sin token: retorna lista sanitizada (sin passwords)
   * - Con token:
   *   - admin: retorna todos sanitizados
   *   - no-admin: retorna solo el usuario autenticado (sanitizado)
   */
  async execute({ token } = {}) {
    const usuarios = await this.usuarioRepository.getAll();
    const sanitized = (usuarios || []).map(u => AuthUtils.sanitizeUser(u));

    if (!token) return sanitized;

    const tokenInfo = AuthUtils.parseToken(token);
    const userId = tokenInfo?.userId;
    if (!userId) throw new Error('No autorizado');

    const me = (usuarios || []).find(
      u => String(u.id_usuario || u.id || '').toLowerCase() === String(userId).toLowerCase()
    );
    if (!me) throw new Error('No autorizado');

    if (AuthUtils.isAdmin(me)) return sanitized;

    return [AuthUtils.sanitizeUser(me)];
  }
}

