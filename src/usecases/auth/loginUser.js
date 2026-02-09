// Caso de uso: LoginUser
// Recibe dependencias por inyección: { alumnosRepo, passwordVerifier }

export default function makeLoginUser({ alumnosRepo, passwordVerifier }) {
  if (!alumnosRepo) throw new Error('alumnosRepo es requerido');
  if (!passwordVerifier) {
    // Verificador por defecto (mock-friendly)
    passwordVerifier = {
      async verify(alumno, password) {
        // Solo en desarrollo (o cuando AUTH_DEV_ACCEPT_PLAINTEXT='true') permitimos comparar contra
        // la contraseña almacenada en la fuente (Sheets/mock). En producción esto debe estar deshabilitado.
        const devAllow = process.env.AUTH_DEV_ACCEPT_PLAINTEXT === 'true' || process.env.NODE_ENV !== 'production';
        if (devAllow && alumno && (alumno.password || (alumno._usuario && alumno._usuario.password))) {
          const stored = alumno.password || (alumno._usuario && alumno._usuario.password) || '';
          return String(password) === String(stored);
        }
        // Fallback mock behavior: aceptar vacío o 'test'
        return !password || password === 'test';
      }
    };
  }

  return async function loginUser({ email, password }) {
    if (!email) throw new Error('Email requerido');
    const alumno = await alumnosRepo.findByEmail(email);
    if (!alumno) return { success: false, message: 'Usuario no encontrado' };
    const ok = await passwordVerifier.verify(alumno, password);
    if (!ok) return { success: false, message: 'Credenciales inválidas' };
    const token = `mock-token:${alumno.id}:${Date.now()}`;
    return { success: true, alumno, token };
  };
}
