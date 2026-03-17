/**
 * Interfaz `IMaterialesRepo` - contrato esperado para repositorios de Materiales.
 * Métodos esperados:
 * - list(materia?): Promise<Array>
 * - getById(id): Promise<Object|null>
 * - create(payload): Promise<Object>
 * - update(id, payload): Promise<Object>
 * - delete(id): Promise<Object>
 */

export default class IMaterialesRepo {
  async list(materia) {
    throw new Error('IMaterialesRepo.list not implemented');
  }

  async getById(id) {
    throw new Error('IMaterialesRepo.getById not implemented');
  }

  async create(payload) {
    throw new Error('IMaterialesRepo.create not implemented');
  }

  async update(id, payload) {
    throw new Error('IMaterialesRepo.update not implemented');
  }

  async delete(id) {
    throw new Error('IMaterialesRepo.delete not implemented');
  }
}
