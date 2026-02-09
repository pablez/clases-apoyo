import { readUsuarios, appendSheetRange } from '../../services/googleSheets.js';

export async function getUsuarios() {
  return await readUsuarios();
}

export async function createUsuario(payload) {
  const row = [payload.id_usuario || payload.id || '', payload.id_alumno || '', payload.email || '', payload.rol || ''];
  const result = await appendSheetRange('Usuarios!A:D', [row]);
  return { ok: true, result, created: payload };
}

export default { getUsuarios, createUsuario };
