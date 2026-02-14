import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mockPath = path.resolve(__dirname, '../../data/mock.json');

const IS_TEST = process.env.NODE_ENV === 'test';
let MEM = null;

async function readMock() {
  if (IS_TEST && MEM) return MEM;
  try {
    const txt = await fs.readFile(mockPath, 'utf-8');
    const parsed = JSON.parse(txt);
    if (IS_TEST) MEM = parsed;
    return parsed;
  } catch (e) {
    const empty = { alumnos: [], asistencias: [], materiales: [], usuarios: [] };
    if (IS_TEST) MEM = empty;
    return empty;
  }
}

async function writeMock(data) {
  if (IS_TEST) {
    MEM = data;
    return;
  }
  await fs.mkdir(path.dirname(mockPath), { recursive: true });
  await fs.writeFile(mockPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getAlumnos() {
  const mock = await readMock();
  return mock.alumnos || [];
}

export async function createAlumno(payload) {
  const mock = await readMock();
  const list = mock.alumnos || [];
  const newId = Math.max(0, ...list.map(a => parseInt(a.id || a.id_alumno || 0))) + 1;
  const newAlumno = { id: String(newId), ...payload };
  list.push(newAlumno);
  mock.alumnos = list;
  // Si trae datos de usuario, crear entrada en mock.usuarios
  if (payload.email) {
    mock.usuarios = mock.usuarios || [];
    const idUsuario = `u_${Date.now()}`;
    const usuario = {
      id_usuario: idUsuario,
      id_alumno: String(newId),
      email: payload.email,
      password: payload.password || '',
      rol: payload.rol || 'padre'
    };
    mock.usuarios.push(usuario);
  }

  await writeMock(mock);
  return newAlumno;
}

export async function updateAlumno(id, payload) {
  const mock = await readMock();
  const list = mock.alumnos || [];
  const idx = list.findIndex(x => String(x.id || x.id_alumno) === String(id));
  if (idx === -1) throw new Error('Alumno no encontrado');
  list[idx] = { ...list[idx], ...payload };
  mock.alumnos = list;
  await writeMock(mock);
  return list[idx];
}

export async function deleteAlumno(id) {
  const mock = await readMock();
  const list = mock.alumnos || [];
  const idx = list.findIndex(x => String(x.id || x.id_alumno) === String(id));
  if (idx === -1) throw new Error('Alumno no encontrado');
  list.splice(idx, 1);
  mock.alumnos = list;
  if (mock.asistencias && Array.isArray(mock.asistencias)) {
    mock.asistencias = mock.asistencias.filter(a => String(a.alumnoId || a.id_alumno || a.alumno) !== String(id));
  }
  if (mock.usuarios && Array.isArray(mock.usuarios)) {
    mock.usuarios = mock.usuarios.filter(u => String(u.id_alumno || u.alumnoId || u.alumno) !== String(id));
  }
  await writeMock(mock);
  return { success: true };
}

export async function getAsistencias(alumnoId) {
  const mock = await readMock();
  const list = mock.asistencias || [];
  if (!alumnoId) return list;
  return list.filter(a => String(a.alumnoId || a.id_alumno || a.alumno) === String(alumnoId));
}

export async function createAsistencia(payload) {
  const mock = await readMock();
  const list = mock.asistencias || [];
  const newId = Math.max(0, ...list.map(a => parseInt(a.id || 0))) + 1;
  const newAsis = { id: String(newId), ...payload };
  list.push(newAsis);
  mock.asistencias = list;
  await writeMock(mock);
  return newAsis;
}

export async function updateAsistencia(id, payload) {
  const mock = await readMock();
  const list = mock.asistencias || [];
  const idx = list.findIndex(x => String(x.id || x.id_asistencia) === String(id));
  if (idx === -1) throw new Error('Asistencia not found');
  list[idx] = { ...list[idx], ...payload };
  mock.asistencias = list;
  await writeMock(mock);
  return list[idx];
}

export async function deleteAsistencia(id) {
  const mock = await readMock();
  const list = mock.asistencias || [];
  const idx = list.findIndex(x => String(x.id || x.id_asistencia) === String(id));
  if (idx === -1) throw new Error('Asistencia not found');
  list.splice(idx, 1);
  mock.asistencias = list;
  await writeMock(mock);
  return { success: true };
}

export async function getMateriales(materia) {
  const mock = await readMock();
  const list = mock.materiales || [];
  if (!materia) return list;
  return list.filter(m => m.materia === materia);
}

export async function getMaterialById(id) {
  const mock = await readMock();
  const mat = (mock.materiales || []).find(m => String(m.id) === String(id));
  if (!mat) throw new Error('Material not found');
  return mat;
}

export async function createMaterial(payload) {
  const mock = await readMock();
  const list = mock.materiales || [];
  const newId = Math.max(0, ...list.map(m => parseInt(m.id || 0))) + 1;
    const newMat = { id: String(newId), ...payload, nivel: payload.nivel || '', grado: payload.grado || '' };
  list.push(newMat);
  mock.materiales = list;
  await writeMock(mock);
  return newMat;
}

export async function updateMaterial(id, payload) {
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
  const mock = await readMock();
  const list = mock.materiales || [];
  const idx = list.findIndex(x => String(x.id) === String(id));
  if (idx === -1) throw new Error('Material no encontrado');
  list.splice(idx, 1);
  mock.materiales = list;
  await writeMock(mock);
  return { success: true };
}

export async function getUsuarios() {
  const mock = await readMock();
  return mock.usuarios || [];
}

export async function createUsuario(payload) {
  const mock = await readMock();
  mock.usuarios = mock.usuarios || [];
  mock.usuarios.push(payload);
  await writeMock(mock);
  return payload;
}

export default {
  getAlumnos,
  createAlumno,
  updateAlumno,
  deleteAlumno,
  getAsistencias,
  createAsistencia,
  updateAsistencia,
  deleteAsistencia,
  getMateriales,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getUsuarios,
  createUsuario,
};
