// Test endpoint para validar el JSON de credenciales
export const prerender = false;

export async function GET() {
  const jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '';
  
  const result = {
    timestamp: new Date().toISOString(),
    hasVariable: !!jsonString,
    length: jsonString.length,
    firstChars: jsonString.substring(0, 100),
    lastChars: jsonString.substring(Math.max(0, jsonString.length - 100)),
    validation: null,
    parsed: null
  };

  if (!jsonString) {
    result.validation = {
      success: false,
      error: 'GOOGLE_SERVICE_ACCOUNT_JSON no está definido'
    };
  } else {
    try {
      // Intentar parsear el JSON
      const parsed = JSON.parse(jsonString);
      result.validation = {
        success: true,
        message: 'JSON válido ✅'
      };
      result.parsed = {
        type: parsed.type,
        project_id: parsed.project_id,
        client_email: parsed.client_email,
        hasPrivateKey: !!parsed.private_key,
        privateKeyLength: parsed.private_key?.length || 0
      };
    } catch (error) {
      result.validation = {
        success: false,
        error: error.message,
        position: error.message.match(/position (\d+)/)?.[1],
        suggestions: []
      };

      // Buscar problemas comunes
      if (jsonString.includes('\n')) {
        result.validation.suggestions.push('⚠️ El JSON contiene saltos de línea. Debe estar en UNA SOLA LÍNEA.');
      }
      if (jsonString.includes("'")) {
        result.validation.suggestions.push('⚠️ El JSON contiene comillas simples. JSON solo acepta comillas dobles ".');
      }
      if (!jsonString.startsWith('{')) {
        result.validation.suggestions.push('⚠️ El JSON no empieza con {. Verifica que no haya espacios o caracteres al inicio.');
      }
      if (!jsonString.endsWith('}')) {
        result.validation.suggestions.push('⚠️ El JSON no termina con }. Verifica que no haya espacios o caracteres al final.');
      }
      
      // Mostrar el carácter problemático
      const pos = parseInt(error.message.match(/position (\d+)/)?.[1] || '0');
      if (pos > 0 && pos < jsonString.length) {
        const start = Math.max(0, pos - 50);
        const end = Math.min(jsonString.length, pos + 50);
        result.validation.problemArea = {
          before: jsonString.substring(start, pos),
          problematicChar: jsonString[pos],
          charCode: jsonString.charCodeAt(pos),
          after: jsonString.substring(pos + 1, end)
        };
      }
    }
  }

  return new Response(JSON.stringify(result, null, 2), {
    status: result.validation?.success ? 200 : 500,
    headers: { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}
