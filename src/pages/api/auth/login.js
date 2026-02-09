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

export async function POST({ request }) {
  return authController.login({ request });
}
