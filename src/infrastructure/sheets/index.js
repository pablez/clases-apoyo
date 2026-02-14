import { readSheetRange, appendSheetRange, updateSheetRange, rowsToObjects } from '../../services/googleSheets.js';

/** Sheets adapter for Alumnos (minimal implementation) */
export async function getAlumnos() {
  const rows = await readSheetRange('Alumnos!A1:H100');
  const objs = rowsToObjects(rows);
  // Also read Usuarios sheet to attach user info (email/rol/password) when available
  let usuariosMap = {};
  try {
    const urows = await readSheetRange('Usuarios!A1:E100');
    const uobjs = rowsToObjects(urows);
    uobjs.forEach(u => {
      const alumnoId = u.id_alumno || u.id || u.idAlumno || '';
      if (alumnoId) {
        // Sanitize usuario object: do not expose internal id_usuario or password to client
        usuariosMap[String(alumnoId)] = {
          email: u.email || u.correo || '',
          rol: u.rol || 'padre'
        };
      }
    });
  } catch (e) {
    // ignore if Usuarios sheet not present
  }

  return objs.map(o => {
    const alumnoId = o.id_alumno || o.id || o.idAlumno || '';
    const usuario = usuariosMap[String(alumnoId)];
    const materiasVal = Array.isArray(o.materias) ? o.materias.join(', ') : (o.materias || '');
      return {
      id: alumnoId,
      nombre: o.nombre || '',
      edad: o.edad || '',
      curso: o.curso || '',
      telefono_padre: o.telefono_padre || o.telefono || '',
      materias: materiasVal,
      clases_compradas: o.clases_compradas || '',
      horas: o.horas || '',
      email: usuario ? (usuario.email || '') : (o.email || ''),
      rol: usuario ? (usuario.rol || 'padre') : (o.rol || undefined),
      // attach sanitized usuario (no id_usuario or password)
      _usuario: usuario || null
    };
  });
}

export async function createAlumno(payload) {
  // payload: { nombre, edad, curso, telefono_padre, materias, clases_compradas, horas }
  const rows = await readSheetRange('Alumnos!A1:H100');
  const objs = rowsToObjects(rows);
  const ids = objs.map(o => parseInt(o.id_alumno || o.id || 0) || 0);
  const newId = String(Math.max(0, ...ids) + 1);
  const materiasVal = Array.isArray(payload.materias) ? payload.materias.join(', ') : (payload.materias || '');
  const row = [newId, payload.nombre || '', payload.edad || '', payload.curso || '', payload.telefono_padre || '', materiasVal, payload.clases_compradas || '', payload.horas || ''];
  const result = await appendSheetRange('Alumnos!A:H', [row]);
  // Si el payload trae credenciales para usuario, agregar fila en hoja "Usuarios"
  let usuarioResult = null;
  if (payload.email) {
    // id_usuario simplificado: prefijo 'u_' + timestamp
    const idUsuario = `u_${Date.now()}`;
    const usuarioRow = [idUsuario, newId, payload.email || '', payload.password || '', payload.rol || 'padre'];
    usuarioResult = await appendSheetRange('Usuarios!A:E', [usuarioRow]);
  }

  return { id: newId, ...payload, _appendResult: result, _usuarioAppend: usuarioResult };
}

export async function updateAlumno(id, payload) {
  // Leer todas las filas para localizar la fila del alumno
  const range = 'Alumnos!A1:H100';
  const rows = await readSheetRange(range);
  if (!rows || rows.length === 0) throw new Error('Alumnos sheet empty');

  const headers = rows[0];
  const bodyRows = rows.slice(1);
  const idx = bodyRows.findIndex(r => String(r[0] || r[0]) === String(id) || String(r[0]) === String(id));
  if (idx === -1) throw new Error('Alumno no encontrado');

  const sheetRowNumber = idx + 2; // +1 for header, +1 for 1-based

  // Build updated row values in same column order as createAlumno
  const materiasVal = Array.isArray(payload.materias) ? payload.materias.join(', ') : (payload.materias || bodyRows[idx][5] || '');
  const newRow = [
    String(id),
    (payload.nombre ?? bodyRows[idx][1]) || '',
    (payload.edad ?? bodyRows[idx][2]) || '',
    (payload.curso ?? bodyRows[idx][3]) || '',
    (payload.telefono_padre ?? bodyRows[idx][4]) || '',
    materiasVal,
    (payload.clases_compradas ?? bodyRows[idx][6]) || '',
    (payload.horas ?? bodyRows[idx][7]) || ''
  ];

  await updateSheetRange(`Alumnos!A${sheetRowNumber}:H${sheetRowNumber}`, [newRow]);

  // Si payload incluye datos de usuario, actualizar o crear fila en Usuarios
  if (payload.email || payload.password || payload.rol) {
    try {
      const usuariosRows = await readSheetRange('Usuarios!A1:E100');
      const usuariosBody = usuariosRows.slice(1);
      const foundIdx = usuariosBody.findIndex(r => String(r[1]) === String(id));
      if (foundIdx !== -1) {
        const usuariosRowNumber = foundIdx + 2;
        const existing = usuariosBody[foundIdx];
        const idUsuario = existing[0] || `u_${Date.now()}`;
        const usuarioRow = [
          idUsuario,
          String(id),
          payload.email ?? existing[2] ?? '',
          payload.password ?? existing[3] ?? '',
          payload.rol ?? existing[4] ?? 'padre'
        ];
        await updateSheetRange(`Usuarios!A${usuariosRowNumber}:E${usuariosRowNumber}`, [usuarioRow]);
      } else {
        // append new usuario row
        const idUsuario = `u_${Date.now()}`;
        const usuarioRow = [idUsuario, String(id), payload.email || '', payload.password || '', payload.rol || 'padre'];
        await appendSheetRange('Usuarios!A:E', [usuarioRow]);
      }
    } catch (e) {
      console.warn('No se pudo actualizar hoja Usuarios:', e.message);
    }
  }

  return { id: String(id), ...payload };
}

export async function deleteAlumno(id) {
  // Leer todas las filas para localizar la fila del alumno y reescribir la hoja sin esa fila
  const alumnosRange = 'Alumnos!A1:H100';
  const alumnosRows = await readSheetRange(alumnosRange);
  if (!alumnosRows || alumnosRows.length === 0) throw new Error('Alumnos sheet empty');

  const alumnosHeaders = alumnosRows[0];
  const alumnosBody = alumnosRows.slice(1);
  const idx = alumnosBody.findIndex(r => String(r[0] || r[0]) === String(id) || String(r[0]) === String(id));
  if (idx === -1) throw new Error('Alumno no encontrado');

  // Remove the alumno row
  alumnosBody.splice(idx, 1);
  const newAlumnosRows = [alumnosHeaders, ...alumnosBody];
  // Pad to original length to ensure rows below are cleared
  const originalAlumnosLen = alumnosRows.length;
  while (newAlumnosRows.length < originalAlumnosLen) {
    newAlumnosRows.push(new Array(alumnosHeaders.length).fill(''));
  }
  await updateSheetRange(`Alumnos!A1:H${originalAlumnosLen}`, newAlumnosRows);

  // Eliminar asistencias asociadas (Asistencias!A1:F100)
  try {
    const asisRange = 'Asistencias!A1:F100';
    const asisRows = await readSheetRange(asisRange);
    if (asisRows && asisRows.length > 0) {
      const asisHeaders = asisRows[0];
      const asisBody = asisRows.slice(1).filter(r => String(r[1]) !== String(id));
      const newAsisRows = [asisHeaders, ...asisBody];
      const originalAsisLen = asisRows.length;
      while (newAsisRows.length < originalAsisLen) {
        newAsisRows.push(new Array(asisHeaders.length).fill(''));
      }
      await updateSheetRange(`Asistencias!A1:F${originalAsisLen}`, newAsisRows);
    }
  } catch (e) {
    console.warn('No se pudo eliminar asistencias del alumno:', e.message);
  }

  // Eliminar usuario asociado en hoja Usuarios (Usuarios!A1:E100)
  try {
    const usuariosRange = 'Usuarios!A1:E100';
    const usuariosRows = await readSheetRange(usuariosRange);
    if (usuariosRows && usuariosRows.length > 0) {
      const usuariosHeaders = usuariosRows[0];
      const usuariosBody = usuariosRows.slice(1).filter(r => String(r[1]) !== String(id));
      const newUsuariosRows = [usuariosHeaders, ...usuariosBody];
      const originalUsuariosLen = usuariosRows.length;
      while (newUsuariosRows.length < originalUsuariosLen) {
        newUsuariosRows.push(new Array(usuariosHeaders.length).fill(''));
      }
      await updateSheetRange(`Usuarios!A1:E${originalUsuariosLen}`, newUsuariosRows);
    }
  } catch (e) {
    console.warn('No se pudo eliminar usuario asociado al alumno:', e.message);
  }

  return { success: true };
}

export async function cascadeDelete(id) {
  // Only remove asistencias and usuario rows, keep the alumno row intact
  // Eliminar asistencias asociadas (Asistencias!A1:F100)
  try {
    const asisRange = 'Asistencias!A1:F100';
    const asisRows = await readSheetRange(asisRange);
    if (asisRows && asisRows.length > 0) {
      const asisHeaders = asisRows[0];
      const asisBody = asisRows.slice(1).filter(r => String(r[1]) !== String(id));
      const newAsisRows = [asisHeaders, ...asisBody];
      const originalAsisLen = asisRows.length;
      while (newAsisRows.length < originalAsisLen) {
        newAsisRows.push(new Array(asisHeaders.length).fill(''));
      }
      await updateSheetRange(`Asistencias!A1:F${originalAsisLen}`, newAsisRows);
    }
  } catch (e) {
    console.warn('No se pudo eliminar asistencias del alumno (cascade):', e.message);
  }

  // Eliminar usuario asociado en hoja Usuarios (Usuarios!A1:E100)
  try {
    const usuariosRange = 'Usuarios!A1:E100';
    const usuariosRows = await readSheetRange(usuariosRange);
    if (usuariosRows && usuariosRows.length > 0) {
      const usuariosHeaders = usuariosRows[0];
      const usuariosBody = usuariosRows.slice(1).filter(r => String(r[1]) !== String(id));
      const newUsuariosRows = [usuariosHeaders, ...usuariosBody];
      const originalUsuariosLen = usuariosRows.length;
      while (newUsuariosRows.length < originalUsuariosLen) {
        newUsuariosRows.push(new Array(usuariosHeaders.length).fill(''));
      }
      await updateSheetRange(`Usuarios!A1:E${originalUsuariosLen}`, newUsuariosRows);
    }
  } catch (e) {
    console.warn('No se pudo eliminar usuario asociado al alumno (cascade):', e.message);
  }

  return { success: true };
}

export default { getAlumnos, createAlumno, updateAlumno, deleteAlumno, cascadeDelete };
