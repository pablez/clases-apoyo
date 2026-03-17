export const prerender = false;

async function resolveRepo() {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) return import('../../../infrastructure/sheets/usuarios.js');
  return import('../../../infrastructure/mock/index.js');
}

export async function GET({ params }) {
  try {
    const repo = await resolveRepo();
    if (repo.getUsuarioById) {
      const u = await repo.getUsuarioById(params.id);
      if (!u) return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify(u), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (repo.getUsuarios) {
      const all = await repo.getUsuarios();
      const found = (all || []).find(x => String(x.id_usuario || x.id || '') === String(params.id));
      if (!found) return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify(found), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'No user repo available' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
