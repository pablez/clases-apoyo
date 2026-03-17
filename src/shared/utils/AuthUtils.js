// Authentication utilities
import { AppConfig } from '../config/AppConfig.js';

export class AuthUtils {
  static parseSessionCookie(request) {
    const cookie = request.headers.get('cookie') || '';
    const pattern = new RegExp(`${AppConfig.auth.cookieName}=([^;]+)`);
    const match = cookie.match(pattern);
    if (!match) return null;
    
    try {
      return decodeURIComponent(match[1]);
    } catch (e) {
      return match[1];
    }
  }

  static extractToken(request) {
    // Try cookie first
    let token = AuthUtils.parseSessionCookie(request);
    
    // Try Authorization header
    if (!token) {
      const rawAuth = request.headers.get('authorization') || request.headers.get('Authorization') || '';
      if (rawAuth && rawAuth.toLowerCase().startsWith('bearer ')) {
        token = rawAuth.slice(7).trim();
      }
    }
    
    // Try query parameter (for debugging only)
    if (!token && AppConfig.app.isDevelopment) {
      try {
        const urlObj = new URL(request.url);
        const maybe = urlObj.searchParams.get('token');
        if (maybe) token = maybe;
      } catch (e) {
        // ignore parsing errors
      }
    }
    
    return token;
  }

  static parseToken(token) {
    if (!token) return null;
    
    // Handle mock tokens: mock-token:ID:timestamp
    const parts = token.split(':');
    if (parts.length >= 2 && parts[0] === 'mock-token') {
      return {
        type: 'mock',
        userId: parts[1],
        timestamp: parseInt(parts[2]) || Date.now(),
        isValid: true
      };
    }
    
    // Handle simple ID tokens
    return {
      type: 'simple',
      userId: token,
      timestamp: Date.now(),
      isValid: true
    };
  }

  static createMockToken(userId) {
    return `mock-token:${userId}:${Date.now()}`;
  }

  static sanitizeUser(user) {
    if (!user) return null;
    
    const sanitized = { ...user };
    
    // Remove sensitive fields
    delete sanitized.password;
    
    if (sanitized._usuario && sanitized._usuario.password) {
      sanitized._usuario = { ...sanitized._usuario };
      delete sanitized._usuario.password;
    }
    
    return sanitized;
  }

  static createAuthCookie(token, remember = false) {
    const { cookieOptions } = AppConfig.auth;
    const maxAge = remember ? '; Max-Age=2592000' : ''; // 30 days if remember
    const secure = cookieOptions.secure ? '; Secure' : '';
    const sameSite = `; SameSite=${cookieOptions.sameSite}`;
    
    return `${AppConfig.auth.cookieName}=${encodeURIComponent(token)}; HttpOnly; Path=${cookieOptions.path}${sameSite}${secure}${maxAge}`;
  }

  static clearAuthCookie() {
    const { cookieOptions } = AppConfig.auth;
    const secure = cookieOptions.secure ? '; Secure' : '';
    const sameSite = `; SameSite=${cookieOptions.sameSite}`;
    
    return `${AppConfig.auth.cookieName}=; HttpOnly; Path=${cookieOptions.path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT${sameSite}${secure}`;
  }

  static hasRole(user, role) {
    if (!user || !user.rol) return false;
    return String(user.rol).toLowerCase() === String(role).toLowerCase();
  }

  static isAdmin(user) {
    return AuthUtils.hasRole(user, 'admin');
  }

  static isPadre(user) {
    return AuthUtils.hasRole(user, 'padre');
  }

  static canAccessMCP(user) {
    return AuthUtils.isAdmin(user) && AppConfig.mcp.authorizedEmails.includes(user.email);
  }
}