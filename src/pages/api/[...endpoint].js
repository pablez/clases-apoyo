import { 
  getAlumnos, 
  getAsistencias, 
  updateAsistencia, 
  getMateriales, 
  getMaterialById,
  createAlumno,
  updateAlumno,
  deleteAlumno,
  createMaterial,
  updateMaterial,
  deleteMaterial
} from '../../services/api.js';

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

    if (endpoint === 'materiales') {
      const materia = url.searchParams.get('materia');
      const id = url.searchParams.get('id');
      const data = id ? await getMaterialById(id) : await getMateriales(materia);
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

    if (endpoint === 'alumnos') {
      const id = params.id;
      const body = await request.json();
      const data = await updateAlumno(id, body);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (endpoint === 'materiales') {
      const id = params.id;
      const body = await request.json();
      const data = await updateMaterial(id, body);
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

export async function POST({ params, request }) {
  const endpoint = params.endpoint;
  
  try {
    if (endpoint === 'alumnos') {
      const body = await request.json();
      const data = await createAlumno(body);
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (endpoint === 'materiales') {
      const body = await request.json();
      const data = await createMaterial(body);
      return new Response(JSON.stringify(data), {
        status: 201,
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

export async function DELETE({ params }) {
  const endpoint = params.endpoint;
  const id = params.id;
  
  try {
    if (endpoint === 'alumnos' && id) {
      await deleteAlumno(id);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (endpoint === 'materiales' && id) {
      await deleteMaterial(id);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Endpoint o ID no encontrado' }), {
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
