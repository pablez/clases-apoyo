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
    console.log('🔍 API: /api/alumno/asistencias START - cookie:', rawCookie?.slice(0, 50), 'auth:', rawAuth?.slice(0, 30));
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
    if (!token) {
      console.warn('❌ No token found in request');
      return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    // Check if specific alumno is requested (multi-alumno users)
    const urlObj = new URL(request.url);
    const requestedAlumnoId = urlObj.searchParams.get('alumno_id');
    
    // Token formats supported:
    // - mock-token:ALUMNO_ID:timestamp  (alumno token)
    // - USER ID string (id_usuario) or same mock token where middle part is usuario id
    const parts = token.split(':');
    const possibleId = parts[1] || token;

    // Debug
    console.log('API: /api/alumno/asistencias resolving token=', token, 'possibleId=', possibleId);

    const repo = await resolveRepo();
    const alumnosRepo = await resolveAlumnosRepo();

    // Attempt to resolve as alumno id first
    let alumno = await (alumnosRepo.getById ? alumnosRepo.getById(possibleId) : null);
    let alumnoIds = [];
    let isUsuarioToken = false;

    if (alumno) {
      alumnoIds = [String(alumno.id || possibleId)];
    } else {
      // Try resolving token as usuario id and collect all linked alumnos
      try {
        const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
        let usuariosModule;
        if (useSheets) usuariosModule = await import('../../../../infrastructure/sheets/usuarios.js');
        else usuariosModule = await import('../../../../infrastructure/mock/index.js');

        if (usuariosModule && usuariosModule.getUsuarios) {
          const usuarios = await usuariosModule.getUsuarios();
          // match by id_usuario or id
          const match = (usuarios || []).find(u => String(u.id_usuario || u.id || '').toLowerCase() === String(possibleId).toLowerCase());
          if (match) {
            isUsuarioToken = true;
            
            // Check if user is admin - admins get access to all asistencias
            if (String((match.rol || '').toLowerCase()) === 'admin') {
              // For admin users, set special marker to get all asistencias
              alumnoIds = [null]; // null will return all asistencias from sheets adapter
            } else {
              // For non-admin users, collect linked alumnos using new multi-alumno structure
              const linked = new Set();
              
              // Check for multi-alumno structure
              if (match.alumnos_ids && Array.isArray(match.alumnos_ids)) {
                match.alumnos_ids.forEach(id => linked.add(String(id)));
              } else if (match.alumnos_ids && typeof match.alumnos_ids === 'string') {
                // Handle comma-separated format (Google Sheets)
                match.alumnos_ids.split(',').forEach(id => linked.add(String(id.trim())));
              }

              let allAccessibleIds = Array.from(linked).filter(Boolean);
              
              // If specific alumno requested AND user has access to it, use only that one
              if (requestedAlumnoId && allAccessibleIds.includes(String(requestedAlumnoId))) {
                alumnoIds = [String(requestedAlumnoId)];
              } else {
                // Otherwise use all accessible alumnos
                alumnoIds = allAccessibleIds;
              }
            }
          }
        }
      } catch (e) {
        console.warn('Error resolving usuario from token:', e.message);
      }

      // As a last resort, if possibleId exists, try fetching asistencias for that id
      if (!isUsuarioToken && alumnoIds.length === 0 && possibleId) {
        alumnoIds = [String(possibleId)];
      }
    }

    if (!alumnoIds || alumnoIds.length === 0) return new Response(JSON.stringify({ error: 'Token inválido o sin alumnos asociados' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    // Fetch asistencias for each alumno and merge
    let all = [];
    for (const aid of alumnoIds) {
      const rows = await repo.getAsistencias(aid) || [];
      // annotate each asistencia with alumnoId for context
      rows.forEach(r => { 
        r.alumnoId = r.alumnoId || (aid !== null ? aid : r.alumnoId); 
      });
      all = all.concat(rows || []);
    }

    // pagination
    const paginationUrl = new URL(request.url);
    const estadoFilter = (paginationUrl.searchParams.get('estado') || '').trim();
    const fechaFrom = (paginationUrl.searchParams.get('fechaFrom') || '').trim();
    const fechaTo = (paginationUrl.searchParams.get('fechaTo') || '').trim();
    const page = Math.max(1, Number(paginationUrl.searchParams.get('page') || '1'));
    const pageSize = Math.max(1, Math.min(100, Number(paginationUrl.searchParams.get('pageSize') || '10')));
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
        id: alumno.id || alumnoId,
        nombre: alumno.nombre || '',
        materias: alumno.materias || [],
        clases_compradas: alumno.clases_compradas || 0,
        // Preserve the original _usuario object when present so callers
        // (e.g. admin.astro) can inspect role and other usuario metadata.
        _usuario: alumno._usuario || null
      } : null
    };

    return new Response(JSON.stringify(out), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
