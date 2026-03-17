export const prerender = false;

import { getContainer } from '../../../infrastructure/container.js';

export async function PUT({ params, request }) {
  try {
    const body = await request.json();
    const { repositories } = getContainer();
    const data = await repositories.usuarioRepository.update(params.id, body);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE({ params }) {
  try {
    const { repositories } = getContainer();
    await repositories.usuarioRepository.delete(params.id);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
