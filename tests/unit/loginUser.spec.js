import { describe, it, expect } from 'vitest';
import makeLoginUser from '../../src/usecases/auth/loginUser.js';
import AlumnosRepoMock from '../../src/infrastructure/mock/AlumnosRepoMock.js';

describe('loginUser usecase', () => {
  it('should login with correct mock credentials', async () => {
    const repo = new AlumnosRepoMock();
    const loginUser = makeLoginUser({ alumnosRepo: repo });
    const res = await loginUser({ email: '1', password: 'test' });
    expect(res.success).toBe(true);
    expect(res.alumno).toBeDefined();
    expect(res.token).toMatch(/mock-token:1:/);
  });

  it('should fail with wrong user', async () => {
    const repo = new AlumnosRepoMock();
    const loginUser = makeLoginUser({ alumnosRepo: repo });
    const res = await loginUser({ email: 'nonexistent', password: 'test' });
    expect(res.success).toBe(false);
  });
});
