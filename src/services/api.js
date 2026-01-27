import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const SHEETY_BASE = process.env.SHEETY_BASE_URL || '';
const SHEETY_TOKEN = process.env.SHEETY_TOKEN || '';

// Corregir la ruta para Windows
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockPath = path.resolve(__dirname, '../../data/mock.json');

// Función de retry con backoff exponencial
async function retryWithBackoff(fn, maxRetries = 3, delayMs = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Intento ${attempt}/${maxRetries}`);
      const result = await fn();
      console.log(`✅ Éxito en intento ${attempt}`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ Intento ${attempt} falló:`, error.message);
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1); // Backoff exponencial
        console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error(`❌ Todos los intentos fallaron. Último error:`, lastError.message);
  throw lastError;
}

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
    return { alumnos: [], asistencias: [], materiales: [] };
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

export async function getMateriales(materia) {
  if (SHEETY_BASE) {
    const q = materia ? `materiales?materia=${encodeURIComponent(materia)}` : 'materiales';
    const body = await requestSheety(q);
    return body.materiales || body.materials || body.data || body;
  }

  const mock = await readMock();
  if (!materia) return mock.materiales || [];
  return (mock.materiales || []).filter(m => m.materia === materia);
}

export async function getMaterialById(id) {
  if (SHEETY_BASE) {
    const body = await requestSheety(`materiales/${id}`);
    return body.material || body;
  }

  const mock = await readMock();
  const material = (mock.materiales || []).find(m => String(m.id) === String(id));
  if (!material) throw new Error('Material not found');
  return material;
}

// CRUD para Alumnos
export async function createAlumno(payload) {
  if (SHEETY_BASE) {
    const body = await requestSheety('alumnos', {
      method: 'POST',
      body: JSON.stringify({ alumno: payload }),
    });
    return body.alumno || body;
  }

  const mock = await readMock();
  const list = mock.alumnos || [];
  const newId = Math.max(0, ...list.map(a => a.id || 0)) + 1;
  const newAlumno = { id: newId, ...payload };
  list.push(newAlumno);
  mock.alumnos = list;
  await writeMock(mock);
  return newAlumno;
}

export async function updateAlumno(id, payload) {
  if (!id) throw new Error('updateAlumno: id is required');
  if (SHEETY_BASE) {
    const body = await requestSheety(`alumnos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ alumno: payload }),
    });
    return body.alumno || body;
  }

  const mock = await readMock();
  const list = mock.alumnos || [];
  const idx = list.findIndex(x => String(x.id) === String(id));
  if (idx === -1) throw new Error('Alumno no encontrado');
  list[idx] = { ...list[idx], ...payload };
  mock.alumnos = list;
  await writeMock(mock);
  return list[idx];
}

export async function deleteAlumno(id) {
  if (!id) throw new Error('deleteAlumno: id is required');
  if (SHEETY_BASE) {
    await requestSheety(`alumnos/${id}`, { method: 'DELETE' });
    return { success: true };
  }

  const mock = await readMock();
  const list = mock.alumnos || [];
  const idx = list.findIndex(x => String(x.id) === String(id));
  if (idx === -1) throw new Error('Alumno no encontrado');
  list.splice(idx, 1);
  mock.alumnos = list;
  // Eliminar asistencias asociadas en mock (cascade)
  if (mock.asistencias && Array.isArray(mock.asistencias)) {
    mock.asistencias = mock.asistencias.filter(a => String(a.id_alumno || a.alumnoId || a.alumno) !== String(id));
  }
  await writeMock(mock);
  return { success: true };
}

// CRUD para Materiales
export async function createMaterial(payload) {
  if (SHEETY_BASE) {
    const body = await requestSheety('materiales', {
      method: 'POST',
      body: JSON.stringify({ material: payload }),
    });
    return body.material || body;
  }

  const mock = await readMock();
  const list = mock.materiales || [];
  const newId = Math.max(0, ...list.map(m => m.id || 0)) + 1;
  const newMaterial = { id: newId, ...payload };
  list.push(newMaterial);
  mock.materiales = list;
  await writeMock(mock);
  return newMaterial;
}

export async function updateMaterial(id, payload) {
  if (!id) throw new Error('updateMaterial: id is required');
  if (SHEETY_BASE) {
    const body = await requestSheety(`materiales/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ material: payload }),
    });
    return body.material || body;
  }

  const mock = await readMock();
  const list = mock.materiales || [];
  const idx = list.findIndex(x => String(x.id) === String(id));
  if (idx === -1) throw new Error('Material no encontrado');
  list[idx] = { ...list[idx], ...payload };
  mock.materiales = list;
  await writeMock(mock);
  return list[idx];
}

export async function deleteMaterial(id) {
  if (!id) throw new Error('deleteMaterial: id is required');
  if (SHEETY_BASE) {
    await requestSheety(`materiales/${id}`, { method: 'DELETE' });
    return { success: true };
  }

  const mock = await readMock();
  const list = mock.materiales || [];
  const idx = list.findIndex(x => String(x.id) === String(id));
  if (idx === -1) throw new Error('Material no encontrado');
  list.splice(idx, 1);
  mock.materiales = list;
  await writeMock(mock);
  return { success: true };
}

// ============================================
// GOOGLE SHEETS DIRECT INTEGRATION
// ============================================
const USE_GOOGLE_SHEETS = process.env.USE_GOOGLE_SHEETS === 'true';

let googleSheetsModule = null;

async function getGoogleSheetsModule() {
  if (!googleSheetsModule) {
    googleSheetsModule = await import('./googleSheets.js');
  }
  return googleSheetsModule;
}

// ===== ALUMNOS con Google Sheets =====
async function getAlumnosFromSheets() {
  const gs = await getGoogleSheetsModule();
  const rows = await gs.readSheetRange('Alumnos!A1:H100');
  const alumnos = gs.rowsToObjects(rows);
  // Convertir materias de string a array y mapear id_alumno a id
  return alumnos.map(a => ({
    id: a.id_alumno || a.id,
    nombre: a.nombre,
    edad: a.edad,
    curso: a.curso,
    telefono_padre: a.telefono_padre,
    materias: a.materias ? a.materias.split(',').map(m => m.trim()) : [],
    clases_compradas: a.clases_compradas,
    horas: a.horas || ''
  }));
}

async function createAlumnoInSheets(payload) {
  const gs = await getGoogleSheetsModule();
  console.log('📊 Leyendo hoja Alumnos...');
  const rows = await gs.readSheetRange('Alumnos!A1:H100');
  console.log(`📊 Filas leídas: ${rows.length}`);
  
  const alumnos = gs.rowsToObjects(rows);
  console.log(`👥 Alumnos existentes: ${alumnos.length}`);
  
  // Generar nuevo ID basado en id_alumno
  const newId = Math.max(0, ...alumnos.map(a => parseInt(a.id_alumno) || 0)) + 1;
  console.log(`🆔 Nuevo ID generado: ${newId}`);
  
  // Encontrar primera fila vacía
  const rowNumber = rows.length + 1;
  console.log(`📝 Escribiendo en fila: ${rowNumber}`);
  
  // Convertir materias array a string
  const materiasStr = Array.isArray(payload.materias) ? payload.materias.join(', ') : payload.materias;
  
  const newRow = [
    newId,
    payload.nombre || '',
    payload.edad || '',
    payload.curso || '',
    payload.telefono_padre || '',
    materiasStr || '',
    payload.clases_compradas || 0,
    payload.horas || ''
  ];
  
  console.log('📊 Datos a guardar:', newRow);
  
  await gs.updateSheetRange(`Alumnos!A${rowNumber}:H${rowNumber}`, [newRow]);
  console.log('✅ Alumno guardado en Google Sheets');
  
  return { id: newId, ...payload, materias: Array.isArray(payload.materias) ? payload.materias : [] };
}

async function updateAlumnoInSheets(id, payload) {
  const gs = await getGoogleSheetsModule();
  const rows = await gs.readSheetRange('Alumnos!A1:H100');
  const alumnos = gs.rowsToObjects(rows);
  const idx = alumnos.findIndex(a => String(a.id_alumno) === String(id));
  if (idx === -1) throw new Error('Alumno no encontrado');
  
  const rowNumber = idx + 2; // +1 header, +1 índice base-1
  const materiasStr = Array.isArray(payload.materias) ? payload.materias.join(', ') : payload.materias;
  
  const updatedRow = [
    id,
    payload.nombre || alumnos[idx].nombre,
    payload.edad || alumnos[idx].edad,
    payload.curso || alumnos[idx].curso,
    payload.telefono_padre || alumnos[idx].telefono_padre,
    materiasStr || alumnos[idx].materias,
    payload.clases_compradas || alumnos[idx].clases_compradas,
    payload.horas || alumnos[idx].horas
  ];
  
  await gs.updateSheetRange(`Alumnos!A${rowNumber}:H${rowNumber}`, [updatedRow]);
  
  return { id, ...payload };
}

async function deleteAlumnoFromSheets(id) {
  const gs = await getGoogleSheetsModule();
  const rows = await gs.readSheetRange('Alumnos!A1:H100');
  const alumnos = gs.rowsToObjects(rows);
  const idx = alumnos.findIndex(a => String(a.id_alumno) === String(id));
  if (idx === -1) throw new Error('Alumno no encontrado');
  
  const rowNumber = idx + 2;
  // Limpiar la fila (Google Sheets API no tiene delete row directo)
  await gs.updateSheetRange(`Alumnos!A${rowNumber}:H${rowNumber}`, [['', '', '', '', '', '', '', '']]);
  
  // Eliminar en cascada: limpiar filas en Asistencias donde id_alumno coincida
  try {
    const rowsA = await gs.readSheetRange('Asistencias!A1:F100');
    const asistencias = gs.rowsToObjects(rowsA);
    const rowsToClear = [];
    asistencias.forEach((a, i) => {
      const idAl = a.id_alumno || a.alumnoId || a.alumno;
      if (String(idAl) === String(id)) rowsToClear.push(i + 2); // +2 para compensar header y base-1
    });
    for (const r of rowsToClear) {
      await gs.updateSheetRange(`Asistencias!A${r}:F${r}`, [['', '', '', '', '', '']]);
    }
  } catch (e) {
    console.error('Error eliminando asistencias en cascada:', e.message);
  }

  return { success: true };
}

// ===== ASISTENCIAS con Google Sheets =====
async function getAsistenciasFromSheets(alumnoId) {
  const gs = await getGoogleSheetsModule();
  const rows = await gs.readSheetRange('Asistencias!A1:F100');
  const asistencias = gs.rowsToObjects(rows);
  
  // Mapear id_asistencia a id para compatibilidad con el frontend
  const mapped = asistencias.map(a => ({
    id: a.id_asistencia || a.id,
    id_alumno: a.id_alumno,
    fecha: a.fecha,
    hora: a.hora,
    estado: a.estado,
    observaciones: a.observaciones
  }));
  
  if (!alumnoId) return mapped;
  return mapped.filter(a => String(a.id_alumno) === String(alumnoId));
}

async function createAsistenciaInSheets(payload) {
  const gs = await getGoogleSheetsModule();
  console.log('📊 Leyendo hoja Asistencias...');
  const rows = await gs.readSheetRange('Asistencias!A1:F100');
  console.log(`📊 Filas leídas: ${rows.length}`);
  
  // Generar ID único basado en timestamp + random para evitar colisiones en requests paralelos
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const newId = parseInt(`${timestamp}${random}`.slice(-9)); // Últimos 9 dígitos para mantener ID manejable
  console.log(`🆔 Nuevo ID único generado: ${newId}`);
  
  const rowNumber = rows.length + 1;
  console.log(`📝 Escribiendo en fila: ${rowNumber}`);
  
  const newRow = [
    newId,
    payload.id_alumno || '',
    payload.fecha || '',
    payload.hora || '',
    payload.estado || 'Pendiente',
    payload.observaciones || ''
  ];
  
  console.log('📊 Datos a guardar:', newRow);
  
  await gs.updateSheetRange(`Asistencias!A${rowNumber}:F${rowNumber}`, [newRow]);
  console.log('✅ Asistencia guardada en Google Sheets');
  
  return { id: newId, id_asistencia: newId, ...payload };
}

async function updateAsistenciaInSheets(id, payload) {
  const gs = await getGoogleSheetsModule();
  const rows = await gs.readSheetRange('Asistencias!A1:F100');
  const asistencias = gs.rowsToObjects(rows);
  const idx = asistencias.findIndex(a => String(a.id_asistencia) === String(id));
  if (idx === -1) throw new Error('Asistencia no encontrada');
  
  const rowNumber = idx + 2;
  const updated = { ...asistencias[idx], ...payload };
  
  const updatedRow = [
    updated.id_asistencia || id,
    updated.id_alumno,
    updated.fecha,
    updated.hora,
    updated.estado,
    updated.observaciones || ''
  ];
  
  await gs.updateSheetRange(`Asistencias!A${rowNumber}:F${rowNumber}`, [updatedRow]);
  
  return { id, ...updated };
}

async function deleteAsistenciaFromSheets(id) {
  const gs = await getGoogleSheetsModule();
  const rows = await gs.readSheetRange('Asistencias!A1:F100');
  const asistencias = gs.rowsToObjects(rows);
  const idx = asistencias.findIndex(a => String(a.id_asistencia) === String(id));
  if (idx === -1) throw new Error('Asistencia no encontrada');
  
  const rowNumber = idx + 2;
  // Limpiar la fila
  await gs.updateSheetRange(`Asistencias!A${rowNumber}:F${rowNumber}`, [['', '', '', '', '', '']]);
  
  return { success: true };
}

// ===== MATERIALES con Google Sheets =====
async function getMaterialesFromSheets(materia) {
  return retryWithBackoff(async () => {
    console.log('📚 getMaterialesFromSheets iniciado');
    console.log('🔍 Materia filtro:', materia);
    const gs = await getGoogleSheetsModule();
    console.log('✅ GoogleSheets module obtenido');
    console.log('📊 Leyendo hoja Materiales...');
    const rows = await gs.readSheetRange('Materiales!A1:F100');
    console.log(`📊 Filas leídas de Materiales: ${rows.length}`);
    
    if (!rows || rows.length === 0) {
      throw new Error('La hoja Materiales está vacía o no se pudo leer');
    }
    
    console.log('📋 Primera fila (headers):', rows[0]);
    const all = gs.rowsToObjects(rows);
    console.log(`📋 Materiales encontrados: ${all.length}`);
    
    if (all.length === 0) {
      console.warn('⚠️ No hay materiales en la hoja');
    } else {
      console.log('📄 Primer material:', all[0]);
    }
    
    if (!materia) return all;
    const filtered = all.filter(m => m.materia === materia);
    console.log(`🔍 Materiales filtrados por "${materia}": ${filtered.length}`);
    return filtered;
  }, 3, 1000);
}

async function createMaterialInSheets(payload) {
  const gs = await getGoogleSheetsModule();
  const rows = await gs.readSheetRange('Materiales!A1:F100');
  const materiales = gs.rowsToObjects(rows);
  
  const newId = Math.max(0, ...materiales.map(m => parseInt(m.id) || 0)) + 1;
  const rowNumber = rows.length + 1;
  
  const newRow = [
    newId,
    payload.materia || '',
    payload.titulo || '',
    payload.descripcion || '',
    payload.url_recurso || '',
    payload.imagen_url || ''
  ];
  
  await gs.updateSheetRange(`Materiales!A${rowNumber}:F${rowNumber}`, [newRow]);
  
  return { id: newId, ...payload };
}

async function updateMaterialInSheets(id, payload) {
  const gs = await getGoogleSheetsModule();
  const rows = await gs.readSheetRange('Materiales!A1:F100');
  const materiales = gs.rowsToObjects(rows);
  const idx = materiales.findIndex(m => String(m.id) === String(id));
  if (idx === -1) throw new Error('Material no encontrado');
  
  const rowNumber = idx + 2;
  const updated = { ...materiales[idx], ...payload };
  
  const updatedRow = [
    id,
    updated.materia,
    updated.titulo,
    updated.descripcion,
    updated.url_recurso,
    updated.imagen_url
  ];
  
  await gs.updateSheetRange(`Materiales!A${rowNumber}:F${rowNumber}`, [updatedRow]);
  
  return updated;
}

async function deleteMaterialFromSheets(id) {
  const gs = await getGoogleSheetsModule();
  const rows = await gs.readSheetRange('Materiales!A1:F100');
  const materiales = gs.rowsToObjects(rows);
  const idx = materiales.findIndex(m => String(m.id) === String(id));
  if (idx === -1) throw new Error('Material no encontrado');
  
  const rowNumber = idx + 2;
  await gs.updateSheetRange(`Materiales!A${rowNumber}:F${rowNumber}`, [['', '', '', '', '', '']]);
  
  return { success: true };
}

// Wrapper functions que deciden entre mock y Google Sheets
export async function getAlumnosWrapper() {
  if (USE_GOOGLE_SHEETS) return getAlumnosFromSheets();
  return getAlumnos();
}

export async function createAlumnoWrapper(payload) {
  if (USE_GOOGLE_SHEETS) return createAlumnoInSheets(payload);
  return createAlumno(payload);
}

export async function updateAlumnoWrapper(id, payload) {
  if (USE_GOOGLE_SHEETS) return updateAlumnoInSheets(id, payload);
  return updateAlumno(id, payload);
}

export async function deleteAlumnoWrapper(id) {
  if (USE_GOOGLE_SHEETS) return deleteAlumnoFromSheets(id);
  return deleteAlumno(id);
}

export async function getAsistenciasWrapper(alumnoId) {
  if (USE_GOOGLE_SHEETS) return getAsistenciasFromSheets(alumnoId);
  return getAsistencias(alumnoId);
}

export async function createAsistenciaWrapper(payload) {
  if (USE_GOOGLE_SHEETS) return createAsistenciaInSheets(payload);
  // Fallback a mock
  const mock = await readMock();
  const list = mock.asistencias || [];
  const newId = Math.max(0, ...list.map(a => a.id || 0)) + 1;
  const newAsistencia = { id: newId, ...payload };
  list.push(newAsistencia);
  mock.asistencias = list;
  await writeMock(mock);
  return newAsistencia;
}

export async function updateAsistenciaWrapper(id, payload) {
  if (USE_GOOGLE_SHEETS) return updateAsistenciaInSheets(id, payload);
  return updateAsistencia(id, payload);
}

export async function deleteAsistenciaWrapper(id) {
  if (USE_GOOGLE_SHEETS) return deleteAsistenciaFromSheets(id);
  // Fallback a mock
  const mock = await readMock();
  const list = mock.asistencias || [];
  const idx = list.findIndex(a => String(a.id) === String(id));
  if (idx === -1) throw new Error('Asistencia no encontrada');
  list.splice(idx, 1);
  mock.asistencias = list;
  await writeMock(mock);
  return { success: true };
}

export async function getMaterialesWrapper(materia) {
  if (USE_GOOGLE_SHEETS) return getMaterialesFromSheets(materia);
  return getMateriales(materia);
}

export async function createMaterialWrapper(payload) {
  if (USE_GOOGLE_SHEETS) return createMaterialInSheets(payload);
  return createMaterial(payload);
}

export async function updateMaterialWrapper(id, payload) {
  if (USE_GOOGLE_SHEETS) return updateMaterialInSheets(id, payload);
  return updateMaterial(id, payload);
}

export async function deleteMaterialWrapper(id) {
  if (USE_GOOGLE_SHEETS) return deleteMaterialFromSheets(id);
  return deleteMaterial(id);
}
