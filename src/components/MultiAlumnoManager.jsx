import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export default function MultiAlumnoManager({ apiBaseUrl = '/api' }) {
  const [usuarios, setUsuarios] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAlumnos, setSelectedAlumnos] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const token = (() => {
        try { return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || localStorage.getItem('sessionToken'); } catch (e) { return null; }
      })();

      // Use same auth strategy as admin.astro: try cookies first, then headers
      const baseOptions = { credentials: 'include' };
      const optionsWithHeaders = token ? { 
        ...baseOptions, 
        headers: { 
          Authorization: `Bearer ${token}`, 
          'session-token': token 
        } 
      } : baseOptions;

      const [usuariosRes, alumnosRes] = await Promise.all([
        fetch(`${apiBaseUrl}/admin/usuarios`, optionsWithHeaders),
        fetch(`${apiBaseUrl}/admin/alumnos`, optionsWithHeaders)
      ]);

      if (usuariosRes.ok && alumnosRes.ok) {
        const usuariosData = await usuariosRes.json();
        const alumnosData = await alumnosRes.json();
        
        setUsuarios(usuariosData.usuarios || usuariosData || []);
        setAlumnos(alumnosData.alumnos || alumnosData || []);
      } else {
        throw new Error('Error al cargar datos');
      }
    } catch (err) {
      setError('Error al cargar usuarios y alumnos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function selectUser(usuario) {
    setSelectedUser(usuario);
    
    // Parse existing alumnos_ids
    let currentAlumnos = [];
    if (usuario.alumnos_ids && Array.isArray(usuario.alumnos_ids)) {
      currentAlumnos = usuario.alumnos_ids.map(id => String(id));
    } else if (usuario.alumnos_ids && typeof usuario.alumnos_ids === 'string') {
      currentAlumnos = usuario.alumnos_ids.split(',').map(id => String(id.trim())).filter(Boolean);
    } else if (usuario.id_alumno) {
      currentAlumnos = [String(usuario.id_alumno)];
    }
    
    setSelectedAlumnos(currentAlumnos);
  }

  function toggleAlumno(alumnoId) {
    const alumnoIdStr = String(alumnoId);
    setSelectedAlumnos(prev => {
      if (prev.includes(alumnoIdStr)) {
        return prev.filter(id => id !== alumnoIdStr);
      } else {
        return [...prev, alumnoIdStr];
      }
    });
  }

  async function saveAssignments() {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const token = (() => {
        try { return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || localStorage.getItem('sessionToken'); } catch (e) { return null; }
      })();

      // Use same auth strategy as admin.astro: cookies + headers
      const options = {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alumnos_ids: selectedAlumnos
        })
      };

      // Add auth headers if we have a token
      if (token) {
        options.headers.Authorization = `Bearer ${token}`;
        options.headers['session-token'] = token;
      }

      const response = await fetch(`${apiBaseUrl}/admin/usuarios/${selectedUser.id}/alumnos`, options);

      if (response.ok) {
        // Update local state
        setUsuarios(prev => prev.map(u => 
          u.id === selectedUser.id 
            ? { ...u, alumnos_ids: selectedAlumnos }
            : u
        ));
        
        alert('Asignaciones guardadas exitosamente');
        setSelectedUser(null);
        setSelectedAlumnos([]);
      } else {
        throw new Error('Error al guardar');
      }
    } catch (err) {
      alert('Error al guardar asignaciones: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="animate-pulse">
          <div class="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div class="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} class="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800">{error}</p>
          <button 
            onClick={loadData}
            class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-6">Gestor Multi-Alumno</h2>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Usuarios */}
        <div>
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Usuarios</h3>
          <div class="space-y-2 max-h-96 overflow-y-auto">
            {usuarios.map(usuario => {
              const alumnoCount = (() => {
                if (usuario.alumnos_ids && Array.isArray(usuario.alumnos_ids)) {
                  return usuario.alumnos_ids.length;
                } else if (usuario.alumnos_ids && typeof usuario.alumnos_ids === 'string') {
                  return usuario.alumnos_ids.split(',').filter(Boolean).length;
                } else if (usuario.id_alumno) {
                  return 1;
                }
                return 0;
              })();

              return (
                <div 
                  key={usuario.id}
                  onClick={() => selectUser(usuario)}
                  class={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedUser?.id === usuario.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div class="font-medium">{usuario.nombre || usuario.email}</div>
                  <div class="text-sm text-gray-600">
                    Email: {usuario.email} • Rol: {usuario.rol || 'Usuario'}
                  </div>
                  <div class="text-sm text-blue-600">
                    {alumnoCount} alumno{alumnoCount !== 1 ? 's' : ''} asignado{alumnoCount !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Asignación de Alumnos */}
        <div>
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            {selectedUser ? `Alumnos para: ${selectedUser.nombre || selectedUser.email}` : 'Seleccione un usuario'}
          </h3>
          
          {selectedUser ? (
            <div>
              <div class="space-y-2 max-h-64 overflow-y-auto mb-4">
                {alumnos.map(alumno => (
                  <label 
                    key={alumno.id} 
                    class="flex items-center p-2 border rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAlumnos.includes(String(alumno.id))}
                      onChange={() => toggleAlumno(alumno.id)}
                      class="mr-3"
                    />
                    <div>
                      <div class="font-medium">{alumno.nombre} {alumno.apellido}</div>
                      <div class="text-sm text-gray-600">ID: {alumno.id}</div>
                    </div>
                  </label>
                ))}
              </div>
              
              <div class="flex gap-3">
                <button
                  onClick={saveAssignments}
                  disabled={saving}
                  class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Asignaciones'}
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setSelectedAlumnos([]);
                  }}
                  class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>

              <div class="mt-3 p-3 bg-gray-50 rounded">
                <div class="text-sm text-gray-600">
                  <strong>Resumen:</strong> {selectedAlumnos.length} alumno{selectedAlumnos.length !== 1 ? 's' : ''} seleccionado{selectedAlumnos.length !== 1 ? 's' : ''}
                </div>
                {selectedAlumnos.length > 0 && (
                  <div class="text-xs text-gray-500 mt-1">
                    IDs: {selectedAlumnos.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div class="text-center py-8 text-gray-500">
              <p>Seleccione un usuario para gestionar sus alumnos asignados</p>
            </div>
          )}
        </div>
      </div>

      <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 class="font-semibold text-blue-800 mb-2">Instrucciones:</h4>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• Seleccione un usuario de la lista izquierda</li>
          <li>• Marque los alumnos que debe poder ver ese usuario</li>
          <li>• Haga clic en "Guardar Asignaciones" para aplicar los cambios</li>
          <li>• Los usuarios con múltiples alumnos verán un selector en la página de asistencias</li>
        </ul>
      </div>
    </div>
  );
}