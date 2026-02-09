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

export default class AlumnosRepoMock {
  constructor() { }

  async list() {
    const mock = readMock();
    return mock.alumnos || [];
  }

  async getById(id) {
    const mock = readMock();
    return (mock.alumnos || []).find(a => String(a.id) === String(id)) || null;
  }

  async findByEmail(email) {
    const mock = readMock();
    const list = mock.alumnos || [];
    return list.find(a => String(a.id) === String(email) || (a.email && a.email === email) || a.nombre === email) || null;
  }

  async create(payload) {
    const mock = readMock();
    const list = mock.alumnos || [];
    const id = String(Date.now());
    const nuevo = { id, ...payload };
    list.push(nuevo);
    mock.alumnos = list;
    writeMock(mock);
    return nuevo;
  }

  async update(id, payload) {
    const mock = readMock();
    const list = mock.alumnos || [];
    const idx = list.findIndex(a => String(a.id) === String(id));
    if (idx === -1) throw new Error('Alumno no encontrado');
    list[idx] = { ...list[idx], ...payload };
    mock.alumnos = list;
    writeMock(mock);
    return list[idx];
  }

  async delete(id) {
    const mock = readMock();
    mock.alumnos = (mock.alumnos || []).filter(a => String(a.id) !== String(id));
    mock.asistencias = (mock.asistencias || []).filter(as => String(as.alumnoId || as.id_alumno) !== String(id));
    writeMock(mock);
  }
}
