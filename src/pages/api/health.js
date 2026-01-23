// Health check endpoint para verificar que la API está funcionando
export const prerender = false;

export async function GET() {
  const USE_GOOGLE_SHEETS = process.env.USE_GOOGLE_SHEETS === 'true';
  const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
  const hasCredentials = !!(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      USE_GOOGLE_SHEETS,
      GOOGLE_SHEET_ID: GOOGLE_SHEET_ID ? `${GOOGLE_SHEET_ID.substring(0, 10)}...` : 'NOT SET',
      hasCredentials,
      credentialType: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? 'JSON' : process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH ? 'FILE' : 'NONE'
    }
  };

  console.log('🏥 Health check:', health);

  return new Response(JSON.stringify(health, null, 2), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}
