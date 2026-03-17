import { getContainer } from '../../../infrastructure/container.js';
import { AuthUtils } from '../../../shared/utils/AuthUtils.js';
import { ListUsuariosUseCase } from '../../../application/usecases/ListUsuariosUseCase.js';

export async function GET({ request }) {
  try {
    const token = AuthUtils.extractToken(request);
    const { repositories } = getContainer();
    const usecase = new ListUsuariosUseCase(repositories.usuarioRepository);
    const data = await usecase.execute({ token });

    // compat: keep alumno:null field to avoid breaking frontend
    const compat = (data || []).map(u => ({ ...u, alumno: null }));

    return new Response(JSON.stringify(compat), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

export async function POST({ request }) {
  try {
    const payload = await request.json();
    const { repositories } = getContainer();
    const created = await repositories.usuarioRepository.create(payload);
    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}