export const prerender = false;

import { getContainer } from '../../../infrastructure/container.js';

export async function GET({ url }) {
  try {
    const materia = url.searchParams.get('materia');
    const id = url.searchParams.get('id');
    const { useSheets, repositories } = getContainer();
    const data = id ? await repositories.materialesRepository.getById(id) : await repositories.materialesRepository.list(materia);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'X-Data-Source': useSheets ? 'sheets' : 'mock'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { repositories } = getContainer();
    const data = await repositories.materialesRepository.create(body);
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
