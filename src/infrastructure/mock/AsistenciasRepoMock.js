import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_PATH = path.resolve(__dirname, '../../data/mock.json');

function readMock() {
  try {
    const txt = fs.readFileSync(MOCK_PATH, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    return { alumnos: [], asistencias: [], materiales: [] };
  }
}

function writeMock(data) {
  fs.writeFileSync(MOCK_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export default class AsistenciasRepoMock {
  constructor() {}

  async list(alumnoId) {
    const mock = readMock();
    const list = mock.asistencias || [];
    if (!alumnoId) return list;
    return list.filter(a => String(a.alumnoId || a.id_alumno || a.alumno) === String(alumnoId));
  }

  async getById(id) {
    const mock = readMock();
    return (mock.asistencias || []).find(a => String(a.id) === String(id)) || null;
  }

  async create(payload) {
    const mock = readMock();
    const list = mock.asistencias || [];
    const newId = String(Math.max(0, ...list.map(x => parseInt(x.id || 0))) + 1);
    const nuevo = { id: newId, ...payload };
    list.push(nuevo);
    mock.asistencias = list;
    writeMock(mock);
    return nuevo;
  }

  async update(id, payload) {
    const mock = readMock();
    const list = mock.asistencias || [];
    const idx = list.findIndex(x => String(x.id) === String(id));
    if (idx === -1) throw new Error('Asistencia no encontrada');
    list[idx] = { ...list[idx], ...payload };
    mock.asistencias = list;
    writeMock(mock);
    return list[idx];
  }

  async delete(id) {
    const mock = readMock();
    mock.asistencias = (mock.asistencias || []).filter(a => String(a.id) !== String(id));
    writeMock(mock);
    return { success: true };
  }
}
