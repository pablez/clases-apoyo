export const prerender = false;

import { AuthUtils } from '../../../shared/utils/AuthUtils.js';

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

// API endpoint para administradores - obtener todos los alumnos
export async function GET({ request }) {
  try {
    // Use same auth logic as /api/auth/verify (WORKING)
    const token = AuthUtils.extractToken(request);
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token requerido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse token same way as /api/auth/verify
    const parts = token.split(':');
    const possibleId = parts[1] || token;

    // Verificar que es admin using same logic as /api/auth/verify
    const usuariosRepo = await resolveUsuariosRepo();
    const usuarios = await usuariosRepo.getUsuarios();
    const currentUser = (usuarios || []).find(u => 
      String(u.id_usuario || u.id || '').toLowerCase() === String(possibleId).toLowerCase()
    );

    if (!currentUser || String(currentUser.rol || '').toLowerCase() !== 'admin') {
      return new Response(JSON.stringify({ 
        error: 'Acceso denegado - Solo administradores',
        debug: { possibleId, foundUser: !!currentUser, userRole: currentUser?.rol }
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener todos los alumnos
    const alumnosRepo = await resolveAlumnosRepo();
    const alumnos = await alumnosRepo.getAlumnos();

    return new Response(JSON.stringify({ alumnos: alumnos || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in admin alumnos API:', error);
    return new Response(JSON.stringify({ error: 'Error del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}