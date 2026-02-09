export const prerender = false;

async function resolveRepo() {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) return import('../../../infrastructure/sheets/materiales.js');
  return import('../../../infrastructure/mock/index.js');
}

export async function GET({ url }) {
  console.log('📡 GET /api/materiales - Request recibido');
  console.log('🌍 Entorno:', {
    USE_GOOGLE_SHEETS: process.env.USE_GOOGLE_SHEETS,
    hasGoogleSheetId: !!process.env.GOOGLE_SHEET_ID,
    hasCredentials: !!(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH)
  });
  
  try {
    const materia = url.searchParams.get('materia');
    const id = url.searchParams.get('id');
    
    console.log('🔍 Parámetros:', { materia, id });
    console.log('⏳ Llamando a getMateriales...');
    
    const repo = await resolveRepo();
    const data = id ? await repo.getMaterialById(id) : await repo.getMateriales(materia);
    
    console.log('✅ Materiales obtenidos:', Array.isArray(data) ? data.length : 1);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('❌ Error en GET /api/materiales:', error);
    console.error('Stack:', error.stack);
    
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
    const repo = await resolveRepo();
    const data = await repo.createMaterial(body);
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
