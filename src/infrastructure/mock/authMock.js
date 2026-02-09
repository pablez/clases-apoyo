import AlumnosRepoMock from './AlumnosRepoMock.js';

// Mock de autenticación para desarrollo.
// Recomendación: usar solo en entornos locales/testing.

const alumnosRepo = new AlumnosRepoMock();

export async function login(email, password) {
  if (!email) return { success: false, message: 'Email requerido' };
  const candidato = await alumnosRepo.findByEmail(email);
  if (!candidato) return { success: false, message: 'Usuario no encontrado' };
  if (!password || password === 'test') {
    const token = `mock-token:${candidato.id}:${Date.now()}`;
    return { success: true, alumno: candidato, token };
  }
  return { success: false, message: 'Credenciales inválidas' };
}

export async function logout(token) {
  return { success: true };
}

export default { login, logout };
