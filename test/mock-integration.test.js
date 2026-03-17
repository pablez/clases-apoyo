import fs from 'fs/promises';
import path from 'path';
import mock from '../src/infrastructure/mock/index.js';

async function run() {
  console.log('Running mock integration tests...');
  // ensure clean mock
  const mockPath = path.resolve(process.cwd(), 'src', 'data', 'mock.json');
  try {
    await fs.writeFile(mockPath, JSON.stringify({ alumnos: [], asistencias: [], materiales: [], usuarios: [] }, null, 2), 'utf8');
  } catch (e) { /* ignore */ }

  // Create alumno with usuario
  const alumno = await mock.createAlumno({ nombre: 'Test', email: 'padre@example.com', password: 'test' });
  console.log('Created alumno:', alumno.id || alumno.id_alumno || alumno);

  const usuarios = await mock.getUsuarios();
  console.log('Usuarios after create:', usuarios.length);
  if (usuarios.length === 0) throw new Error('Usuario not created');

  // Create asistencia
  const asis = await mock.createAsistencia({ id_alumno: String(alumno.id || alumno.id_alumno), fecha: '01/01/2026', hora: '10:00', estado: 'Presente' });
  console.log('Created asistencia:', asis.id);

  // Fetch asistencias
  const got = await mock.getAsistencias(String(alumno.id || alumno.id_alumno));
  if (!Array.isArray(got) || got.length === 0) throw new Error('Asistencias not returned');

  // Cascade delete should remove usuario and asistencias but keep alumno
  await mock.cascadeDelete(String(alumno.id || alumno.id_alumno));
  const usuariosAfter = await mock.getUsuarios();
  const asisAfter = await mock.getAsistencias(String(alumno.id || alumno.id_alumno));
  if ((usuariosAfter || []).length !== 0) throw new Error('Usuarios not removed by cascade');
  if ((asisAfter || []).length !== 0) throw new Error('Asistencias not removed by cascade');

  console.log('Mock integration tests passed');
}

run().catch(e => { console.error(e); process.exit(1); });
