import { useState, useEffect } from 'preact/hooks';

export default function MaterialesManager({ apiBaseUrl = '/api', initialMaterials = [], onSave }) {
  const [materiales, setMateriales] = useState([]);
  const [dataSource, setDataSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedMateria, setSelectedMateria] = useState('Todas');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    materia: 'Matemáticas',
    nivel: '',
    grado: '',
    titulo: '',
    descripcion: '',
    url_recurso: '',
    imagen_url: ''
  });

  const materias = ['Todas', 'Matemáticas', 'Física', 'Química', 'Programación','Robotica','Mixto','Computacion e Informatica'];
  const itemsPerPage = 5;

  useEffect(() => {
    loadMateriales();
  }, []);

  async function loadMateriales() {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Cargando materiales desde API...');
      const res = await fetch(`${apiBaseUrl}/materiales`);
      console.log('📡 Respuesta del servidor:', res.status, res.ok);
      if (!res.ok) throw new Error('Error al cargar materiales');
      const data = await res.json();
      const src = res.headers.get('x-data-source') || '';
      setDataSource(src);
      console.log('📦 Materiales recibidos:', data);
      setMateriales(data);
    } catch (err) {
      console.error('❌ Error al cargar materiales:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialMaterials && Array.isArray(initialMaterials) && initialMaterials.length > 0) {
      setMateriales(initialMaterials);
    }
  }, [initialMaterials]);

  function resetForm() {
    setFormData({
      materia: 'Matemáticas',
      titulo: '',
      descripcion: '',
      url_recurso: '',
      imagen_url: ''
    });
    setEditingId(null);
    setIsCreating(false);
  }

  function startCreating() {
    resetForm();
    setIsCreating(true);
  }

  function editMaterial(material) {
    setEditingId(material.id);
    setIsCreating(false);
    setFormData({
      id: material.id || '',
      materia: material.materia || 'Matemáticas',
      nivel: material.nivel || '',
      grado: material.grado || '',
      titulo: material.titulo || '',
      descripcion: material.descripcion || '',
      url_recurso: material.url_recurso || '',
      imagen_url: material.imagen_url || ''
    });
  }

  async function handleSave() {
    setError(null);
    setSuccessMessage('');
    setSaving(true);
    try {
      if (isCreating) {
        const res = await fetch(`${apiBaseUrl}/materiales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Error al crear material');
        }
        setSuccessMessage('✅ Material creado y guardado en Google Sheets correctamente');
      } else {
        const res = await fetch(`${apiBaseUrl}/materiales/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Error al actualizar material');
        }
        setSuccessMessage('✅ Material actualizado en Google Sheets correctamente');
      }

      await loadMateriales();
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
    if (!confirm('¿Estás seguro de eliminar este material?')) return;
    
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/materiales/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar material');
      }
      setSuccessMessage('✅ Material eliminado de Google Sheets correctamente');
      await loadMateriales();
      if (editingId === id) resetForm();
      
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredMateriales = selectedMateria === 'Todas'
    ? materiales
    : materiales.filter(m => m.materia === selectedMateria);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMateria]);

  const totalPages = Math.ceil(filteredMateriales.length / itemsPerPage);
  const paginatedMateriales = filteredMateriales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  console.log('🔍 Estado actual:', {
    totalMateriales: materiales.length,
    selectedMateria,
    filteredCount: filteredMateriales.length,
    materiales: materiales.map(m => ({ id: m.id, materia: m.materia, titulo: m.titulo }))
  });

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

      {/* Filtros */}
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-baseline gap-4">
            <h2 class="text-xl font-bold">Filtrar por Materia</h2>
            <div class="text-sm text-gray-600">Total: <strong class="ml-1">{materiales.length}</strong></div>
            <div class="text-sm text-gray-600">Filtrados: <strong class="ml-1">{filteredMateriales.length}</strong></div>
          </div>
          {dataSource && (
            <div class="text-sm text-gray-500">Fuente: <strong class="ml-1">{dataSource}</strong></div>
          )}
          <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={startCreating}
              class="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Nuevo Material
            </button>
            <button
              onClick={loadMateriales}
              class="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ↻ Recargar
            </button>
          </div>
        </div>
        <div class="flex gap-2 flex-wrap">
          {materias.map(materia => (
            <button
              key={materia}
              onClick={() => setSelectedMateria(materia)}
              class={`px-4 py-2 rounded border-2 transition ${
                selectedMateria === materia
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {materia}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario de Creación/Edición */}
      {(isCreating || editingId) && (
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-bold mb-4">
            {isCreating ? 'Crear Nuevo Material' : 'Editar Material'}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Materia *</label>
              <select
                value={formData.materia}
                onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="Matemáticas">Matemáticas</option>
                <option value="Física">Física</option>
                <option value="Química">Química</option>
                <option value="Programación">Programación</option>
                <option value="Robotica">Robotica</option>
                <option value="Mixto">Mixto</option>
                <option value="Computacion e Informatica">Computación e Informática</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Título *</label>
              <input
                type="text"
                value={formData.titulo}
                onInput={(e) => setFormData({ ...formData, titulo: e.target.value })}
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Título del material"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Nivel</label>
              <select
                value={formData.nivel}
                name="nivel"
                onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione nivel</option>
                <option value="Inicial">Inicial</option>
                <option value="Primaria">Primaria</option>
                <option value="Secundaria">Secundaria</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Grado</label>
              <select
                value={formData.grado}
                name="grado"
                onChange={(e) => setFormData({ ...formData, grado: e.target.value })}
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione grado</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-1">Descripción</label>
              <textarea
                value={formData.descripcion}
                onInput={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Descripción del material"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">URL del Recurso *</label>
              <input
                type="url"
                value={formData.url_recurso}
                onInput={(e) => setFormData({ ...formData, url_recurso: e.target.value })}
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="https://ejemplo.com/recurso"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">URL de Imagen</label>
              <input
                type="url"
                value={formData.imagen_url}
                onInput={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
          </div>
          <div class="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              class={`px-4 sm:px-6 py-2 sm:py-2 text-sm sm:text-base rounded font-medium ${
                saving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white flex items-center gap-2 justify-center sm:justify-start`}
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
              class="px-4 sm:px-6 py-2 sm:py-2 text-sm sm:text-base bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Materiales */}
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4">
          Materiales {selectedMateria !== 'Todas' && `- ${selectedMateria}`}
        </h2>

        {loading && <p class="text-gray-500">Cargando...</p>}

        {!loading && filteredMateriales.length === 0 && (
          <p class="text-gray-500 text-center py-4">
            No hay materiales disponibles
            {selectedMateria !== 'Todas' && ` para ${selectedMateria}`}
          </p>
        )}

        {!loading && filteredMateriales.length > 0 && (
          <>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedMateriales.map(material => (
              <div key={material.id} class="border rounded-lg overflow-hidden hover:shadow-md transition">
                <div class="relative h-32 bg-gray-200">
                  <img
                    src={material.imagen_url}
                    alt={material.titulo}
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span class="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                    {material.materia}
                  </span>
                </div>
                <div class="p-4">
                  <h3 class="font-bold text-sm mb-2 line-clamp-2">{material.titulo}</h3>
                  <p class="text-gray-600 text-xs mb-3 line-clamp-2">{material.descripcion}</p>
                  <div class="flex gap-2">
                    <a
                      href={material.url_recurso}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-blue-600 hover:underline text-xs font-medium flex-1"
                    >
                      Ver recurso →
                    </a>
                    <button
                      onClick={() => editMaterial(material)}
                      class="text-blue-600 hover:underline text-xs"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(material.id)}
                      class="text-red-600 hover:underline text-xs"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination Controls */}
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 pb-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              class="px-4 sm:px-6 py-2 text-sm sm:text-base rounded border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ← Anterior
            </button>
            <span class="text-gray-700 font-medium text-sm sm:text-base">
              Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              class="px-4 sm:px-6 py-2 text-sm sm:text-base rounded border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Siguiente →
            </button>
          </div>
        </>        )}
      </div>

      {/* Resumen */}
      <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p class="text-sm text-blue-900">
          <strong>Total de materiales:</strong> {materiales.length} | 
          <strong> Mostrando:</strong> {filteredMateriales.length}
        </p>
      </div>
    </div>
  );
}
