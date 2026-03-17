export const prerender = false;

async function resolveUsuariosRepo() {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) {
    const mod = await import('../../../infrastructure/sheets/usuarios.js');
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
      try {
        const urlObj = new URL(request.url);
        const maybe = urlObj.searchParams.get('token');
        if (maybe) token = maybe;
      } catch (e) {}
    }

    if (!token) {
      return new Response(JSON.stringify({ 
        authenticated: false, 
        error: 'No token provided' 
      }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Parse token
    const parts = token.split(':');
    const possibleId = parts[1] || token;

    // Try to resolve as usuario
    try {
      const usuariosRepo = await resolveUsuariosRepo();
      
      if (usuariosRepo && usuariosRepo.getUsuarios) {
        const usuarios = await usuariosRepo.getUsuarios();
        const match = (usuarios || []).find(u => 
          String(u.id_usuario || u.id || '').toLowerCase() === String(possibleId).toLowerCase()
        );
        
        if (match) {
          const isAdmin = String((match.rol || '').toLowerCase()) === 'admin';
          
          return new Response(JSON.stringify({
            authenticated: true,
            user: {
              id: match.id_usuario || match.id,
              email: match.email,
              rol: match.rol || 'padre',
              nombre: match.nombre
            },
            isAdmin: isAdmin
          }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }
      }
    } catch (e) {
      console.warn('Error resolving usuario:', e.message);
    }

    // Token present but no valid user found
    return new Response(JSON.stringify({ 
      authenticated: false, 
      error: 'Invalid token or user not found' 
    }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      authenticated: false, 
      error: error.message 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}