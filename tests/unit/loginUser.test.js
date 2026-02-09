import { describe, it, expect } from 'vitest';
import makeLoginUser from '../../src/usecases/auth/loginUser.js';

describe('loginUser usecase', () => {
  it('throws when email is missing', async () => {
    const repo = { findByEmail: async () => null };
    const loginUser = makeLoginUser({ alumnosRepo: repo });
    await expect(loginUser({})).rejects.toThrow('Email requerido');
  });

  it('returns not found when user missing', async () => {
    const repo = { findByEmail: async () => null };
    const loginUser = makeLoginUser({ alumnosRepo: repo });
    const res = await loginUser({ email: 'no@existe', password: 'x' });
    expect(res).toHaveProperty('success', false);
    expect(res).toHaveProperty('message', 'Usuario no encontrado');
  });

  it('returns invalid credentials for wrong password', async () => {
    const repo = { findByEmail: async (email) => ({ id: '1', email, password: 'secret' }) };
    const loginUser = makeLoginUser({ alumnosRepo: repo });
    const res = await loginUser({ email: 'u@u', password: 'wrong' });
    expect(res).toHaveProperty('success', false);
    expect(res).toHaveProperty('message', 'Credenciales inválidas');
  });

  it('returns success and token on correct credentials', async () => {
    const repo = { findByEmail: async (email) => ({ id: '42', email, password: 'secret', nombre: 'Test' }) };
    const loginUser = makeLoginUser({ alumnosRepo: repo });
    const res = await loginUser({ email: 't@t', password: 'secret' });
    expect(res).toHaveProperty('success', true);
    expect(res).toHaveProperty('alumno');
    expect(res.alumno).toHaveProperty('id', '42');
    expect(res).toHaveProperty('token');
    expect(String(res.token)).toContain('42');
  });
});
