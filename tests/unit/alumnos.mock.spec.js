import { describe, it, expect } from 'vitest';
import { getAlumnos, createAlumno } from '../../src/infrastructure/mock/index.js';

describe('Mock adapter - Alumnos', () => {
  it('getAlumnos returns an array', async () => {
    const list = await getAlumnos();
    expect(Array.isArray(list)).toBe(true);
  });

  it('createAlumno returns created object with id', async () => {
    const payload = { nombre: 'Test User', edad: '99', curso: 'Test' };
    const created = await createAlumno(payload);
    expect(created).toBeTruthy();
    expect(created.id).toBeTruthy();
    expect(created.nombre).toBe('Test User');
  });
});
