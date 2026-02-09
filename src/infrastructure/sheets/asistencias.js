import { getAsistenciasFromSheets, createAsistenciaInSheets, updateAsistenciaInSheets, deleteAsistenciaFromSheets } from '../../infrastructure/googleSheetsAdapter.js';

export async function getAsistencias(alumnoId) {
  return getAsistenciasFromSheets(alumnoId);
}

export async function createAsistencia(payload) {
  return createAsistenciaInSheets(payload);
}

export async function updateAsistencia(id, payload) {
  return updateAsistenciaInSheets(id, payload);
}

export async function deleteAsistencia(id) {
  return deleteAsistenciaFromSheets(id);
}

export default { getAsistencias, createAsistencia, updateAsistencia, deleteAsistencia };
