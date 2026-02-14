import { useState, useEffect, useMemo } from 'preact/hooks';

export default function MaterialesPublic({ apiBaseUrl = '/api' }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedMateria, setSelectedMateria] = useState('Todas');
  const [selectedNivel, setSelectedNivel] = useState('Todos');
  const [selectedGrado, setSelectedGrado] = useState('Todos');
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadMateriales();
  }, []);

  async function loadMateriales() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/materiales`);
      if (!res.ok) throw new Error('Error al cargar materiales');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.value || data.materiales || []);
      setMaterials(list || []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const materias = useMemo(() => ['Todas', ...Array.from(new Set(materials.map(m => (m.materia || '').trim()).filter(Boolean)))], [materials]);
  const niveles = useMemo(() => ['Todos', ...Array.from(new Set(materials.map(m => (m.nivel || '').trim()).filter(Boolean)))], [materials]);
  const grados = useMemo(() => ['Todos', ...Array.from(new Set(materials.map(m => (m.grado || '').trim()).filter(Boolean)))], [materials]);

  const filtered = useMemo(() => {
    const q = String(query || '').toLowerCase().trim();
    return materials.filter(m => {
      if (selectedMateria && selectedMateria !== 'Todas' && (m.materia || '') !== selectedMateria) return false;
      if (selectedNivel && selectedNivel !== 'Todos' && (m.nivel || '') !== selectedNivel) return false;
      if (selectedGrado && selectedGrado !== 'Todos' && (m.grado || '') !== selectedGrado) return false;
      if (!q) return true;
      const inTitle = (m.titulo || '').toLowerCase().includes(q);
      const inDesc = (m.descripcion || '').toLowerCase().includes(q);
      const inMateria = (m.materia || '').toLowerCase().includes(q);
      return inTitle || inDesc || inMateria;
    });
  }, [materials, selectedMateria, selectedNivel, selectedGrado, query]);

  if (loading) return (
    <div class="py-12">
      <div class="max-w-6xl mx-auto px-4">
        <div class="animate-pulse space-y-4">
          <div class="h-8 bg-gray-200 rounded w-1/3"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} class="h-40 bg-white rounded shadow p-4"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div class="py-8 text-center">
      <p class="text-red-600">Error al cargar materiales: {error}</p>
      <button onClick={loadMateriales} class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Reintentar</button>
    </div>
  );

  return (
    <section class="py-8">
      <div class="max-w-6xl mx-auto px-4">
        <div class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-2xl sm:text-3xl font-bold">Materiales</h2>
            <div class="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(s => !s)}
                class="md:hidden px-3 py-2 bg-blue-600 text-white rounded-lg shadow-md"
                aria-expanded={showFilters}
                aria-controls="filters-panel"
              >
                {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              </button>
              <button onClick={() => { setQuery(''); setSelectedMateria('Todas'); setSelectedNivel('Todos'); setSelectedGrado('Todos'); }} class="hidden md:inline-block px-3 py-2 bg-gray-100 rounded">Limpiar</button>
            </div>
          </div>

          <div id="filters-panel" class={`w-full transition-all duration-200 ${showFilters ? 'block' : 'hidden'} md:block`}>
            <div class="flex flex-col gap-3 w-full">
              <div class="flex items-center gap-3 w-full">
                <div class="relative flex-1">
                  <input
                    value={query}
                    onInput={(e) => setQuery(e.target.value)}
                    placeholder="Buscar título, descripción o materia"
                    class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    aria-label="Buscar materiales"
                  />
                  {query ? (
                    <button
                      onClick={() => setQuery('')}
                      class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-100 rounded text-sm"
                      aria-label="Limpiar búsqueda"
                    >
                      Limpiar
                    </button>
                  ) : null}
                </div>

                
              </div>

              <div class="overflow-x-auto no-scrollbar py-1">
                <div class="flex gap-2 items-center w-max">
                  {materias.map(m => (
                    <button
                      key={m}
                      onClick={() => setSelectedMateria(m)}
                      class={`whitespace-nowrap px-3 py-1.5 rounded-full border ${selectedMateria === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-800'}`}
                      aria-pressed={selectedMateria === m}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <select value={selectedNivel} onChange={(e) => setSelectedNivel(e.target.value)} class="w-full px-3 py-2 border rounded-lg">
                  {niveles.map(n => <option key={n} value={n}>{n}</option>)}
                </select>

                <select value={selectedGrado} onChange={(e) => setSelectedGrado(e.target.value)} class="w-full px-3 py-2 border rounded-lg">
                  {grados.map(g => <option key={g} value={g}>{g}</option>)}
                </select>

                <div class="hidden md:flex items-center">
                  <span class="text-sm text-gray-600">Resultados: <strong class="text-gray-800">{filtered.length}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div class="text-center py-12">
            <p class="text-gray-600">No se encontraron materiales que coincidan con los filtros.</p>
            <button onClick={loadMateriales} class="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Recargar</button>
          </div>
        ) : (
          <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(m => (
              <li key={m.id} class="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden touch-manipulation">
                <div class="h-36 sm:h-44 bg-gray-100 relative">
                  {m.imagen_url ? (
                    <img src={m.imagen_url} alt={m.titulo} class="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div class="w-full h-full flex items-center justify-center text-gray-400">Sin imagen</div>
                  )}
                  <div class="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded text-xs">{m.materia}</div>
                  <div class="absolute top-3 right-3 flex flex-col items-end gap-1">
                    {m.nivel ? (
                      <span class="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200">{m.nivel}</span>
                    ) : null}
                    {m.grado ? (
                      <span class="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-200">Grado {m.grado}</span>
                    ) : null}
                  </div>
                </div>
                <div class="p-4">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="font-semibold text-base sm:text-lg line-clamp-2">{m.titulo}</h3>
                    <div class="hidden text-right text-sm md:block">
                      {/* Badges are shown on the image; keep small labels for accessibility on larger screens */}
                      {m.nivel ? <div class="text-xs text-gray-500">{m.nivel}</div> : null}
                      {m.grado ? <div class="text-xs text-gray-500">Grado {m.grado}</div> : null}
                    </div>
                  </div>
                  {m.descripcion ? <p class="text-sm text-gray-600 mb-3 line-clamp-3">{m.descripcion}</p> : null}
                  <div class="flex items-center justify-between">
                    <a href={m.url_recurso} target="_blank" rel="noreferrer" class="text-blue-600 font-medium">Ver recurso →</a>
                    
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
