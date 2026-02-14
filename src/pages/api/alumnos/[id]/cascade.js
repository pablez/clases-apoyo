export const prerender = false;

async function resolveRepo() {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) return import('../../../../infrastructure/sheets/index.js');
  return import('../../../../infrastructure/mock/index.js');
}

export async function DELETE({ params }) {
  try {
    const repo = await resolveRepo();
    // Prefer explicit cascadeDelete if provided by repo, otherwise fallback to deleteAlumno
    if (repo.cascadeDelete) {
      await repo.cascadeDelete(params.id);
    } else if (repo.deleteAlumno) {
      await repo.deleteAlumno(params.id);
    } else {
      throw new Error('Operación no soportada en este repositorio');
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error en DELETE /api/alumnos/:id/cascade', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
