export const prerender = false;

async function resolveRepo() {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) {
    const mod = await import('../../../infrastructure/sheets/index.js');
    return mod;
  }
  const mod = await import('../../../infrastructure/mock/index.js');
  return mod;
}

export async function GET() {
  try {
    const repo = await resolveRepo();
    const data = await repo.getAlumnos();
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    console.log('📝 Creando alumno:', body);
    const repo = await resolveRepo();
    const data = await repo.createAlumno(body);
    return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('❌ Error al crear alumno:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
