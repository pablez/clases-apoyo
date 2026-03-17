import { IUsuarioRepository } from '../../../core/repositories/IUsuarioRepository.js';
import * as usuariosSheets from '../../sheets/usuarios.js';

export class UsuarioRepositorySheets extends IUsuarioRepository {
  async getAll() {
    if (usuariosSheets.getUsuarios) return await usuariosSheets.getUsuarios();
    return [];
  }

  async getById(id) {
    if (usuariosSheets.getUsuarioById) return await usuariosSheets.getUsuarioById(id);
    const all = await this.getAll();
    return (all || []).find(u => String(u.id_usuario || u.id || '') === String(id)) || null;
  }

  async getByEmail(email) {
    const all = await this.getAll();
    return (all || []).find(u => String(u.email || '').toLowerCase() === String(email || '').toLowerCase()) || null;
  }

  async create(usuario) {
    if (usuariosSheets.createUsuario) return await usuariosSheets.createUsuario(usuario);
    throw new Error('createUsuario no implementado en sheets adapter');
  }

  async update(id, usuario) {
    if (usuariosSheets.updateUsuario) return await usuariosSheets.updateUsuario(id, usuario);
    throw new Error('updateUsuario no implementado en sheets adapter');
  }

  async delete(id) {
    if (usuariosSheets.deleteUsuario) return await usuariosSheets.deleteUsuario(id);
    throw new Error('deleteUsuario no implementado en sheets adapter');
  }

  async findByRole(role) {
    const all = await this.getAll();
    return (all || []).filter(u => String(u.rol || '').toLowerCase() === String(role || '').toLowerCase());
  }
}

