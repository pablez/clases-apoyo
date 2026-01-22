import { getAsistenciasWrapper as getAsistencias, createAsistenciaWrapper as createAsistencia } from '../../../services/api.js';

export const prerender = false;

export async function GET({ url }) {
  try {
    const alumnoId = url.searchParams.get('alumnoId');
    const data = await getAsistencias(alumnoId);
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
    console.log('📝 Creando asistencia:', body);
    console.log('🔧 USE_GOOGLE_SHEETS:', process.env.USE_GOOGLE_SHEETS);
    
    const data = await createAsistencia(body);
    console.log('✅ Asistencia creada:', data);
    
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Error al crear asistencia:', error);
    console.error('Stack:', error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
