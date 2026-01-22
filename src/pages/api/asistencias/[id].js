import { updateAsistenciaWrapper as updateAsistencia, deleteAsistenciaWrapper as deleteAsistencia } from '../../../services/api.js';

export const prerender = false;

export async function PUT({ params, request }) {
  try {
    const body = await request.json();
    const data = await updateAsistencia(params.id, body);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al actualizar asistencia:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE({ params }) {
  try {
    const data = await deleteAsistencia(params.id);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error al eliminar asistencia:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
