import makeLoginUser from '../../../usecases/auth/loginUser.js';
import makeAuthController from '../../../adapters/controllers/authController.js';

export const prerender = false;

const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';

let alumnosRepo;
if (useSheets) {
  const AlumnosRepoSheets = (await import('../../../infrastructure/AlumnosRepoSheets.js')).default;
  alumnosRepo = new AlumnosRepoSheets();
} else {
  const AlumnosRepoMock = (await import('../../../infrastructure/mock/AlumnosRepoMock.js')).default;
  alumnosRepo = new AlumnosRepoMock();
}

const loginUser = makeLoginUser({ alumnosRepo });
const authController = makeAuthController({ loginUser });

async function resolveUsuariosRepo() {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) {
    const mod = await import('../../../infrastructure/sheets/usuarios.js');
    return mod;
  }
  return await import('../../../infrastructure/mock/index.js');
}

export async function POST({ request }) {
  // Call the auth controller first
  const resp = await authController.login({ request });
  try {
    if (resp.status === 200) {
      // If login succeeded, ensure there's at least one admin in Usuarios
      const usuariosRepo = await resolveUsuariosRepo();
      if (usuariosRepo.getUsuarios) {
        const usuarios = await usuariosRepo.getUsuarios();
        const hasAdmin = Array.isArray(usuarios) && usuarios.some(u => String(u.rol || '').toLowerCase() === 'admin');
        if (!hasAdmin && usuariosRepo.createUsuario) {
          const body = await resp.clone().json();
          const alumno = body && body.alumno ? body.alumno : null;
          const adminPayload = {
            id_usuario: `admin_auto_${Date.now()}`,
            id_alumno: alumno ? String(alumno.id || alumno.id_alumno || '') : '',
            email: (alumno && (alumno.email || alumno.correo)) || `admin@local.${Date.now()}`,
            password: '',
            rol: 'admin'
          };
          try {
            const created = await usuariosRepo.createUsuario(adminPayload);
            // log to terminal / server logs as requested
            console.log('Admin auto-created on login:', adminPayload, created);
          } catch (e) {
            console.warn('Failed to create admin auto-user:', e && e.message);
          }
        }
      }
    }
  } catch (e) {
    // swallow errors to avoid breaking login response
    console.warn('Post-login admin creation error:', e && e.message);
  }

  return resp;
}
