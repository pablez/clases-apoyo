// MCP Model Connection Service
// Provides access to Power BI model management for authorized admins

import { Usuario } from '../../../core/entities/Usuario.js';

export class MCPModelConnectionService {
  constructor(usuarioRepository) {
    this.usuarioRepository = usuarioRepository;
    this.authorizedEmails = [
      'admin@clasesapoyo.com'
    ];
  }

  async validateAccess(token) {
    try {
      // Parse token to get user ID
      const parts = token.split(':');
      const possibleId = parts[1] || token;

      // Get usuario by ID
      const usuarios = await this.usuarioRepository.getAll();
      const usuario = usuarios.find(u => 
        String(u.id_usuario || u.id || '').toLowerCase() === String(possibleId).toLowerCase()
      );

      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      const usuarioEntity = Usuario.fromJSON(usuario);

      // Check if user has MCP access
      if (!usuarioEntity.canAccessMCP()) {
        throw new Error('Usuario no tiene permisos de administrador');
      }

      // Check if email is in authorized list
      if (!this.authorizedEmails.includes(usuarioEntity.email)) {
        throw new Error('Email no autorizado para acceso MCP');
      }

      return usuarioEntity;
    } catch (error) {
      throw new Error(`Acceso MCP denegado: ${error.message}`);
    }
  }

  async listModels(token) {
    await this.validateAccess(token);
    
    // Here you would integrate with the actual MCP tool
    // For now, return a mock response
    return {
      models: [],
      message: 'Acceso MCP autorizado. No hay modelos de Power BI disponibles actualmente.',
      authorized_user: true
    };
  }

  async connectToModel(token, modelId) {
    const usuario = await this.validateAccess(token);
    
    // Integration with MCP model connection tool would go here
    return {
      success: true,
      message: `Usuario ${usuario.email} conectado al modelo ${modelId}`,
      model_id: modelId,
      user: usuario.toSafeJSON()
    };
  }

  async getConnectionStatus(token) {
    const usuario = await this.validateAccess(token);
    
    return {
      connected: false,
      user: usuario.toSafeJSON(),
      authorized_for_mcp: true,
      available_operations: [
        'list_models',
        'connect_to_model', 
        'disconnect_model',
        'get_model_info'
      ]
    };
  }

  // Add or remove authorized emails (admin only)
  async updateAuthorizedEmails(token, emails) {
    const usuario = await this.validateAccess(token);
    
    if (!Array.isArray(emails)) {
      throw new Error('Emails debe ser un array');
    }

    this.authorizedEmails = [...new Set([...this.authorizedEmails, ...emails])];
    
    return {
      success: true,
      authorized_emails: this.authorizedEmails,
      updated_by: usuario.email
    };
  }
}