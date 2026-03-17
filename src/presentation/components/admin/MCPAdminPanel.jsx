// MCP Admin Panel Component
import { useState, useEffect } from 'preact/hooks';
import { AuthUtils } from '../../../shared/utils/AuthUtils.js';

export default function MCPAdminPanel({ apiBaseUrl = '/api' }) {
  const [mcpStatus, setMcpStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [models, setModels] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    checkMCPAccess();
  }, []);

  async function makeAuthenticatedRequest(url, options = {}) {
    const init = { ...options, credentials: 'include' };
    
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        init.headers = { 
          ...init.headers, 
          'Authorization': `Bearer ${token}` 
        };
      }
    } catch (e) {
      // ignore storage errors
    }

    const response = await fetch(url, init);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  async function checkMCPAccess() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeAuthenticatedRequest(`${apiBaseUrl}/mcp/models?operation=status`);
      setMcpStatus(response);
      setConnectionStatus(response.connected ? "connected" : "authorized");
    } catch (err) {
      setError(err.message);
      setConnectionStatus("unauthorized");
    } finally {
      setLoading(false);
    }
  }

  async function listModels() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeAuthenticatedRequest(`${apiBaseUrl}/mcp/models?operation=list`);
      setModels(response.models || []);
      
      if (response.models && response.models.length === 0) {
        setError("No hay modelos de Power BI disponibles. Asegurate de que Power BI Desktop este abierto con un archivo .pbix");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function connectToModel(modelId) {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeAuthenticatedRequest(
        `${apiBaseUrl}/mcp/models?operation=connect&modelId=${encodeURIComponent(modelId)}`
      );
      
      if (response.success) {
        setConnectionStatus("connected");
        await checkMCPAccess(); // Refresh status
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor() {
    switch (connectionStatus) {
      case "connected": return "text-green-600";
      case "authorized": return "text-blue-600";
      case "unauthorized": return "text-red-600";
      default: return "text-gray-600";
    }
  }

  function getStatusText() {
    switch (connectionStatus) {
      case "connected": return "Conectado al modelo";
      case "authorized": return "Autorizado para MCP";
      case "unauthorized": return "Sin autorizacion MCP";
      default: return "Estado desconocido";
    }
  }

  if (loading && !mcpStatus) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          MCP - Model Connection Protocol
        </h3>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {mcpStatus && connectionStatus === 'authorized' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded p-3">
              <h4 className="font-medium text-gray-700 mb-2">Usuario Autorizado</h4>
              <p className="text-sm text-gray-600">{mcpStatus.user?.email}</p>
              <p className="text-xs text-gray-500">Rol: {mcpStatus.user?.rol}</p>
            </div>
            
            <div className="bg-gray-50 rounded p-3">
              <h4 className="font-medium text-gray-700 mb-2">Capacidades</h4>
              <div className="flex flex-wrap gap-1">
                {(mcpStatus.available_operations || []).map(op => (
                  <span key={op} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {op.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={listModels}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Cargando..." : "Listar Modelos"}
            </button>
            
            <button
              onClick={checkMCPAccess}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Actualizar Estado
            </button>
          </div>

          {models.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Modelos Disponibles</h4>
              <div className="space-y-2">
                {models.map(model => (
                  <div key={model.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{model.name || model.id}</p>
                      <p className="text-sm text-gray-600">{model.description || "Sin descripcion"}</p>
                    </div>
                    <button
                      onClick={() => connectToModel(model.id)}
                      disabled={loading}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      Conectar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {connectionStatus === 'unauthorized' && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-2">No tienes acceso a MCP</p>
          <p className="text-sm text-gray-500">
            Solo usuarios admin con email autorizado pueden acceder a Power BI Model Connection Protocol
          </p>
        </div>
      )}
    </div>
  );
}