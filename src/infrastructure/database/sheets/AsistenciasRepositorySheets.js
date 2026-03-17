import IAsistenciasRepo from '../../../adapters/repositories/IAsistenciasRepo.js';
import * as asistenciasSheets from '../../sheets/asistencias.js';

export class AsistenciasRepositorySheets extends IAsistenciasRepo {
  async list(alumnoId) {
    return await asistenciasSheets.getAsistencias(alumnoId);
  }

  async getById(id) {
    const all = await this.list();
    return (all || []).find(a => String(a.id || a.id_asistencia || '') === String(id)) || null;
  }

  async create(payload) {
    return await asistenciasSheets.createAsistencia(payload);
  }

  async update(id, payload) {
    return await asistenciasSheets.updateAsistencia(id, payload);
  }

  async delete(id) {
    return await asistenciasSheets.deleteAsistencia(id);
  }
}

