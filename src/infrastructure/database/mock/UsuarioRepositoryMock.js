import { IUsuarioRepository } from '../../../core/repositories/IUsuarioRepository.js';
import * as mock from '../../mock/index.js';

export class UsuarioRepositoryMock extends IUsuarioRepository {
  async getAll() {
    return await mock.getUsuarios();
  }

  async getById(id) {
    const all = await this.getAll();
    return (all || []).find(u => String(u.id_usuario || u.id || '') === String(id)) || null;
  }

  async getByEmail(email) {
    const all = await this.getAll();
    return (all || []).find(u => String(u.email || '').toLowerCase() === String(email || '').toLowerCase()) || null;
  }

  async create(usuario) {
    return await mock.createUsuario(usuario);
  }

  async update(id, usuario) {
    return await mock.updateUsuario(id, usuario);
  }

  async delete(id) {
    return await mock.deleteUsuario(id);
  }

  async findByRole(role) {
    const all = await this.getAll();
    return (all || []).filter(u => String(u.rol || '').toLowerCase() === String(role || '').toLowerCase());
  }
}

