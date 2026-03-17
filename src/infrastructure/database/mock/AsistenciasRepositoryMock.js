import IAsistenciasRepo from '../../../adapters/repositories/IAsistenciasRepo.js';
import * as mock from '../../mock/index.js';

export class AsistenciasRepositoryMock extends IAsistenciasRepo {
  async list(alumnoId) {
    return await mock.getAsistencias(alumnoId);
  }

  async getById(id) {
    const all = await this.list();
    return (all || []).find(a => String(a.id || a.id_asistencia || '') === String(id)) || null;
  }

  async create(payload) {
    return await mock.createAsistencia(payload);
  }

  async update(id, payload) {
    return await mock.updateAsistencia(id, payload);
  }

  async delete(id) {
    return await mock.deleteAsistencia(id);
  }
}

