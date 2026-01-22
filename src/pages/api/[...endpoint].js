import { getAlumnos, getAsistencias, updateAsistencia } from '../../services/api.js';

export const prerender = false;

export async function GET({ params, url }) {
  const endpoint = params.endpoint;
  
  try {
    if (endpoint === 'alumnos') {
      const data = await getAlumnos();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (endpoint === 'asistencias') {
      const alumnoId = url.searchParams.get('alumnoId');
      const data = await getAsistencias(alumnoId);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Endpoint no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT({ params, request }) {
  const endpoint = params.endpoint;
  
  try {
    if (endpoint === 'asistencias') {
      const id = params.id;
      const body = await request.json();
      const data = await updateAsistencia(id, body);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Endpoint no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
