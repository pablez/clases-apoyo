import { readUsuarios, appendSheetRange, readSheetRange, updateSheetRange, rowsToObjects } from '../../services/googleSheets.js';

export async function getUsuarios() {
  return await readUsuarios();
}

export async function createUsuario(payload) {
  // New format: A=id_usuario, B=email, C=password, D=rol, E=alumnos_ids
  // Skip id_alumno (legacy column B) - will be removed
  const row = [
    payload.id_usuario || payload.id || '', 
    payload.email || '', 
    payload.password || '', 
    payload.rol || '',
    payload.alumnos_ids || '' // New multi-alumno field
  ];
  const result = await appendSheetRange('Usuarios!A:F', [row]);
  return { ok: true, result, created: payload };
}

export async function getUsuarioById(id) {
  const rows = await readSheetRange('Usuarios!A1:F100'); // Include alumnos_ids column
  if (!rows || rows.length === 0) return null;
  const objs = rowsToObjects(rows);
  const found = objs.find(u => String(u.id_usuario || u.id || '') === String(id));
  return found || null;
}

export async function updateUsuario(id, payload) {
  const range = 'Usuarios!A1:F100';
  const rows = await readSheetRange(range);
  if (!rows || rows.length === 0) throw new Error('Usuarios sheet empty');
  const headers = rows[0];
  const body = rows.slice(1);
  const idx = body.findIndex(r => String(r[0] || r[0]) === String(id) || String(r[0]) === String(id));
  if (idx === -1) throw new Error('Usuario no encontrado');
  const rowNumber = idx + 2;
  const existing = body[idx];
  // New format: A=id_usuario, B=email, C=password, D=rol, E=alumnos_ids
  // Skip legacy id_alumno field
  const updatedRow = [
    id,
    payload.email ?? existing[1] ?? '',
    payload.password ?? existing[2] ?? '',
    payload.rol ?? existing[3] ?? 'padre',
    payload.alumnos_ids ?? existing[4] ?? ''
  ];
  await updateSheetRange(`Usuarios!A${rowNumber}:F${rowNumber}`, [updatedRow]);
  return { id, ...payload };
}

export async function deleteUsuario(id) {
  const range = 'Usuarios!A1:F100';
  const rows = await readSheetRange(range);
  if (!rows || rows.length === 0) return { success: true };
  const headers = rows[0];
  const body = rows.slice(1).filter(r => String(r[0]) !== String(id));
  const newRows = [headers, ...body];
  const originalLen = rows.length;
  while (newRows.length < originalLen) newRows.push(new Array(headers.length).fill(''));
  await updateSheetRange(`Usuarios!A1:F${originalLen}`, newRows);
  return { success: true };
}

export default { getUsuarios, createUsuario, getUsuarioById, updateUsuario, deleteUsuario };
