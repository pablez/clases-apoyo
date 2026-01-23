import { useState, useEffect } from 'preact/hooks';
import LoadingSpinner from './LoadingSpinner.jsx';

export default function MaterialesPublic({ apiBaseUrl = '/api' }) {
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMateria, setSelectedMateria] = useState('Todas');
  const [retryCount, setRetryCount] = useState(0);

  const materias = ['Todas', 'Matemáticas', 'Física', 'Química', 'Programación'];

  useEffect(() => {
    loadMateriales();
  }, []);

  async function loadMateriales() {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando materiales...');
      const res = await fetch(`${apiBaseUrl}/materiales`);
      
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('✅ Materiales cargados:', data.length);
      setMateriales(data);
      setRetryCount(0);
    } catch (err) {
      console.error('❌ Error al cargar materiales:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    setRetryCount(prev => prev + 1);
    loadMateriales();
  }

  const filteredMateriales = selectedMateria === 'Todas'
    ? materiales
    : materiales.filter(m => m.materia === selectedMateria);

  if (loading) {
    return (
      <div class="space-y-6">
        <LoadingSpinner message="Cargando materiales educativos..." size="large" />
        
        {/* Skeleton Cards */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} class="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div class="h-48 bg-gray-200"></div>
              <div class="p-6 space-y-3">
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                <div class="h-4 bg-gray-200 rounded"></div>
                <div class="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="text-center py-12">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">Error al cargar materiales</h3>
        <p class="text-gray-600 mb-4">{error}</p>
        <button
          onClick={retry}
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          {retryCount > 0 ? `Reintentar (${retryCount})` : 'Reintentar'}
        </button>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {/* Filtros */}
      <div class="mb-8 flex gap-3 flex-wrap items-center">
        <span class="text-sm font-medium text-gray-700">Filtrar por:</span>
        {materias.map(materia => (
          <button
            key={materia}
            onClick={() => setSelectedMateria(materia)}
            class={`px-4 py-2 rounded-lg border-2 transition-all transform hover:scale-105 ${
              selectedMateria === materia
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}
          >
            {materia}
          </button>
        ))}
      </div>

      {/* Contador */}
      <div class="text-sm text-gray-600">
        Mostrando <span class="font-bold text-blue-600">{filteredMateriales.length}</span> {filteredMateriales.length === 1 ? 'material' : 'materiales'}
        {selectedMateria !== 'Todas' && <span> de {selectedMateria}</span>}
      </div>

      {/* Lista de materiales */}
      {filteredMateriales.length === 0 ? (
        <div class="text-center py-12 bg-gray-50 rounded-lg">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <p class="text-gray-500 text-lg">No hay materiales disponibles</p>
          <p class="text-sm text-gray-400 mt-2">
            {selectedMateria !== 'Todas' 
              ? `Intenta seleccionar otra materia` 
              : 'Vuelve pronto para encontrar nuevos recursos'}
          </p>
        </div>
      ) : (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMateriales.map(material => (
            <div key={material.id} class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
              {material.imagen_url && (
                <div class="h-48 overflow-hidden bg-gray-100">
                  <img 
                    src={material.imagen_url} 
                    alt={material.titulo}
                    class="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-blue-50"><svg class="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div>';
                    }}
                  />
                </div>
              )}
              <div class="p-6">
                <div class="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-3">
                  {material.materia}
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">{material.titulo}</h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">{material.descripcion}</p>
                <a
                  href={material.url_recurso}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <span>Ver Material</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
