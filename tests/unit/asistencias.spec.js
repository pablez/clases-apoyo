import { describe, it, expect } from 'vitest';
import AsistenciasRepoMock from '../../src/infrastructure/mock/AsistenciasRepoMock.js';

describe('AsistenciasRepoMock', () => {
  it('list should return asistencias for alumnoId', async () => {
    const repo = new AsistenciasRepoMock();
    const list = await repo.list('1');
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);
    // check a known id exists
    const ids = list.map(x => x.id);
    expect(ids).toContain('101');
  });
});
