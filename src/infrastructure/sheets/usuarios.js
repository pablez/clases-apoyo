import { readUsuarios, appendSheetRange } from '../../services/googleSheets.js';

export async function getUsuarios() {
  return await readUsuarios();
}

export async function createUsuario(payload) {
  // Include password column (A:E) to store simple admin entries when needed
  const row = [payload.id_usuario || payload.id || '', payload.id_alumno || '', payload.email || '', payload.password || '', payload.rol || ''];
  const result = await appendSheetRange('Usuarios!A:E', [row]);
  return { ok: true, result, created: payload };
}

export default { getUsuarios, createUsuario };
