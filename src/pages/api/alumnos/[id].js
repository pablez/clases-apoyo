import { updateAlumnoWrapper as updateAlumno, deleteAlumnoWrapper as deleteAlumno } from '../../../services/api.js';

export const prerender = false;

export async function PUT({ params, request }) {
  try {
    const body = await request.json();
    const data = await updateAlumno(params.id, body);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al actualizar alumno:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE({ params }) {
  try {
    await deleteAlumno(params.id);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al eliminar alumno:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
