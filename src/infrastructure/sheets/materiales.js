import { readSheetRange, appendSheetRange, rowsToObjects } from '../../services/googleSheets.js';

export async function getMateriales(materia) {
  const rows = await readSheetRange('Materiales!A1:F100');
  const objs = rowsToObjects(rows);
  return objs.map(o => ({ id: o.id || '', materia: o.materia || '', titulo: o.titulo || '', descripcion: o.descripcion || '', url_recurso: o.url_recurso || '', imagen_url: o.imagen_url || '' })).filter(Boolean);
}

export async function getMaterialById(id) {
  const mats = await getMateriales();
  const m = mats.find(x => String(x.id) === String(id));
  if (!m) throw new Error('Material not found');
  return m;
}

export async function createMaterial(payload) {
  const rows = await readSheetRange('Materiales!A1:F100');
  const objs = rowsToObjects(rows);
  const ids = objs.map(o => parseInt(o.id || 0) || 0);
  const newId = String(Math.max(0, ...ids) + 1);
  const row = [newId, payload.materia || '', payload.titulo || '', payload.descripcion || '', payload.url_recurso || '', payload.imagen_url || ''];
  const result = await appendSheetRange('Materiales!A:F', [row]);
  return { id: newId, ...payload, _appendResult: result };
}

export async function updateMaterial(id, payload) {
  // naive: read all, find row index and update by writing the row
  const rows = await readSheetRange('Materiales!A1:F100');
  const objs = rowsToObjects(rows);
  const idx = objs.findIndex(o => String(o.id) === String(id));
  if (idx === -1) throw new Error('Material not found');
  const rowNumber = idx + 2;
  const updatedRow = [id, payload.materia || objs[idx].materia || '', payload.titulo || objs[idx].titulo || '', payload.descripcion || objs[idx].descripcion || '', payload.url_recurso || objs[idx].url_recurso || '', payload.imagen_url || objs[idx].imagen_url || ''];
  await updateSheetRange(`Materiales!A${rowNumber}:F${rowNumber}`, [updatedRow]);
  return { id, ...payload };
}

export async function deleteMaterial(id) {
  const rows = await readSheetRange('Materiales!A1:F100');
  const objs = rowsToObjects(rows);
  const idx = objs.findIndex(o => String(o.id) === String(id));
  if (idx === -1) throw new Error('Material not found');
  const rowNumber = idx + 2;
  await updateSheetRange(`Materiales!A${rowNumber}:F${rowNumber}`, [['', '', '', '', '', '']]);
  return { success: true };
}

export default { getMateriales, getMaterialById, createMaterial, updateMaterial, deleteMaterial };
