/**
 * Interfaz `IAsistenciasRepo` - contrato esperado para repositorios de Asistencias.
 * Métodos esperados:
 * - getAll(alumnoId?): Promise<Array>
 * - getById(id): Promise<Object|null>
 * - create(payload): Promise<Object>
 * - update(id, payload): Promise<Object>
 * - delete(id): Promise<Object>
 */

export default {};
// Interfaz/contrato para el repositorio de asistencias
export default class IAsistenciasRepo {
  async list(alumnoId) {
    throw new Error('IAsistenciasRepo.list not implemented');
  }

  async getById(id) {
    throw new Error('IAsistenciasRepo.getById not implemented');
  }

  async create(payload) {
    throw new Error('IAsistenciasRepo.create not implemented');
  }

  async update(id, payload) {
    throw new Error('IAsistenciasRepo.update not implemented');
  }

  async delete(id) {
    throw new Error('IAsistenciasRepo.delete not implemented');
  }
}
