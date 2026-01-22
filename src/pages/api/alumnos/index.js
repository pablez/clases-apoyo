import { getAlumnosWrapper as getAlumnos, createAlumnoWrapper as createAlumno } from '../../../services/api.js';

export const prerender = false;

export async function GET() {
  try {
    const data = await getAlumnos();
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
    console.log('📝 Creando alumno:', body);
    console.log('🔧 USE_GOOGLE_SHEETS:', process.env.USE_GOOGLE_SHEETS);
    console.log('📊 GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID ? 'Configurado' : 'No configurado');
    
    const data = await createAlumno(body);
    console.log('✅ Alumno creado exitosamente:', data);
    
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Error al crear alumno:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
