export const prerender = false;

async function resolveUsuariosRepo() {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) {
    const mod = await import('../../../infrastructure/sheets/usuarios.js');
    return mod;
  }
  return await import('../../../infrastructure/mock/index.js');
}

async function resolveAlumnosRepo() {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) {
    const mod = await import('../../../infrastructure/sheets/index.js');
    return mod;
  }
  return await import('../../../infrastructure/mock/index.js');
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
    // Extract token from cookie or Authorization header
    let token = parseSessionCookie(request);
    
    if (!token) {
      const rawAuth = request.headers.get('authorization') || request.headers.get('Authorization') || '';
      if (rawAuth && rawAuth.toLowerCase().startsWith('bearer ')) {
        token = rawAuth.slice(7).trim();
      }
    }
    
    if (!token) {
      return new Response(JSON.stringify({ 
        error: 'No token provided' 
      }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Parse token to get user ID
    const parts = token.split(':');
    const possibleId = parts[1] || token;

    const usuariosRepo = await resolveUsuariosRepo();
    const alumnosRepo = await resolveAlumnosRepo();
    
    if (!usuariosRepo.getUsuarios || !alumnosRepo.getAlumnos) {
      return new Response(JSON.stringify({ 
        error: 'Repository methods not available' 
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Get user information
    const usuarios = await usuariosRepo.getUsuarios();
    const match = (usuarios || []).find(u => 
      String(u.id_usuario || u.id || '').toLowerCase() === String(possibleId).toLowerCase()
    );
    
    if (!match) {
      return new Response(JSON.stringify({ 
        error: 'User not found' 
      }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Get all alumnos
    const allAlumnos = await alumnosRepo.getAlumnos();
    
    // Determine which alumnos this user can access
    let accessibleAlumnoIds = [];
    
    // Check for multi-alumno structure  
    if (match.alumnos_ids && Array.isArray(match.alumnos_ids)) {
      accessibleAlumnoIds = match.alumnos_ids.map(id => String(id));
    } else if (match.alumnos_ids && typeof match.alumnos_ids === 'string') {
      // Handle comma-separated string format (for Google Sheets)
      accessibleAlumnoIds = match.alumnos_ids.split(',').map(id => String(id.trim()));
    }
    
    // If no alumnos_ids configured, user has no access to any alumno
    if (accessibleAlumnoIds.length === 0) {
      return new Response(JSON.stringify({ 
        alumnos: [], 
        isMultiAlumno: false,
        message: 'Usuario sin alumnos asignados - contactar administrador'  
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Filter alumnos that user can access
    const accessibleAlumnos = (allAlumnos || [])
      .filter(alumno => {
        const alumnoId = String(alumno.id || '');
        return accessibleAlumnoIds.includes(alumnoId);
      })
      .map(alumno => ({
        id: alumno.id,
        nombre: alumno.nombre,
        edad: alumno.edad,
        curso: alumno.curso,
        telefono_padre: alumno.telefono_padre,
        materias: alumno.materias,
        clases_compradas: alumno.clases_compradas
      }));

    return new Response(JSON.stringify({
      user: {
        id: match.id_usuario || match.id,
        nombre: match.nombre,
        email: match.email,
        rol: match.rol
      },
      alumnos: accessibleAlumnos,
      isMultiAlumno: accessibleAlumnos.length > 1
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}