export const prerender = false;

async function resolveRepo() {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) return import('../../../../infrastructure/sheets/asistencias.js');
  return import('../../../../infrastructure/mock/index.js');
}

async function resolveAlumnosRepo() {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) {
    const mod = await import('../../../../infrastructure/AlumnosRepoSheets.js');
    return new mod.default();
  }
  const mod = await import('../../../../infrastructure/mock/AlumnosRepoMock.js');
  return new mod.default();
}

function parseSessionCookie(request) {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(/session=([^;]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch (e) {
    return m[1];
  }
}

export async function GET({ request }) {
  try {
    const rawCookie = request.headers.get('cookie');
    const rawAuth = request.headers.get('authorization') || request.headers.get('Authorization');
    console.log('API: /api/alumno/asistencias incoming headers cookie=', rawCookie, 'authorization=', rawAuth);
    let token = parseSessionCookie(request);
    // fallback: Authorization Bearer or ?token= for debug
    if (!token && rawAuth && rawAuth.toLowerCase().startsWith('bearer ')) {
      token = rawAuth.slice(7).trim();
    }
    if (!token) {
      const urlObj = new URL(request.url);
      const maybe = urlObj.searchParams.get('token');
      if (maybe) token = maybe;
    }
    if (!token) return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    // Token mock format: mock-token:ALUMNO_ID:timestamp
    const parts = token.split(':');
    const alumnoId = parts[1];
    if (!alumnoId) return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    // Debug logs to help E2E troubleshooting
    console.log('API: /api/alumno/asistencias token=', token, 'alumnoId=', alumnoId);
    const repo = await resolveRepo();
    const all = await repo.getAsistencias(alumnoId) || [];
    const alumnosRepo = await resolveAlumnosRepo();
    const alumno = await (alumnosRepo.getById ? alumnosRepo.getById(alumnoId) : null);

    // pagination
    const urlObj = new URL(request.url);
    const estadoFilter = (urlObj.searchParams.get('estado') || '').trim();
    const fechaFrom = (urlObj.searchParams.get('fechaFrom') || '').trim();
    const fechaTo = (urlObj.searchParams.get('fechaTo') || '').trim();
    const page = Math.max(1, Number(urlObj.searchParams.get('page') || '1'));
    const pageSize = Math.max(1, Math.min(100, Number(urlObj.searchParams.get('pageSize') || '10')));
    // apply server-side filters before pagination
    function parseDateDMY(str) {
      if (!str) return null;
      const parts = String(str).split('/');
      if (parts.length !== 3) return null;
      const d = Number(parts[0]);
      const m = Number(parts[1]) - 1;
      const y = Number(parts[2]);
      const dt = new Date(y, m, d);
      return isNaN(dt.getTime()) ? null : dt;
    }

    let filtered = all.slice();
    if (estadoFilter && estadoFilter !== 'Todas') {
      filtered = filtered.filter(a => String(a.estado || '').toLowerCase() === String(estadoFilter).toLowerCase());
    }
    const fromD = parseDateDMY(fechaFrom);
    const toD = parseDateDMY(fechaTo);
    if (fromD || toD) {
      filtered = filtered.filter(a => {
        const ad = parseDateDMY(a.fecha);
        if (!ad) return false;
        if (fromD && ad < fromD) return false;
        if (toD && ad > toD) return false;
        return true;
      });
    }
    const total = filtered.length;

    // counts
    const presentes = all.filter(a => a.estado === 'Presente').length;
    const faltas = all.filter(a => a.estado === 'Falta').length;
    const pendientes = all.filter(a => a.estado === 'Pendiente').length;

    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    const out = {
      meta: {
        total,
        presentes,
        faltas,
        pendientes,
        page,
        pageSize,
        pages: Math.max(1, Math.ceil(total / pageSize))
      },
      data,
      alumno: alumno ? {
        id: alumno.id || alumno.id_alumno || alumnoId,
        nombre: alumno.nombre || '',
        materias: alumno.materias || [],
        clases_compradas: alumno.clases_compradas || 0
      } : null
    };

    return new Response(JSON.stringify(out), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
