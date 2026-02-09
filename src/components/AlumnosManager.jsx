import { useState, useEffect } from 'preact/hooks';
import AlumnosForm from './AlumnosForm.jsx';

export default function AlumnosManager({ apiBaseUrl = '/api' }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    edad: '',
    curso: '',
    telefono_padre: '',
    materias: '',
    clases_compradas: '',
    horas: '',
    email: '',
    password: '',
    rol: 'padre'
  });
  const [formErrors, setFormErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deletingId, setDeletingId] = useState(null);

  async function loadAlumnos() {
    setLoading(true);
    setError(null);
    try {
      // cache-bust to avoid stale Google Sheets eventual consistency
      const res = await fetch(`${apiBaseUrl}/alumnos?t=${Date.now()}`);
      if (!res.ok) throw new Error('Error al cargar alumnos');
      const data = await res.json();
      setAlumnos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlumnos();
  }, []);

  function startCreating() {
    resetForm();
    setIsCreating(true);
    setEditingId(null);
  }

  function editAlumno(alumno) {
    setFormData({
      nombre: alumno.nombre || '',
      edad: alumno.edad || '',
      curso: alumno.curso || '',
      telefono_padre: alumno.telefono_padre || '',
      materias: Array.isArray(alumno.materias) ? alumno.materias.join(', ') : '',
      clases_compradas: alumno.clases_compradas || '',
      horas: alumno.horas || '',
      email: alumno.email || '',
      password: '',
      rol: alumno.rol || 'padre'
    });
    setEditingId(alumno.id);
    setIsCreating(false);
  }

  function resetForm() {
    setFormData({
      nombre: '',
      edad: '',
      curso: '',
      telefono_padre: '',
      materias: '',
      clases_compradas: '',
      horas: '',
      email: '',
      password: '',
      rol: 'padre'
    });
    setFormErrors({});
    setIsCreating(false);
    setEditingId(null);
  }

  async function handleSave() {
    setSaving(true);
    const errors = {};
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (formData.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) errors.email = 'Email inválido';
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      setSaving(false);
      return;
    }
    setFormErrors({});
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
        console.log('🔁 Enviando PUT para id:', editingId, 'payload:', payload);
        const res = await fetch(`${apiBaseUrl}/alumnos/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          let errorText = '';
          try { errorText = await res.text(); } catch (e) { errorText = String(e); }
          console.error('PUT /api/alumnos error response:', res.status, errorText);
          const errorData = (() => { try { return JSON.parse(errorText); } catch { return null } })();
          throw new Error((errorData && errorData.error) || `Error al actualizar alumno (${res.status})`);
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
    setDeletingId(id);
    try {
      const res = await fetch(`${apiBaseUrl}/alumnos/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar alumno');
      }
      // optimistically remove from UI immediately
      setAlumnos(prev => prev.filter(a => String(a.id) !== String(id)));
      setSuccessMessage('✅ Alumno eliminado de Google Sheets correctamente');
      try { await loadAlumnos(); } catch (e) { console.warn('Warning: loadAlumnos after delete failed', e); }
      if (editingId === id) resetForm();
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setDeletingId(null);
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
          <div class="flex-1">
            <h2 class="text-xl font-bold">Lista de Alumnos</h2>
            <div class="mt-3 max-w-md">
              <input
                type="search"
                value={searchTerm}
                onInput={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, curso o teléfono"
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div class="flex gap-2 ml-4">
            <button
              onClick={startCreating}
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo
            </button>
            <button
              onClick={loadAlumnos}
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v6h6M20 20v-6h-6" />
              </svg>
              Recargar
            </button>
          </div>
        </div>

        {loading && (
          <div class="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} class="h-8 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        )}

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
                  {(() => {
                    const q = searchTerm.trim().toLowerCase();
                    const filtered = alumnos.filter(a => {
                      if (!q) return true;
                      return [a.nombre, a.curso, a.telefono_padre, (a.email||'')].some(v => String(v||'').toLowerCase().includes(q));
                    });
                    const total = filtered.length;
                    const totalPages = Math.max(1, Math.ceil(total / pageSize));
                    if (page > totalPages) setPage(totalPages);
                    const start = (page - 1) * pageSize;
                    const visible = filtered.slice(start, start + pageSize);
                    return visible.map(alumno => (
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
                          class="text-blue-600 hover:underline text-sm flex items-center gap-2"
                          aria-label={`Editar ${alumno.nombre}`}
                          disabled={deletingId === alumno.id}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5h6M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7" />
                          </svg>
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(alumno.id)}
                          class="text-red-600 hover:underline text-sm flex items-center gap-2"
                          aria-label={`Eliminar ${alumno.nombre}`}
                          disabled={deletingId === alumno.id}
                        >
                          {deletingId === alumno.id ? (
                            <>
                              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Eliminando...
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Eliminar
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div class="mt-4 flex items-center justify-between">
              <div class="text-sm text-gray-600">
                {(() => {
                  const q = searchTerm.trim().toLowerCase();
                  const total = alumnos.filter(a => {
                    if (!q) return true;
                    return [a.nombre, a.curso, a.telefono_padre, (a.email||'')].some(v => String(v||'').toLowerCase().includes(q));
                  }).length;
                  const start = (page - 1) * pageSize + 1;
                  const end = Math.min(total, page * pageSize);
                  return `Mostrando ${start}-${end} de ${total}`;
                })()}
              </div>
              <div class="flex items-center gap-2">
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} class="px-2 py-1 border rounded">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} class="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Anterior</button>
                <button onClick={() => setPage(p => p + 1)} class="px-3 py-1 bg-gray-200 rounded">Siguiente</button>
              </div>
            </div>

            {/* Mobile: tarjetas compactas */}
            <div class="block sm:hidden space-y-3">
              {alumnos
                .filter(a => {
                  const q = searchTerm.trim().toLowerCase();
                  if (!q) return true;
                  return [a.nombre, a.curso, a.telefono_padre, (a.email||'')].some(v => String(v||'').toLowerCase().includes(q));
                })
                .map(alumno => (
                <div key={alumno.id} class="bg-white rounded-lg shadow p-3 border">
                  <div class="flex justify-between items-start gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="text-base font-semibold truncate">{alumno.nombre}</div>
                      <div class="text-xs text-gray-500 truncate">{alumno.curso || 'N/A'} · {alumno.edad || 'N/A'} años</div>
                      <div class="text-xs text-gray-500 mt-1 truncate">{alumno.telefono_padre || 'N/A'}</div>
                      <div class="text-xs text-gray-500 mt-1 truncate">{alumno.email || '—'} · {alumno.rol || 'padre'}</div>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                      <div class="text-sm font-medium text-gray-700">{alumno.clases_compradas || 0} clases</div>
                        <div class="flex gap-2">
                        <button onClick={() => editAlumno(alumno)} class="px-3 py-1 bg-blue-600 text-white rounded text-xs" disabled={deletingId === alumno.id}>✏️</button>
                        <button onClick={() => handleDelete(alumno.id)} class="px-3 py-1 bg-red-600 text-white rounded text-xs" disabled={deletingId === alumno.id}>
                          {deletingId === alumno.id ? '...' : '🗑️'}
                        </button>
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
            {(isCreating || editingId) && (
              <>
                <div>
                  <label class="block text-sm font-medium mb-1">Email (usuario)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onInput={(e) => setFormData({ ...formData, email: e.target.value })}
                    class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="padre@example.com"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Password (usuario)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onInput={(e) => setFormData({ ...formData, password: e.target.value })}
                    class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="123456"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Rol</label>
                  <select
                    value={formData.rol}
                    onInput={(e) => setFormData({ ...formData, rol: e.target.value })}
                    class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="padre">padre</option>
                    <option value="alumno">alumno</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label class="block text-sm font-medium mb-1">Nombre *</label>
              <input
                id="nombre-input"
                type="text"
                value={formData.nombre}
                onInput={(e) => setFormData({ ...formData, nombre: e.target.value })}
                class={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${formErrors.nombre ? 'border-red-500' : ''}`}
                placeholder="Nombre completo"
                aria-invalid={formErrors.nombre ? 'true' : 'false'}
                aria-describedby={formErrors.nombre ? 'error-nombre' : undefined}
              />
              {formErrors.nombre && <p id="error-nombre" class="text-sm text-red-600 mt-1">{formErrors.nombre}</p>}
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
              {!saving && (
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {saving ? 'Guardando...' : (isCreating ? 'Crear' : 'Guardar Cambios')}
            </button>
            <button
              onClick={resetForm}
              class="px-6 py-2 rounded font-medium bg-gray-400 hover:bg-gray-500 text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
