// Health check endpoint para verificar que la API está funcionando
export const prerender = false;

export async function GET() {
  const USE_GOOGLE_SHEETS = process.env.USE_GOOGLE_SHEETS === 'true';
  const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
  const hasJSON = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const hasKeyPath = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  const hasCredentials = hasJSON || hasKeyPath;
  
  // Verificar problemas
  const issues = [];
  const fixes = [];
  
  if (!USE_GOOGLE_SHEETS) {
    issues.push('USE_GOOGLE_SHEETS no está configurado o no es "true"');
    fixes.push({
      variable: 'USE_GOOGLE_SHEETS',
      value: 'true',
      description: 'Habilita el uso de Google Sheets'
    });
  }
  
  if (!GOOGLE_SHEET_ID) {
    issues.push('GOOGLE_SHEET_ID no está configurado');
    fixes.push({
      variable: 'GOOGLE_SHEET_ID',
      value: '13MCWCQV1VL9PBzByW-mJo0mbenYSeX_OTf9MJVwDO10',
      description: 'ID de tu hoja de cálculo de Google'
    });
  }
  
  if (!hasCredentials) {
    issues.push('No hay credenciales de Google configuradas (ni GOOGLE_SERVICE_ACCOUNT_JSON ni GOOGLE_SERVICE_ACCOUNT_KEY_PATH)');
    fixes.push({
      variable: 'GOOGLE_SERVICE_ACCOUNT_JSON',
      value: '{"type":"service_account","project_id":"educacion-485101",...}',
      description: 'JSON completo del archivo de credenciales (educacion-llave.json) en UNA SOLA LÍNEA. Ejecuta este comando en tu terminal local para obtenerlo:\nnode -e "const fs = require(\'fs\'); console.log(JSON.stringify(JSON.parse(fs.readFileSync(\'./educacion-llave.json\', \'utf8\'))));"'
    });
  }
  
  const isConfigured = USE_GOOGLE_SHEETS && GOOGLE_SHEET_ID && hasCredentials;
  
  const health = {
    status: isConfigured ? 'ok' : 'misconfigured',
    message: isConfigured 
      ? '✅ Todo configurado correctamente' 
      : '❌ Faltan configuraciones. Sigue las instrucciones abajo.',
    timestamp: new Date().toISOString(),
    environment: {
      USE_GOOGLE_SHEETS,
      GOOGLE_SHEET_ID: GOOGLE_SHEET_ID ? `${GOOGLE_SHEET_ID.substring(0, 10)}...` : 'NOT SET',
      hasCredentials,
      credentialType: hasJSON ? 'JSON' : hasKeyPath ? 'FILE' : 'NONE'
    },
    issues: issues.length > 0 ? issues : undefined,
    howToFix: issues.length > 0 ? {
      step1: 'Ve a tu panel de Netlify: https://app.netlify.com',
      step2: 'Selecciona tu sitio "clases-de-apoyo"',
      step3: 'Ve a Site settings → Environment variables',
      step4: 'Agrega las siguientes variables:',
      variables: fixes,
      step5: 'Guarda los cambios',
      step6: 'Ve a Deploys → Trigger deploy → Clear cache and deploy site',
      step7: 'Espera que termine el deploy y vuelve a visitar /api/health'
    } : undefined
  };

  console.log('🏥 Health check:', health);

  return new Response(JSON.stringify(health, null, 2), {
    status: isConfigured ? 200 : 503,
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}
