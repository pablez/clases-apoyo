// Use Case: MCP Access Management
import { AuthUtils } from '../../shared/utils/AuthUtils.js';
import { AppConfig } from '../../shared/config/AppConfig.js';

export class MCPAccessUseCase {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
  }

  async validateMCPAccess(token) {
    // Parse and validate token
    const tokenInfo = AuthUtils.parseToken(token);
    if (!tokenInfo || !tokenInfo.isValid) {
      throw new Error('Token inválido');
    }

    // Get user by ID
    const usuarios = await this.usuarioRepository.getAll();
    const usuario = usuarios.find(u => 
      String(u.id_usuario || u.id || '').toLowerCase() === String(tokenInfo.userId).toLowerCase()
    );

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Check admin role
    if (!AuthUtils.isAdmin(usuario)) {
      throw new Error('Acceso denegado: Se requieren permisos de administrador');
    }

    // Check if email is authorized for MCP
    if (!AppConfig.mcp.authorizedEmails.includes(usuario.email)) {
      throw new Error(`Acceso MCP denegado: El email ${usuario.email} no está autorizado`);
    }

    // Check if MCP is enabled
    if (!AppConfig.features.enableMCP) {
      throw new Error('Acceso MCP deshabilitado en la configuración del sistema');
    }

    return AuthUtils.sanitizeUser(usuario);
  }

  async getMCPCapabilities(token) {
    const usuario = await this.validateMCPAccess(token);
    
    return {
      user: usuario,
      authorized: true,
      capabilities: [
        'list_powerbi_models',
        'connect_to_model',
        'disconnect_model',
        'query_model',
        'export_data'
      ],
      available_features: AppConfig.mcp.enabledFeatures,
      configuration: {
        max_concurrent_connections: 5,
        query_timeout_ms: 30000,
        export_max_rows: 10000
      }
    };
  }

  async auditMCPAccess(token, operation, details = {}) {
    if (!AppConfig.features.enableAuditLog) {
      return null;
    }

    try {
      const usuario = await this.validateMCPAccess(token);
      
      const auditEntry = {
        timestamp: new Date().toISOString(),
        user_id: usuario.id_usuario || usuario.id,
        user_email: usuario.email,
        operation: operation,
        details: details,
        success: true,
        ip_address: details.ip_address || 'unknown',
        user_agent: details.user_agent || 'unknown'
      };

      // In a real implementation, you'd save this to an audit log
      console.log('MCP Audit Log:', auditEntry);
      
      return auditEntry;
    } catch (error) {
      const auditEntry = {
        timestamp: new Date().toISOString(),
        operation: operation,
        details: details,
        success: false,
        error: error.message,
        ip_address: details.ip_address || 'unknown',
        user_agent: details.user_agent || 'unknown'
      };

      console.log('MCP Audit Log (Failed):', auditEntry);
      
      throw error;
    }
  }

  async listAuthorizedUsers() {
    const usuarios = await this.usuarioRepository.getAll();
    
    const authorizedUsers = usuarios
      .filter(u => AuthUtils.isAdmin(u))
      .filter(u => AppConfig.mcp.authorizedEmails.includes(u.email))
      .map(u => AuthUtils.sanitizeUser(u));

    return {
      authorized_users: authorizedUsers,
      total_count: authorizedUsers.length,
      authorized_emails: AppConfig.mcp.authorizedEmails
    };
  }
}