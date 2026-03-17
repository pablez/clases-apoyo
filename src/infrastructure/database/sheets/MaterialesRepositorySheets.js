import IMaterialesRepo from '../../../adapters/repositories/IMaterialesRepo.js';
import * as materialesSheets from '../../sheets/materiales.js';

export class MaterialesRepositorySheets extends IMaterialesRepo {
  async list(materia) {
    return await materialesSheets.getMateriales(materia);
  }

  async getById(id) {
    return await materialesSheets.getMaterialById(id);
  }

  async create(payload) {
    return await materialesSheets.createMaterial(payload);
  }

  async update(id, payload) {
    return await materialesSheets.updateMaterial(id, payload);
  }

  async delete(id) {
    return await materialesSheets.deleteMaterial(id);
  }
}

