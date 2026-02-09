import fs from 'fs';
import path from 'path';

const MOCK_PATH = path.resolve(process.cwd(), 'src', 'data', 'mock.json');

function readMockData() {
  if (!fs.existsSync(MOCK_PATH)) return { alumnos: [], usuarios: [] };
  const raw = fs.readFileSync(MOCK_PATH, 'utf8');
  try { return JSON.parse(raw); } catch (e) { return { alumnos: [], usuarios: [] }; }
}

async function resolveRepo() {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) return import('../../../infrastructure/sheets/usuarios.js');
  return import('../../../infrastructure/mock/index.js');
}

export async function GET({ url }) {
  try {
    const repo = await resolveRepo();
    let usuarios = [];
    let alumnos = [];
    if (repo.getUsuarios) usuarios = await repo.getUsuarios();
    if (repo.getAlumnos) alumnos = await repo.getAlumnos();

    const alumnosById = new Map((alumnos || []).map(a => [String(a.id_alumno || a.id || a.idAlumno || a.id), a]));
    const merged = (usuarios || []).map(u => {
      const alumnoId = u.id_alumno || u.alumnoId || u.idAlumno || u.id_alumno || u.idAlumno;
      return { ...u, alumno: alumnosById.get(String(alumnoId)) || null };
    });

    return new Response(JSON.stringify(merged), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST({ request }) {
  try {
    const payload = await request.json();
    const repo = await resolveRepo();
    if (repo.createUsuario) {
      const result = await repo.createUsuario(payload);
      return new Response(JSON.stringify(result), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    const data = readMockData();
    data.usuarios = data.usuarios || [];
    data.usuarios.push(payload);
    fs.writeFileSync(MOCK_PATH, JSON.stringify(data, null, 2), 'utf8');

    return new Response(JSON.stringify(payload), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
