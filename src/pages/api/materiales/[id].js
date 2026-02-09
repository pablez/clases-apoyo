export const prerender = false;

async function resolveRepo() {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) return import('../../../infrastructure/sheets/materiales.js');
  return import('../../../infrastructure/mock/index.js');
}

export async function PUT({ params, request }) {
  try {
    const body = await request.json();
    const repo = await resolveRepo();
    const data = await repo.updateMaterial(params.id, body);
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error al actualizar material:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE({ params }) {
  try {
    const repo = await resolveRepo();
    await repo.deleteMaterial(params.id);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error al eliminar material:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
