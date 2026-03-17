// MCP API endpoints for model connection management
import { MCPModelConnectionService } from '../../../infrastructure/external/mcp/MCPModelConnectionService.js';

export const prerender = false;

async function resolveUsuarioRepo() {
  const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
  if (useSheets) {
    const mod = await import('../../../infrastructure/sheets/usuarios.js');
    return mod;
  }
  return await import('../../../infrastructure/mock/index.js');
}

function parseSessionCookieFromReq(req) {
  const cookie = req.headers.get('cookie') || '';
  const m = cookie.match(/session=([^;]+)/);
  if (!m) return null;
  try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
}

function extractToken(request) {
  // Try cookie first
  let token = parseSessionCookieFromReq(request);
  
  // Try Authorization header
  if (!token) {
    const rawAuth = request.headers.get('authorization') || request.headers.get('Authorization') || '';
    if (rawAuth && rawAuth.toLowerCase().startsWith('bearer ')) {
      token = rawAuth.slice(7).trim();
    }
  }
  
  // Try query parameter
  if (!token) {
    try {
      const urlObj = new URL(request.url);
      const maybe = urlObj.searchParams.get('token');
      if (maybe) token = maybe;
    } catch (e) {}
  }
  
  return token;
}

export async function GET({ request }) {
  try {
    const url = new URL(request.url);
    const operation = url.searchParams.get('operation') || 'status';
    
    const token = extractToken(request);
    if (!token) {
      return new Response(JSON.stringify({ 
        error: 'Token requerido para acceso MCP' 
      }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const usuarioRepo = await resolveUsuarioRepo();
    const mcpService = new MCPModelConnectionService(usuarioRepo);

    let result;
    switch (operation) {
      case 'list':
        result = await mcpService.listModels(token);
        break;
      case 'status':
        result = await mcpService.getConnectionStatus(token);
        break;
      case 'connect':
        const modelId = url.searchParams.get('modelId');
        if (!modelId) {
          return new Response(JSON.stringify({ 
            error: 'modelId requerido para conectar' 
          }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }
        result = await mcpService.connectToModel(token, modelId);
        break;
      default:
        return new Response(JSON.stringify({ 
          error: 'Operación no soportada',
          available_operations: ['list', 'status', 'connect']
        }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        });
    }

    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      mcp_access_denied: true 
    }), { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

export async function POST({ request }) {
  try {
    const token = extractToken(request);
    if (!token) {
      return new Response(JSON.stringify({ 
        error: 'Token requerido para acceso MCP' 
      }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const body = await request.json();
    const { operation, ...data } = body;

    const usuarioRepo = await resolveUsuarioRepo();
    const mcpService = new MCPModelConnectionService(usuarioRepo);

    let result;
    switch (operation) {
      case 'update_authorized_emails':
        if (!data.emails || !Array.isArray(data.emails)) {
          return new Response(JSON.stringify({ 
            error: 'Campo emails (array) requerido' 
          }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
          });
        }
        result = await mcpService.updateAuthorizedEmails(token, data.emails);
        break;
      default:
        return new Response(JSON.stringify({ 
          error: 'Operación POST no soportada',
          available_operations: ['update_authorized_emails']
        }), { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        });
    }

    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      mcp_access_denied: true 
    }), { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}