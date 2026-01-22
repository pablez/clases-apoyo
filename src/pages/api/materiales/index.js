import { getMaterialesWrapper as getMateriales, getMaterialById, createMaterialWrapper as createMaterial } from '../../../services/api.js';

export const prerender = false;

export async function GET({ url }) {
  try {
    const materia = url.searchParams.get('materia');
    const id = url.searchParams.get('id');
    const data = id ? await getMaterialById(id) : await getMateriales(materia);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
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
    const data = await createMaterial(body);
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al crear material:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
