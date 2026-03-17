// Application configuration
export const AppConfig = {
  // Database configuration
  database: {
    useGoogleSheets: process.env.USE_GOOGLE_SHEETS === 'true',
    googleSheetId: process.env.GOOGLE_SHEET_ID || '13MCWCQV1VL9PBzByW-mJo0mbenYSeX_OTf9MJVwDO10',
    credentialsPath: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || './educacion-llave.json'
  },

  // Authentication configuration  
  auth: {
    devAcceptPlaintext: process.env.AUTH_DEV_ACCEPT_PLAINTEXT === 'true',
    tokenTTL: 24 * 60 * 60 * 1000, // 24 hours
    cookieName: 'session',
    cookieOptions: {
      httpOnly: true,
      path: '/',
      sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
      secure: process.env.NODE_ENV === 'production'
    }
  },

  // MCP configuration
  mcp: {
    authorizedEmails: [
      'admin@clasesapoyo.com'
    ],
    enabledFeatures: [
      'model_connection',
      'data_analysis',
      'report_generation'
    ]
  },

  // Application behavior
  app: {
    environment: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
    baseUrl: process.env.BASE_URL || 'http://localhost:4321',
    apiPrefix: '/api'
  },

  // Feature flags
  features: {
    allowPublicListing: process.env.DEV_ALLOW_PUBLIC_LISTING === 'true',
    enableMCP: process.env.ENABLE_MCP !== 'false', // enabled by default
    enableAuditLog: process.env.ENABLE_AUDIT_LOG === 'true',
    strictAuth: process.env.STRICT_AUTH === 'true'
  },

  // Pagination defaults
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100
  }
};

// Environment validation
export function validateConfig() {
  const errors = [];

  if (AppConfig.database.useGoogleSheets) {
    if (!AppConfig.database.googleSheetId) {
      errors.push('GOOGLE_SHEET_ID is required when USE_GOOGLE_SHEETS=true');
    }
    
    if (!AppConfig.database.credentialsPath) {
      errors.push('GOOGLE_SERVICE_ACCOUNT_KEY_PATH is required when USE_GOOGLE_SHEETS=true');
    }
  }

  if (AppConfig.app.isProduction && AppConfig.auth.devAcceptPlaintext) {
    errors.push('AUTH_DEV_ACCEPT_PLAINTEXT should not be enabled in production');
  }

  return errors;
}

export default AppConfig;