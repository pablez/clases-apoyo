import IMaterialesRepo from '../../../adapters/repositories/IMaterialesRepo.js';
import * as mock from '../../mock/index.js';

export class MaterialesRepositoryMock extends IMaterialesRepo {
  async list(materia) {
    return await mock.getMateriales(materia);
  }

  async getById(id) {
    return await mock.getMaterialById(id);
  }

  async create(payload) {
    return await mock.createMaterial(payload);
  }

  async update(id, payload) {
    return await mock.updateMaterial(id, payload);
  }

  async delete(id) {
    return await mock.deleteMaterial(id);
  }
}

