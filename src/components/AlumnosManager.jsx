import { useState, useEffect } from 'preact/hooks';

export default function AlumnosManager({ apiBaseUrl = '/api' }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    edad: '',
    curso: '',
    telefono_padre: '',
    materias: '',
    clases_compradas: '',
    horas: ''
  });

  useEffect(() => {
    loadAlumnos();
  }, []);

  async function loadAlumnos() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/alumnos`);
      if (!res.ok) throw new Error('Error al cargar alumnos');
      const data = await res.json();
      setAlumnos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      nombre: '',
      edad: '',
      curso: '',
      telefono_padre: '',
      materias: '',
      clases_compradas: '',
      horas: ''
    });
    setEditingId(null);
    setIsCreating(false);
  }

  function startCreating() {
    resetForm();
    setIsCreating(true);
  }

  function editAlumno(alumno) {
    setEditingId(alumno.id);
    setIsCreating(false);
    setFormData({
      nombre: alumno.nombre || '',
      edad: alumno.edad || '',
      curso: alumno.curso || '',
      telefono_padre: alumno.telefono_padre || '',
      materias: Array.isArray(alumno.materias) ? alumno.materias.join(', ') : '',
      clases_compradas: alumno.clases_compradas || '',
      horas: alumno.horas || ''
    });
  }

  async function handleSave() {
    setError(null);
    setSuccessMessage('');
    setSaving(true);
    try {
      const payload = {
        ...formData,
        materias: formData.materias.split(',').map(m => m.trim()).filter(Boolean)
      };

      if (isCreating) {
        const res = await fetch(`${apiBaseUrl}/alumnos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Error al crear alumno');
        }
        setSuccessMessage('✅ Alumno creado y guardado en Google Sheets correctamente');
      } else {
        const res = await fetch(`${apiBaseUrl}/alumnos/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Error al actualizar alumno');
        }
        setSuccessMessage('✅ Alumno actualizado en Google Sheets correctamente');
      }

      await loadAlumnos();
      setTimeout(() => {
        resetForm();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Estás seguro de eliminar este alumno?')) return;
    
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/alumnos/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar alumno');
      }
      setSuccessMessage('✅ Alumno eliminado de Google Sheets correctamente');
      await loadAlumnos();
      if (editingId === id) resetForm();
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div class="space-y-6">
      {error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong class="font-bold">Error: </strong>
          <span class="block sm:inline">{error}</span>
          <button onClick={() => setError(null)} class="absolute top-0 right-0 px-4 py-3">
            <span class="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {successMessage && (
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {saving && (
        <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded flex items-center gap-3">
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="font-medium">Guardando en Google Sheets...</span>
        </div>
      )}

      {/* Lista de Alumnos */}
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Lista de Alumnos</h2>
          <div class="flex gap-2">
            <button
              onClick={startCreating}
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Nuevo Alumno
            </button>
            <button
              onClick={loadAlumnos}
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ↻ Recargar
            </button>
          </div>
        </div>

        {loading && <p class="text-gray-500">Cargando...</p>}

        {!loading && alumnos.length === 0 && (
          <p class="text-gray-500 text-center py-4">No hay alumnos registrados</p>
        )}

        {!loading && alumnos.length > 0 && (
          <>
            {/* Desktop / tablet: tabla clásica */}
            <div class="hidden sm:block overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left">Nombre</th>
                    <th class="px-4 py-2 text-left">Edad</th>
                    <th class="px-4 py-2 text-left">Curso</th>
                    <th class="px-4 py-2 text-left">Teléfono</th>
                    <th class="px-4 py-2 text-left">Materias</th>
                    <th class="px-4 py-2 text-left">Clases</th>
                    <th class="px-4 py-2 text-left">Horas</th>
                    <th class="px-4 py-2 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnos.map(alumno => (
                    <tr key={alumno.id} class="border-t hover:bg-gray-50">
                      <td class="px-4 py-2 font-medium">{alumno.nombre}</td>
                      <td class="px-4 py-2">{alumno.edad || 'N/A'}</td>
                      <td class="px-4 py-2">{alumno.curso || 'N/A'}</td>
                      <td class="px-4 py-2">{alumno.telefono_padre || 'N/A'}</td>
                      <td class="px-4 py-2">
                        <span class="text-xs">
                          {Array.isArray(alumno.materias) ? alumno.materias.join(', ') : 'N/A'}
                        </span>
                      </td>
                      <td class="px-4 py-2">{alumno.clases_compradas || 0}</td>
                      <td class="px-4 py-2">{alumno.horas || 'N/A'}</td>
                      <td class="px-4 py-2 flex gap-2">
                        <button
                          onClick={() => editAlumno(alumno)}
                          class="text-blue-600 hover:underline text-sm"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(alumno.id)}
                          class="text-red-600 hover:underline text-sm"
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: tarjetas compactas */}
            <div class="block sm:hidden space-y-3">
              {alumnos.map(alumno => (
                <div key={alumno.id} class="bg-white rounded-lg shadow p-3 border">
                  <div class="flex justify-between items-start gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="text-base font-semibold truncate">{alumno.nombre}</div>
                      <div class="text-xs text-gray-500 truncate">{alumno.curso || 'N/A'} · {alumno.edad || 'N/A'} años</div>
                      <div class="text-xs text-gray-500 mt-1 truncate">{alumno.telefono_padre || 'N/A'}</div>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                      <div class="text-sm font-medium text-gray-700">{alumno.clases_compradas || 0} clases</div>
                      <div class="flex gap-2">
                        <button onClick={() => editAlumno(alumno)} class="px-3 py-1 bg-blue-600 text-white rounded text-xs">✏️</button>
                        <button onClick={() => handleDelete(alumno.id)} class="px-3 py-1 bg-red-600 text-white rounded text-xs">🗑️</button>
                      </div>
                      <button onClick={() => setExpandedId(expandedId === alumno.id ? null : alumno.id)} class="text-xs text-gray-500 mt-1">
                        {expandedId === alumno.id ? 'Ocultar' : 'Ver más'}
                      </button>
                    </div>
                  </div>
                  {expandedId === alumno.id && (
                    <div class="mt-3 text-xs text-gray-600 space-y-1">
                      <div><strong>Materias:</strong> {Array.isArray(alumno.materias) ? alumno.materias.join(', ') : 'N/A'}</div>
                      <div><strong>Horas:</strong> {alumno.horas || 'N/A'}</div>
                      <div><strong>Teléfono:</strong> {alumno.telefono_padre || 'N/A'}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Formulario de Creación/Edición */}
      {(isCreating || editingId) && (
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-bold mb-4">
            {isCreating ? 'Crear Nuevo Alumno' : 'Editar Alumno'}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nombre *</label>
              <input
                type="text"
                value={formData.nombre}
                onInput={(e) => setFormData({ ...formData, nombre: e.target.value })}
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Edad</label>
              <input
                type="number"
                value={formData.edad}
                onInput={(e) => setFormData({ ...formData, edad: e.target.value })}
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="18"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Curso</label>
              <input
                type="text"
                value={formData.curso}
                onInput={(e) => setFormData({ ...formData, curso: e.target.value })}
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="4to Secundaria"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Teléfono Padre</label>
              <input
                type="text"
                value={formData.telefono_padre}
                onInput={(e) => setFormData({ ...formData, telefono_padre: e.target.value })}
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="+591 74325440"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Materias (separadas por comas)</label>
              <input
                type="text"
                value={formData.materias}
                onInput={(e) => setFormData({ ...formData, materias: e.target.value })}
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Matemáticas, Física"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Clases Compradas</label>
              <input
                type="number"
                value={formData.clases_compradas}
                onInput={(e) => setFormData({ ...formData, clases_compradas: e.target.value })}
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="12"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Horas por Clase</label>
              <input
                type="text"
                value={formData.horas}
                onInput={(e) => setFormData({ ...formData, horas: e.target.value })}
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="2 horas"
              />
            </div>
          </div>
          <div class="mt-6 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              class={`px-6 py-2 rounded font-medium ${
                saving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white flex items-center gap-2`}
            >
              {saving && (
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {saving ? 'Guardando...' : (isCreating ? '💾 Crear' : '💾 Guardar Cambios')}
            </button>
            <button
              onClick={resetForm}
              disabled={saving}
              class="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
