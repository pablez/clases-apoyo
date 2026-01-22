import fs from 'fs/promises';
import path from 'path';

const SHEETY_BASE = process.env.SHEETY_BASE_URL || '';
const SHEETY_TOKEN = process.env.SHEETY_TOKEN || '';

const mockPath = path.resolve(new URL('..', import.meta.url).pathname, '../data/mock.json');

async function requestSheety(pathname, opts = {}) {
  const url = `${SHEETY_BASE.replace(/\/$/, '')}/${pathname.replace(/^\//, '')}`;
  const headers = { 'Content-Type': 'application/json' };
  if (SHEETY_TOKEN) headers['Authorization'] = `Bearer ${SHEETY_TOKEN}`;
  const res = await fetch(url, { headers, ...opts });
  if (!res.ok) throw new Error(`Sheety error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function readMock() {
  try {
    const txt = await fs.readFile(mockPath, 'utf-8');
    return JSON.parse(txt);
  } catch (err) {
    return { alumnos: [], asistencias: [] };
  }
}

async function writeMock(data) {
  await fs.mkdir(path.dirname(mockPath), { recursive: true });
  await fs.writeFile(mockPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getAlumnos() {
  if (SHEETY_BASE) {
    // Expect provider to return { alumnos: [...] } or similar. Caller should inspect.
    const body = await requestSheety('alumnos');
    // Try common keys
    return body.alumnos || body.students || body.data || body;
  }

  const mock = await readMock();
  return mock.alumnos || [];
}

export async function getAsistencias(alumnoId) {
  if (SHEETY_BASE) {
    // if provider supports query param
    const q = alumnoId ? `asistencias?alumnoId=${encodeURIComponent(alumnoId)}` : 'asistencias';
    const body = await requestSheety(q);
    return body.asistencias || body.attendances || body.data || body;
  }

  const mock = await readMock();
  if (!alumnoId) return mock.asistencias || [];
  return (mock.asistencias || []).filter(a => String(a.alumnoId) === String(alumnoId));
}

export async function updateAsistencia(id, payload = {}) {
  if (!id) throw new Error('updateAsistencia: id is required');
  if (SHEETY_BASE) {
    const body = await requestSheety(`asistencias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return body;
  }

  // Mock update: modify local JSON
  const mock = await readMock();
  const list = mock.asistencias || [];
  const idx = list.findIndex(x => String(x.id) === String(id));
  if (idx === -1) throw new Error('Asistencia not found in mock data');
  list[idx] = { ...list[idx], ...payload };
  mock.asistencias = list;
  await writeMock(mock);
  return list[idx];
}

// ============================================
// GOOGLE SHEETS DIRECT INTEGRATION (OPTIONAL)
// ============================================
// Si prefieres acceso directo a Google Sheets sin Sheety/Stein:
// 1. Define las variables de entorno:
//    - GOOGLE_SHEET_ID="tu-spreadsheet-id"
//    - GOOGLE_SERVICE_ACCOUNT_KEY_PATH="./educacion-llave.json"
//    - USE_GOOGLE_SHEETS="true"
// 2. Las funciones abajo usarán googleSheets.js para leer/escribir

const USE_GOOGLE_SHEETS = process.env.USE_GOOGLE_SHEETS === 'true';

let googleSheetsModule = null;

async function getGoogleSheetsModule() {
  if (!googleSheetsModule) {
    googleSheetsModule = await import('./googleSheets.js');
  }
  return googleSheetsModule;
}

// Implementaciones alternativas con Google Sheets
async function getAlumnosFromSheets() {
  const gs = await getGoogleSheetsModule();
  const rows = await gs.readSheetRange('Alumnos!A1:C100');
  return gs.rowsToObjects(rows);
}

async function getAsistenciasFromSheets(alumnoId) {
  const gs = await getGoogleSheetsModule();
  const rows = await gs.readSheetRange('Asistencias!A1:E100');
  const all = gs.rowsToObjects(rows);
  if (!alumnoId) return all;
  return all.filter(a => String(a.alumnoId) === String(alumnoId));
}

async function updateAsistenciaInSheets(id, payload) {
  const gs = await getGoogleSheetsModule();
  // Necesitas implementar lógica para encontrar la fila por ID
  // Ejemplo simplificado: buscar en la columna A el ID y actualizar la columna D (estado)
  const rows = await gs.readSheetRange('Asistencias!A1:E100');
  const all = gs.rowsToObjects(rows);
  const idx = all.findIndex(a => String(a.id) === String(id));
  if (idx === -1) throw new Error('Asistencia no encontrada');
  
  // Asumiendo columna D es "estado" (ajustar según tu hoja)
  const rowNumber = idx + 2; // +1 por headers, +1 por índice base-1
  await gs.updateSheetRange(`Asistencias!D${rowNumber}`, [[payload.estado]]);
  
  return { ...all[idx], ...payload };
}

// Modificar exportaciones para usar Google Sheets si está habilitado
async function getAlumnosInternal() {
  if (USE_GOOGLE_SHEETS) return getAlumnosFromSheets();
  return getAlumnos();
}

async function getAsistenciasInternal(alumnoId) {
  if (USE_GOOGLE_SHEETS) return getAsistenciasFromSheets(alumnoId);
  return getAsistencias(alumnoId);
}

async function updateAsistenciaInternal(id, payload) {
  if (USE_GOOGLE_SHEETS) return updateAsistenciaInSheets(id, payload);
  return updateAsistencia(id, payload);
}

export default { 
  getAlumnos: USE_GOOGLE_SHEETS ? getAlumnosFromSheets : getAlumnos, 
  getAsistencias: USE_GOOGLE_SHEETS ? getAsistenciasFromSheets : getAsistencias, 
  updateAsistencia: USE_GOOGLE_SHEETS ? updateAsistenciaInSheets : updateAsistencia 
};
