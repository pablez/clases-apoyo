/**
 * Interfaz `IAlumnosRepo` - contrato esperado para repositorios de Alumnos.
 * Implementaciones concretas (Sheets, Mock, DB) deben exponer estos métodos.
 */

/**
 * Interfaz / contrato para el repositorio de Alumnos (ESM).
 * Esta clase actúa como contrato base para inyección de dependencias.
 */

/**
 * @typedef {Object} Alumno
 * @property {string} id
 * @property {string} nombre
 * @property {number} edad
 * @property {string} curso
 * @property {string} telefono_padre
 * @property {Array<string>} materias
 * @property {number} clases_compradas
 */

export default class IAlumnosRepo {
  async list() { throw new Error('Not implemented'); }
  async getById(id) { throw new Error('Not implemented'); }
  async findByEmail(email) { throw new Error('Not implemented'); }
  async create(payload) { throw new Error('Not implemented'); }
  async update(id, payload) { throw new Error('Not implemented'); }
  async delete(id) { throw new Error('Not implemented'); }
}
