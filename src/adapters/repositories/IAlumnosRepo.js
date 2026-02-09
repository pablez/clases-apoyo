/**
 * Interfaz `IAlumnosRepo` - contrato esperado para repositorios de Alumnos.
 * Implementaciones deben proporcionar las funciones listadas a continuación.
 * Este archivo es documentación ejecutable; no exporta implementación.
 */

/**
 * getAll(): Promise<Array>
 * getById(id): Promise<Object|null>
 * create(payload): Promise<Object>
 * update(id, payload): Promise<Object>
 * delete(id): Promise<Object>
 */

export default {};
/**
 * Interfaz / contrato para el repositorio de Alumnos (ESM).
 * Implementaciones concretas (Sheets, Mock, DB) deben exponer estos métodos.
 * Este archivo no es una implementación ejecutable, sirve como guía/contrato.
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
