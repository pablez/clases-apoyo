import IAlumnosRepo from '../../../adapters/repositories/IAlumnosRepo.js';
import * as mock from '../../mock/index.js';

export class AlumnosRepositoryMock extends IAlumnosRepo {
  async list() {
    return await mock.getAlumnos();
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
    return await mock.createAlumno(payload);
  }

  async update(id, payload) {
    return await mock.updateAlumno(id, payload);
  }

  async delete(id) {
    return await mock.deleteAlumno(id);
  }
}

