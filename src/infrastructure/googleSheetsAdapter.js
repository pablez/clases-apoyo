// Adapter for Google Sheets integration using helpers in `src/services/googleSheets.js`
import { readSheetRange, updateSheetRange, rowsToObjects } from '../services/googleSheets.js';

export async function getAsistenciasFromSheets(alumnoId) {
  const rows = await readSheetRange('Asistencias!A1:F100');
  // Manejar dos formatos: con encabezados (first row = headers) o sin encabezados (data directo)
  let asistencias = [];
  if (rows && rows.length > 0) {
    const firstRow = rows[0].map ? rows[0].map(c => String(c || '').toLowerCase()) : [];
    const hasHeaders = firstRow.some(h => ['id', 'id_asistencia', 'id_alumno', 'fecha', 'hora', 'estado'].includes(h));
    if (hasHeaders) {
      asistencias = rowsToObjects(rows);
    } else {
      // Fallbacks según número/forma de columnas:
      // - Formato completo A-F: [id_asistencia, id_alumno, fecha, hora, estado, observaciones]
      // - Formato corto (común): [fecha, hora, estado, observaciones]
      asistencias = rows.map(r => {
        // Normalizar longitud
        const c = r.concat([]);
        // Detectar si la primera columna es una fecha YYYY-MM-DD
        const maybeDate = c[0] && /^\d{4}-\d{2}-\d{2}$/.test(String(c[0]));
        if (maybeDate) {
          return {
            id_asistencia: '',
            id_alumno: alumnoId || '',
            fecha: c[0] || '',
            hora: c[1] || '',
            estado: c[2] || '',
            observaciones: c[3] || ''
          };
        }
        // Si no parece fecha, asumimos formato completo A-F
        return {
          id_asistencia: c[0] || '',
          id_alumno: c[1] || '',
          fecha: c[2] || '',
          hora: c[3] || '',
          estado: c[4] || '',
          observaciones: c[5] || ''
        };
      });
    }
  }
  const mapped = asistencias.map(a => ({
    id: a.id_asistencia || a.id || '',
    id_alumno: a.id_alumno || a.alumnoId || a.alumno || '',
    fecha: a.fecha || '',
    hora: a.hora || '',
    estado: a.estado || '',
    observaciones: a.observaciones || a.observacion || ''
  }));
  if (!alumnoId) return mapped;
  return mapped.filter(a => String(a.id_alumno) === String(alumnoId));
}

export async function createAsistenciaInSheets(payload) {
  const rows = await readSheetRange('Asistencias!A1:F100');
  const asistencias = rowsToObjects(rows);
  const ids = asistencias.map(a => parseInt(a.id_asistencia || a.id || 0) || 0);
  const newId = String(Math.max(0, ...ids) + 1);
  const newRow = [newId, payload.id_alumno || payload.alumnoId || payload.alumno || '', payload.fecha || '', payload.hora || '', payload.estado || '', payload.observaciones || ''];
  const rowNumber = rows.length + 1; // header + existing rows
  await updateSheetRange(`Asistencias!A${rowNumber}:F${rowNumber}`, [newRow]);
  return { id: newId, id_alumno: newRow[1], fecha: newRow[2], hora: newRow[3], estado: newRow[4], observaciones: newRow[5] };
}

export async function updateAsistenciaInSheets(id, payload) {
  const rows = await readSheetRange('Asistencias!A1:F100');
  const asistencias = rowsToObjects(rows);
  const idx = asistencias.findIndex(a => String(a.id_asistencia || a.id || '') === String(id));
  if (idx === -1) throw new Error('Asistencia no encontrada en Sheets');
  const rowNumber = idx + 2; // header row
  const existing = asistencias[idx];
  const updated = {
    id_asistencia: existing.id_asistencia || existing.id || id,
    id_alumno: payload.id_alumno || payload.alumnoId || existing.id_alumno || existing.alumno || '',
    fecha: payload.fecha || existing.fecha || '',
    hora: payload.hora || existing.hora || '',
    estado: payload.estado || existing.estado || '',
    observaciones: payload.observaciones || existing.observaciones || ''
  };
  const updatedRow = [updated.id_asistencia, updated.id_alumno, updated.fecha, updated.hora, updated.estado, updated.observaciones];
  await updateSheetRange(`Asistencias!A${rowNumber}:F${rowNumber}`, [updatedRow]);
  return { id: updated.id_asistencia, id_alumno: updated.id_alumno, fecha: updated.fecha, hora: updated.hora, estado: updated.estado, observaciones: updated.observaciones };
}

export async function deleteAsistenciaFromSheets(id) {
  const rows = await readSheetRange('Asistencias!A1:F100');
  const asistencias = rowsToObjects(rows);
  const idx = asistencias.findIndex(a => String(a.id_asistencia || a.id || '') === String(id));
  if (idx === -1) throw new Error('Asistencia no encontrada en Sheets');
  const rowNumber = idx + 2;
  await updateSheetRange(`Asistencias!A${rowNumber}:F${rowNumber}`, [['', '', '', '', '', '']]);
  return { success: true };
}

export default {
  getAsistenciasFromSheets,
  createAsistenciaInSheets,
  updateAsistenciaInSheets,
  deleteAsistenciaFromSheets,
};
