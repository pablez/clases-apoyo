export const prerender = false;

import { AuthUtils } from '../../../../../shared/utils/AuthUtils.js';

async function resolveUsuariosRepo() {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) {
    const mod = await import('../../../../../infrastructure/sheets/usuarios.js');
    return mod;
  }
  return await import('../../../../../infrastructure/mock/index.js');
}

// API endpoint para administradores - actualizar alumnos asignados a un usuario
export async function POST({ request, params }) {
  try {
    // Use same auth logic as /api/auth/verify (WORKING)
    const token = AuthUtils.extractToken(request);
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token requerido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = params.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'ID de usuario requerido' }), {
        status: 400,
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

    if (!currentUser || String(currentUser.rol || '').toLowerCase() !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acceso denegado - Solo administradores' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener body con los alumnos_ids
    const body = await request.json();
    const { alumnos_ids } = body;

    if (!Array.isArray(alumnos_ids)) {
      return new Response(JSON.stringify({ error: 'alumnos_ids debe ser un array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Buscar el usuario a actualizar
    const targetUser = usuarios.find(u => (u.id || u.id_usuario) === userId);
    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar el usuario con los nuevos alumnos_ids
    const updatedUser = {
      ...targetUser,
      alumnos_ids: alumnos_ids
    };

    try {
      await usuariosRepo.updateUsuario(userId, updatedUser);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Asignaciones actualizadas correctamente',
        user: {
          id: updatedUser.id || updatedUser.id_usuario,
          email: updatedUser.email,
          nombre: updatedUser.nombre,
          alumnos_ids: updatedUser.alumnos_ids
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (updateError) {
      console.error('Error updating user:', updateError);
      return new Response(JSON.stringify({ error: 'Error al actualizar las asignaciones' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error in admin usuarios update API:', error);
    return new Response(JSON.stringify({ error: 'Error del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}