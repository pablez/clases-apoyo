import makeLoginUser from '../src/usecases/auth/loginUser.js';
import AlumnosRepoMock from '../src/infrastructure/mock/AlumnosRepoMock.js';

(async function(){
  const repo = new AlumnosRepoMock();
  const loginUser = makeLoginUser({ alumnosRepo: repo });
  const res = await loginUser({ email: '1', password: 'test' });
  console.log('login result:', res);
})();
