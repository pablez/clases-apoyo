/**
 * Interfaz `IUsuariosRepo` - contrato esperado para repositorios de Usuarios.
 * Métodos esperados:
 * - getAll(): Promise<Array>
 * - getById(id): Promise<Object|null>
 * - create(payload): Promise<Object>
 */
export default class IUsuariosRepo {
  async getAll() {
    throw new Error('IUsuariosRepo.getAll not implemented');
  }

  async getById(id) {
    throw new Error('IUsuariosRepo.getById not implemented');
  }

  async create(payload) {
    throw new Error('IUsuariosRepo.create not implemented');
  }
}
