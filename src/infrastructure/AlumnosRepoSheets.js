import { readSheetRange, rowsToObjects, readUsuarios } from '../services/googleSheets.js';

function normalizeAlumno(rowObj) {
  if (!rowObj) return null;
  return {
    id: rowObj.id_alumno || rowObj.id || rowObj.id_alumno || '',
    nombre: rowObj.nombre || rowObj.nombre || '',
    edad: rowObj.edad || rowObj.age || '',
    curso: rowObj.curso || rowObj.grade || '',
    telefono_padre: rowObj.telefono_padre || rowObj.telefono || '',
    materias: Array.isArray(rowObj.materias) ? rowObj.materias : (rowObj.materias ? String(rowObj.materias).split(',').map(s=>s.trim()).filter(Boolean) : []),
    clases_compradas: rowObj.clases_compradas || rowObj.clases || 0,
    horas: rowObj.horas || ''
  };
}

export default class AlumnosRepoSheets {
  constructor() {}

  async list() {
    const rows = await readSheetRange('Alumnos!A1:H100');
    const objs = rowsToObjects(rows);
    return objs.map(normalizeAlumno);
  }

  async getById(id) {
    if (!id) return null;
    const rows = await readSheetRange('Alumnos!A1:H100');
    const objs = rowsToObjects(rows);
    const found = objs.find(a => String(a.id_alumno || a.id || '') === String(id));
    return normalizeAlumno(found || null);
  }

  // Busca por email (o id/nombre). Si existe una hoja Usuarios, primero la consulta
  async findByEmail(email) {
    if (!email) return null;

    // 1) Comprobar Usuarios sheet
    try {
      const usuarios = await readUsuarios();
      const match = (usuarios || []).find(u => (u.email && String(u.email) === String(email)));
      if (match) {
        if (match.id_alumno || match.id) {
          const alumnoId = match.id_alumno || match.id;
          const alumno = await this.getById(alumnoId);
          if (alumno) {
            // Adjuntar información del usuario (email/rol/password) para verificación
            alumno._usuario = match;
            alumno.password = match.password || match.contraseña || match.pass || '';
            return alumno;
          }
        }
        // If Usuarios entry exists but doesn't reference an alumno, return a synthetic alumno-like object
        const synthetic = {
          id: match.id_usuario || `u_${Date.now()}`,
          nombre: match.email || 'Admin',
          materias: [],
          clases_compradas: 0,
          _usuario: match,
          password: match.password || match.contraseña || match.pass || ''
        };
        return synthetic;
      }
    } catch (e) {
      // Si falla la lectura de Usuarios, seguimos con la búsqueda directa en Alumnos
      console.warn('No se pudo leer Usuarios sheet:', e.message);
    }

    // 2) Buscar directo en Alumnos por id o email o nombre
    const rows = await readSheetRange('Alumnos!A1:H100');
    const objs = rowsToObjects(rows);
    const candidato = objs.find(a => (
      String(a.id_alumno || a.id || '') === String(email) ||
      (a.email && String(a.email) === String(email)) ||
      (a.nombre && String(a.nombre) === String(email))
    ));
    return normalizeAlumno(candidato || null);
  }
}
