import { readSheetRange, appendSheetRange, updateSheetRange } from '../../services/googleSheets.js';

const RANGE = 'Materiales!A1:H100';

function rowToMaterial(row, idx) {
  return {
    id: String(row[0] ?? String(idx + 1)),
    materia: row[1] ?? '',
    nivel: row[2] ?? '',
    grado: row[3] ?? '',
    titulo: row[4] ?? '',
    descripcion: row[5] ?? '',
    url_recurso: row[6] ?? '',
    imagen_url: row[7] ?? '',
  };
}

async function readAllRows() {
  const rows = await readSheetRange(RANGE);
  if (!rows || rows.length === 0) return { hasHeader: false, dataRows: [] };
  // detect header row
  const first = rows[0];
  const hasHeader = Array.isArray(first) && typeof first[0] === 'string' && first[0].toLowerCase().includes('id');
  const dataRows = hasHeader ? rows.slice(1) : rows;
  return { hasHeader, dataRows };
}

export async function getMateriales(materia) {
  const { dataRows } = await readAllRows();
  const objs = dataRows.map((r, i) => rowToMaterial(r, i));
  if (!materia) return objs;
  return objs.filter(m => String(m.materia).toLowerCase() === String(materia).toLowerCase());
}

export async function getMaterialById(id) {
  const mats = await getMateriales();
  const m = mats.find(x => String(x.id) === String(id));
  if (!m) throw new Error('Material not found');
  return m;
}

export async function createMaterial(payload) {
  const { dataRows } = await readAllRows();
  const ids = dataRows.map(r => parseInt(r[0], 10) || 0);
  const newId = String(Math.max(0, ...ids) + 1);
  const nowRow = [
    newId,
    payload.materia || '',
    payload.nivel || '',
    payload.grado || '',
    payload.titulo || '',
    payload.descripcion || '',
    payload.url_recurso || '',
    payload.imagen_url || '',
  ];
  await appendSheetRange('Materiales!A:H', [nowRow]);
  return { id: newId, ...payload };
}

export async function updateMaterial(id, payload) {
  const { hasHeader, dataRows } = await readAllRows();
  const idx = dataRows.findIndex(r => String(r[0]) === String(id));
  if (idx === -1) throw new Error('Material not found');
  const sheetRowNumber = idx + (hasHeader ? 2 : 1);
  const updatedRow = [
    id,
    payload.materia ?? dataRows[idx][1] ?? '',
    payload.nivel ?? dataRows[idx][2] ?? '',
    payload.grado ?? dataRows[idx][3] ?? '',
    payload.titulo ?? dataRows[idx][4] ?? '',
    payload.descripcion ?? dataRows[idx][5] ?? '',
    payload.url_recurso ?? dataRows[idx][6] ?? '',
    payload.imagen_url ?? dataRows[idx][7] ?? '',
  ];
  await updateSheetRange(`Materiales!A${sheetRowNumber}:H${sheetRowNumber}`, [updatedRow]);
  return { id, ...payload };
}

export async function deleteMaterial(id) {
  const { hasHeader, dataRows } = await readAllRows();
  const idx = dataRows.findIndex(r => String(r[0]) === String(id));
  if (idx === -1) throw new Error('Material not found');
  const sheetRowNumber = idx + (hasHeader ? 2 : 1);
  await updateSheetRange(`Materiales!A${sheetRowNumber}:H${sheetRowNumber}`, [['', '', '', '', '', '', '', '']]);
  return { success: true };
}

export default { getMateriales, getMaterialById, createMaterial, updateMaterial, deleteMaterial };
