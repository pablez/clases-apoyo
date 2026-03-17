export const prerender = false;

import { getContainer } from '../../../infrastructure/container.js';

export async function PUT({ params, request }) {
  try {
    const body = await request.json();
    const { repositories } = getContainer();
    const data = await repositories.asistenciasRepository.update(params.id, body);
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE({ params }) {
  try {
    const { repositories } = getContainer();
    const data = await repositories.asistenciasRepository.delete(params.id);
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
