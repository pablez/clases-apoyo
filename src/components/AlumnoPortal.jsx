import { h } from 'preact';
import { useEffect, useState, useMemo } from 'preact/hooks';
import AttendanceChart from './AttendanceChart.jsx';

export default function AlumnoPortal({ apiBaseUrl = '/api' }) {
  const [asistencias, setAsistencias] = useState([]);
  const [meta, setMeta] = useState(null);
  const [alumno, setAlumno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [estadoFilter, setEstadoFilter] = useState('Todas');
  
  // Multi-alumno support
  const [alumnos, setAlumnos] = useState([]);
  const [isMultiAlumno, setIsMultiAlumno] = useState(false);
  const [alumnosLoading, setAlumnosLoading] = useState(true);
  const [showAllTogether, setShowAllTogether] = useState(true); // Nueva opción para mostrar todos juntos
  const [selectedView, setSelectedView] = useState('all'); // 'all' o id específico del alumno

  // Load user's accessible alumnos
  useEffect(() => {
    async function loadUserAlumnos() {
      setAlumnosLoading(true);
      try {
        const token = (() => {
          try { return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || localStorage.getItem('sessionToken'); } catch (e) { return null; }
        })();
        
        const init = token ? { headers: { Authorization: `Bearer ${token}`, 'session-token': token } } : { credentials: 'include' };
        const response = await fetch(`${apiBaseUrl}/usuario/alumnos`, init);

        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setAlumnos(data.alumnos || []);
          setIsMultiAlumno(data.isMultiAlumno || false);
          
          // Set the first alumno as the current alumno for display
          if (data.alumnos && data.alumnos.length > 0) {
            setAlumno(data.alumnos[0]);
          }
          
          // Auto-select first alumno if user has only one
          if (data.alumnos && data.alumnos.length === 1) {
            setSelectedView(data.alumnos[0].id);
          } else if (data.alumnos && data.alumnos.length > 1) {
            // For multi-alumno users, show all by default
            setSelectedView('all');
          }
        } else {
          console.warn('Could not load user alumnos');
        }
      } catch (err) {
        console.warn('Error loading user alumnos:', err);
      } finally {
        setAlumnosLoading(false);
      }
    }

    loadUserAlumnos();
  }, [apiBaseUrl]);
  

  useEffect(() => {
    // Skip loading if we're still loading alumnos
    if (alumnosLoading) {
      setLoading(false);
      setAsistencias([]);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = (() => {
          try { return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || localStorage.getItem('sessionToken'); } catch (e) { return null; }
        })();
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        if (estadoFilter && estadoFilter !== 'Todas') params.set('estado', estadoFilter);
        
        // Add alumno_id parameter only if viewing specific alumno (not 'all')
        if (selectedView !== 'all' && selectedView) {
          params.set('alumno_id', selectedView);
        }
        
        const url = `${apiBaseUrl}/alumno/asistencias?${params.toString()}`;
        const init = token ? { headers: { Authorization: `Bearer ${token}`, 'session-token': token } } : { credentials: 'include' };
        const res = await fetch(url, init);
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (!res.ok) throw new Error('Error al obtener asistencias');
        const payload = await res.json();
        const list = Array.isArray(payload.data) ? payload.data : payload || [];
        if (payload && payload.meta) setMeta(payload.meta);
        if (payload && payload.alumno) {
          setAlumno(payload.alumno);
        } else if (!isMultiAlumno && alumnos.length > 0) {
          // If no alumno in response but we have loaded alumnos, set the first one
          setAlumno(alumnos[0]);
        } else if (selectedView !== 'all' && selectedView && alumnos.length > 0) {
          // If viewing specific alumno, find and set it
          const selectedAlumno = alumnos.find(a => String(a.id) === String(selectedView));
          if (selectedAlumno) setAlumno(selectedAlumno);
        }
        const normalized = list.map(a => ({
          id: a.id || a.id_asistencia || `${a.fecha}-${a.hora}`,
          fecha: a.fecha,
          hora: a.hora,
          estado: a.estado,
          observaciones: a.observaciones || a.observacion || '',
          alumnoId: a.alumnoId || a.id_alumno, // Importante: mantener referencia al alumno
          alumnoNombre: a.alumnoNombre || (alumnos.find(al => String(al.id) === String(a.alumnoId || a.id_alumno))?.nombre) || 'Desconocido'
        }));
        // sort ascending by fecha (día, mes, año) — convierte 'DD/MM/YY' o 'DD/MM/YYYY' a Date
        function parseFecha(fechaStr) {
          if (!fechaStr) return 0;
          const parts = fechaStr.split('/');
          if (parts.length !== 3) return 0;
          const day = Number(parts[0]);
          const month = Number(parts[1]);
          let year = Number(parts[2]);
          if (year < 100) year += 2000;
          const d = new Date(year, month - 1, day);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        }

        // ordenar ascendente (más antiguo -> más reciente). Para invertir, cambiar b - a.
        normalized.sort((a, b) => parseFecha(a.fecha) - parseFecha(b.fecha));
        setAsistencias(normalized);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [estadoFilter, page, pageSize, selectedView, alumnosLoading, alumnos]);

  function getWeekdayName(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';
    const d = new Date(parts[2], parts[1] - 1, parts[0]);
    if (isNaN(d.getTime())) return '';
    const names = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    return names[d.getDay()];
  }

  const total = asistencias.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const presentes = asistencias.filter(a => a.estado === 'Presente').length;
  const faltas = asistencias.filter(a => a.estado === 'Falta').length;
  const pendientes = asistencias.filter(a => a.estado === 'Pendiente').length;
  
  // Estadísticas por alumno para multi-alumno
  const estatsPorAlumno = useMemo(() => {
    if (!isMultiAlumno || selectedView !== 'all') return {};
    
    const stats = {};
    alumnos.forEach(alumno => {
      const asistenciasAlumno = asistencias.filter(a => String(a.alumnoId) === String(alumno.id));
      stats[alumno.id] = {
        nombre: alumno.nombre,
        total: asistenciasAlumno.length,
        presentes: asistenciasAlumno.filter(a => a.estado === 'Presente').length,
        faltas: asistenciasAlumno.filter(a => a.estado === 'Falta').length,
        pendientes: asistenciasAlumno.filter(a => a.estado === 'Pendiente').length
      };
    });
    return stats;
  }, [asistencias, alumnos, isMultiAlumno, selectedView]);
  
  const current = useMemo(() => {
    const start = (page - 1) * pageSize;
    return asistencias.slice(start, start + pageSize);
  }, [asistencias, page, pageSize]);

  function exportCsv() {
    const rows = [['Fecha', 'Hora', 'Estado', 'Observaciones'], ...asistencias.map(a => [a.fecha, a.hora, a.estado, a.observaciones])];
    const csv = rows.map(r => r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencias_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (loading || alumnosLoading) return (
    <div class="max-w-4xl mx-auto mt-8 p-4 bg-white rounded shadow">
      <div class="animate-pulse">
        <div class="h-6 bg-gray-200 rounded w-3/5 mb-2"></div>
        <div class="h-4 bg-gray-200 rounded w-2/5 mb-4"></div>
        {/* Multi-alumno selector loading state */}
        <div class="mb-6">
          <div class="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div class="h-10 bg-gray-200 rounded w-64"></div>
        </div>
        <div class="flex items-center gap-4 mb-4">
          <div class="h-10 w-16 bg-gray-200 rounded"></div>
          <div class="h-10 w-16 bg-gray-200 rounded"></div>
          <div class="h-10 w-16 bg-gray-200 rounded"></div>
          <div class="h-8 w-28 bg-gray-200 rounded ml-auto"></div>
        </div>
        <div class="grid gap-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} class="p-3 border rounded-lg flex items-center justify-between">
              <div class="w-2/3">
                <div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div class="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div class="w-24 h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  if (error) return <div class="p-4 text-red-600">{error}</div>;

  return (
    <div class="max-w-4xl mx-auto mt-8 px-3 sm:px-6 p-6 bg-white rounded-lg shadow-md">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
        <div>
          <h2 class="text-3xl font-extrabold">Mi historial de asistencias</h2>
          <p class="text-sm text-gray-500 mt-1">Resumen y estado de tus clases</p>
          
          {/* Información del alumno para vista individual */}
          {!isMultiAlumno && alumno ? (
            <div class="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded">
              <div><strong>Estudiante:</strong> {alumno.nombre}</div>
              <div><strong>Materias:</strong> {Array.isArray(alumno.materias) ? alumno.materias.join(', ') : (alumno.materias || '-')}</div>
              <div><strong>Total clases:</strong> {alumno.clases_compradas ?? 0}</div>
            </div>
          ) : null}
          
          {/* Selector de vista para multi-alumno - Cards atractivos */}
          {isMultiAlumno && alumnos.length > 1 && (
            <div class="mt-4 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Selecciona vista de asistencias:
                </label>
                
                {/* Card para ver todos juntos */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  <button
                    onClick={() => {
                      setSelectedView('all');
                      setPage(1);
                    }}
                    class={`p-4 border-2 rounded-xl text-left transition-all duration-200 hover:shadow-lg transform hover:scale-105 ${
                      selectedView === 'all' 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div class="flex items-center space-x-3">
                      <div class={`p-2 rounded-full ${selectedView === 'all' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1054 21 18 21H17ZM17 21V10L12 5" stroke={selectedView === 'all' ? '#3b82f6' : '#6b7280'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                      <div class="flex-1">
                        <h3 class={`font-semibold ${selectedView === 'all' ? 'text-blue-800' : 'text-gray-800'}`}>
                          📊 Vista Combinada
                        </h3>
                        <p class={`text-sm ${selectedView === 'all' ? 'text-blue-600' : 'text-gray-600'}`}>
                          Todos los alumnos ({alumnos.length})
                        </p>
                      </div>
                      {selectedView === 'all' && (
                        <div class="text-blue-500">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                </div>

                {/* Cards individuales para cada alumno */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {alumnos.map(alumnoCard => (
                    <button
                      key={alumnoCard.id}
                      onClick={() => {
                        setSelectedView(alumnoCard.id);
                        setAlumno(alumnoCard);
                        setPage(1);
                      }}
                      class={`p-4 border-2 rounded-xl text-left transition-all duration-200 hover:shadow-lg transform hover:scale-105 ${
                        String(selectedView) === String(alumnoCard.id)
                          ? 'border-green-500 bg-green-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-green-300'
                      }`}
                    >
                      <div class="flex items-center space-x-3">
                        <div class={`p-2 rounded-full ${String(selectedView) === String(alumnoCard.id) ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke={String(selectedView) === String(alumnoCard.id) ? '#22c55e' : '#6b7280'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke={String(selectedView) === String(alumnoCard.id) ? '#22c55e' : '#6b7280'} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <h3 class={`font-semibold truncate ${String(selectedView) === String(alumnoCard.id) ? 'text-green-800' : 'text-gray-800'}`}>
                            👤 {alumnoCard.nombre}
                          </h3>
                          <p class={`text-sm ${String(selectedView) === String(alumnoCard.id) ? 'text-green-600' : 'text-gray-600'}`}>
                            {alumnoCard.clases_compradas || 0} clases
                          </p>
                        </div>
                        {String(selectedView) === String(alumnoCard.id) && (
                          <div class="text-green-500">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Información de alumnos para vista multi */}
              {selectedView === 'all' && (
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 class="text-sm font-semibold text-blue-800 mb-2">Información de alumnos:</h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-700">
                    {alumnos.map(alumno => (
                      <div key={alumno.id} class="flex justify-between">
                        <span><strong>{alumno.nombre}:</strong></span>
                        <span>{alumno.clases_compradas || 0} clases</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Información del alumno individual cuando está seleccionado */}
              {selectedView !== 'all' && (() => {
                const alumnoSeleccionado = alumnos.find(a => String(a.id) === String(selectedView));
                return alumnoSeleccionado ? (
                  <div class="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    <div><strong>Estudiante:</strong> {alumnoSeleccionado.nombre}</div>
                    <div><strong>Materias:</strong> {Array.isArray(alumnoSeleccionado.materias) ? alumnoSeleccionado.materias.join(', ') : (alumnoSeleccionado.materias || '-')}</div>
                    <div><strong>Total clases:</strong> {alumnoSeleccionado.clases_compradas ?? 0}</div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Estadísticas numéricas y gráfica */}
          <div class="flex flex-col gap-4 w-full sm:w-auto">
            <div class="flex items-center gap-3">
              <div class="text-center px-3 py-2 bg-green-50 rounded-md shadow-sm">
                <div class="text-2xl font-bold">{presentes}</div>
                <div class="text-xs text-green-600">Presentes</div>
              </div>
              <div class="text-center px-3 py-2 bg-red-50 rounded-md shadow-sm">
                <div class="text-2xl font-bold">{faltas}</div>
                <div class="text-xs text-red-600">Faltas</div>
              </div>
              <div class="text-center px-3 py-2 bg-gray-50 rounded-md shadow-sm">
                <div class="text-2xl font-bold">{pendientes}</div>
                <div class="text-xs text-gray-600">Pendientes</div>
              </div>
            </div>
            
            {/* Gráfica de asistencia - máximo 2 barras (Presentes vs Faltas) */}
            <div class="w-full">
              <AttendanceChart 
                presentes={presentes} 
                faltas={faltas} 
                pendientes={pendientes}
                className="w-full"
              />
            </div>
          </div>
          
          <button
            class="bg-white border border-gray-200 px-3 py-2 rounded-md text-sm hover:shadow-md flex items-center gap-2"
            onClick={() => {
              try {
                const number = '59174325440';
                const mensaje = isMultiAlumno && selectedView === 'all' 
                  ? `Hola, necesito el listado de asistencias de mis ${alumnos.length} alumnos: ${alumnos.map(a => a.nombre).join(', ')}`
                  : `Hola, necesito mi listado de asistencias. Estudiante: ${alumno ? alumno.nombre : (alumnos.find(a => String(a.id) === String(selectedView))?.nombre || '')}`;
                const url = `https://wa.me/${number}?text=${encodeURIComponent(mensaje)}`;
                window.open(url, '_blank');
              } catch (e) {
                console.warn('No se pudo abrir WhatsApp:', e && e.message);
              }
            }}
            aria-label="Contactar por WhatsApp"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M20.52 3.48A11.91 11.91 0 0012 0C5.373 0 .12 5.253.12 11.88c0 2.09.55 4.14 1.6 5.94L0 24l6.54-1.68A11.86 11.86 0 0012 23.76c6.627 0 11.88-5.253 11.88-11.88 0-3.17-1.24-6.14-3.36-8.4z" fill="#25D366"/>
              <path d="M17.2 14.14c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.18.2-.36.22-.67.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.36.45-.54.15-.18.2-.3.3-.5.1-.2 0-.38-.05-.53-.05-.15-.68-1.64-.93-2.25-.24-.58-.49-.5-.68-.51l-.58-.01c-.2 0-.52.07-.8.38-.28.3-1.06 1.04-1.06 2.54s1.08 2.96 1.23 3.17c.15.2 2.12 3.3 5.13 4.63 3.02 1.34 3.02.89 3.57.83.56-.06 1.78-.72 2.03-1.42.25-.7.25-1.3.18-1.42-.07-.12-.27-.2-.57-.35z" fill="#fff"/>
            </svg>
            <span class="sr-only">WhatsApp</span>
          </button>
        </div>
      </div>
      
      {/* Estadísticas detalladas por alumno (solo en vista 'all') */}
      {isMultiAlumno && selectedView === 'all' && Object.keys(estatsPorAlumno).length > 0 && (
        <div class="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">📊 Estadísticas por Alumno</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(estatsPorAlumno).map(([alumnoId, stats]) => (
              <div key={alumnoId} class="bg-white rounded-lg border p-3">
                <h4 class="font-medium text-gray-800 mb-2">{stats.nombre}</h4>
                <div class="flex justify-between items-center text-sm">
                  <div class="flex gap-4">
                    <span class="text-green-600">✓ {stats.presentes}</span>
                    <span class="text-red-600">✗ {stats.faltas}</span>
                    <span class="text-gray-600">⏳ {stats.pendientes}</span>
                  </div>
                  <div class="text-gray-500">Total: {stats.total}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No hay asistencias cuando no hay alumnos o están cargando */}
      {(!isMultiAlumno && !alumno && !loading) && (
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div class="text-yellow-800 text-lg font-medium mb-2">
            No se encontraron datos de alumno
          </div>
          <p class="text-yellow-600 text-sm">
            No se pudo cargar la información del alumno asociado a tu cuenta.
          </p>
        </div>
      )}

      {/* Regular content - mostrar siempre */}
      {((!isMultiAlumno) || (isMultiAlumno && alumnos.length > 0)) && (
        <>
          <div class="mb-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <label class="text-sm">Estado</label>
        <select value={estadoFilter} onChange={e => { setEstadoFilter(e.target.value); setPage(1); }} class="border rounded px-2 py-2 w-full sm:w-auto">
          <option>Todas</option>
          <option>Presente</option>
          <option>Falta</option>
          <option>Pendiente</option>
        </select>
        <button class="ml-0 sm:ml-3 mt-2 sm:mt-0 px-3 py-2 border rounded bg-gray-50 text-sm" onClick={() => { setEstadoFilter('Todas'); setPage(1); }}>Limpiar filtros</button>
      </div>

      <div class="mb-3 flex items-center gap-3">
        <label class="text-sm">Mostrar</label>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} class="border rounded px-2 py-1">
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
        <div class="ml-auto text-sm">Página {page} / {totalPages}</div>
      </div>

      <div class="overflow-x-auto">
        <div class="grid gap-3">
          {current.map((a, idx) => {
            const globalIndex = meta ? ((meta.page - 1) * meta.pageSize) + (idx + 1) : (idx + 1);
            return (
              <div key={a.id} class="p-3 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div class="w-full sm:w-3/4">
                  <div class="flex items-center gap-3 mb-1">
                    <div class="text-sm text-gray-500">#{globalIndex}</div>
                    <div class="font-medium">{getWeekdayName(a.fecha)} {a.fecha} · {a.hora}</div>
                    {/* Mostrar nombre del alumno en vista multi-alumno */}
                    {isMultiAlumno && selectedView === 'all' && (
                      <div class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {a.alumnoNombre}
                      </div>
                    )}
                  </div>
                  <div class="text-sm text-gray-600">{a.observaciones || '-'}</div>
                </div>
                <div class="w-full sm:w-1/4 text-right mt-3 sm:mt-0">
                  <span class={`inline-block px-3 py-2 rounded-full text-sm font-semibold ${a.estado === 'Presente' ? 'bg-green-100 text-green-800' : a.estado === 'Falta' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {a.estado}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between">
        <div>
          <button class="px-3 py-1 border rounded mr-2" onClick={() => setPage(Math.max(1, page-1))} disabled={page===1}>Anterior</button>
          <button class="px-3 py-1 border rounded" onClick={() => setPage(Math.min(totalPages, page+1))} disabled={page===totalPages}>Siguiente</button>
        </div>
        <div class="text-sm text-gray-600">Mostrando {current.length} de {total} registros</div>
      </div>
        </>
      )}
    </div>
  );
}
