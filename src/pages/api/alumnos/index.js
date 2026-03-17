export const prerender = false;

import { getContainer } from '../../../infrastructure/container.js';
import { AuthUtils } from '../../../shared/utils/AuthUtils.js';
import { ListAlumnosUseCase } from '../../../application/usecases/ListAlumnosUseCase.js';

export async function GET({ request }) {
  try {
    const token = AuthUtils.extractToken(request);
    const { repositories } = getContainer();
    const usecase = new ListAlumnosUseCase({
      alumnosRepository: repositories.alumnosRepository,
      usuarioRepository: repositories.usuarioRepository,
    });
    const data = await usecase.execute({ token });
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { repositories } = getContainer();
    const created = await repositories.alumnosRepository.create(body);
    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
