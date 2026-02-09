async function resolveRepoFor(endpoint) {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) {
    if (endpoint === 'alumnos') return import('../../infrastructure/sheets/index.js');
    if (endpoint === 'asistencias') return import('../../infrastructure/sheets/asistencias.js');
    if (endpoint === 'materiales') return import('../../infrastructure/sheets/materiales.js');
    return import('../../infrastructure/sheets/index.js');
  }
  return import('../../infrastructure/mock/index.js');
}

export const prerender = false;

export async function GET({ params, url }) {
  const endpoint = params.endpoint;
  
  try {
    const repo = await resolveRepoFor(endpoint);

    if (endpoint === 'alumnos' && repo.getAlumnos) {
      const data = await repo.getAlumnos();
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (endpoint === 'asistencias' && repo.getAsistencias) {
      const alumnoId = url.searchParams.get('alumnoId');
      const data = await repo.getAsistencias(alumnoId);
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (endpoint === 'materiales') {
      const materia = url.searchParams.get('materia');
      const id = url.searchParams.get('id');
      const data = id && repo.getMaterialById ? await repo.getMaterialById(id) : (repo.getMateriales ? await repo.getMateriales(materia) : []);
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
    const repo = await resolveRepoFor(endpoint);

    if (endpoint === 'asistencias' && repo.updateAsistencia) {
      const id = params.id;
      const body = await request.json();
      const data = await repo.updateAsistencia(id, body);
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (endpoint === 'alumnos' && repo.updateAlumno) {
      const id = params.id;
      const body = await request.json();
      const data = await repo.updateAlumno(id, body);
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (endpoint === 'materiales' && repo.updateMaterial) {
      const id = params.id;
      const body = await request.json();
      const data = await repo.updateMaterial(id, body);
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
    const repo = await resolveRepoFor(endpoint);

    if (endpoint === 'alumnos' && repo.createAlumno) {
      const body = await request.json();
      const data = await repo.createAlumno(body);
      return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    if (endpoint === 'materiales' && repo.createMaterial) {
      const body = await request.json();
      const data = await repo.createMaterial(body);
      return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } });
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
    const repo = await resolveRepoFor(endpoint);
    if (endpoint === 'alumnos' && id && repo.deleteAlumno) {
      const start = Date.now();
      try {
        const result = await repo.deleteAlumno(id);
        const duration = Date.now() - start;
        console.log(`[API] DELETE /api/alumnos/${id} completed in ${duration}ms, result=`, result);
      } catch (e) {
        const duration = Date.now() - start;
        console.error(`[API] DELETE /api/alumnos/${id} failed in ${duration}ms`, e);
        throw e;
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (endpoint === 'materiales' && id && repo.deleteMaterial) {
      await repo.deleteMaterial(id);
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
