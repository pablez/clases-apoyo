import IAlumnosRepo from '../../../adapters/repositories/IAlumnosRepo.js';
import * as alumnosSheets from '../../sheets/index.js';

export class AlumnosRepositorySheets extends IAlumnosRepo {
  async list() {
    return await alumnosSheets.getAlumnos();
  }

  async getById(id) {
    const all = await this.list();
    return (all || []).find(a => String(a.id || a.id_alumno || '') === String(id)) || null;
  }

  async findByEmail(email) {
    const all = await this.list();
    return (
      (all || []).find(a => String(a.email || '').toLowerCase() === String(email || '').toLowerCase()) ||
      null
    );
  }

  async create(payload) {
    return await alumnosSheets.createAlumno(payload);
  }

  async update(id, payload) {
    return await alumnosSheets.updateAlumno(id, payload);
  }

  async delete(id) {
    return await alumnosSheets.deleteAlumno(id);
  }
}

