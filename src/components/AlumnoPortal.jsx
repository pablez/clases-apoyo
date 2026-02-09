import { h } from 'preact';
import { useEffect, useState, useMemo } from 'preact/hooks';

export default function AlumnoPortal({ apiBaseUrl = '/api' }) {
  const [asistencias, setAsistencias] = useState([]);
  const [meta, setMeta] = useState(null);
  const [alumno, setAlumno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [estadoFilter, setEstadoFilter] = useState('Todas');
  

  useEffect(() => {
    // debug markers removed in production patch

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = (() => {
          try { return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'); } catch (e) { return null; }
        })();
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        if (estadoFilter && estadoFilter !== 'Todas') params.set('estado', estadoFilter);
        const url = `${apiBaseUrl}/alumno/asistencias?${params.toString()}`;
        const init = token ? { headers: { Authorization: `Bearer ${token}` } } : { credentials: 'include' };
        const res = await fetch(url, init);
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (!res.ok) throw new Error('Error al obtener asistencias');
        const payload = await res.json();
        const list = Array.isArray(payload.data) ? payload.data : payload || [];
        if (payload && payload.meta) setMeta(payload.meta);
        if (payload && payload.alumno) setAlumno(payload.alumno);
        const normalized = list.map(a => ({
          id: a.id || a.id_asistencia || `${a.fecha}-${a.hora}`,
          fecha: a.fecha,
          hora: a.hora,
          estado: a.estado,
          observaciones: a.observaciones || a.observacion || ''
        }));
        // sort desc by fecha
        normalized.sort((x, y) => (x.fecha < y.fecha ? 1 : -1));
        setAsistencias(normalized);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [estadoFilter, page, pageSize]);

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

  if (loading) return (
    <div class="max-w-4xl mx-auto mt-8 p-4 bg-white rounded shadow">
      <div class="animate-pulse">
        <div class="h-6 bg-gray-200 rounded w-3/5 mb-2"></div>
        <div class="h-4 bg-gray-200 rounded w-2/5 mb-4"></div>
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
          {alumno ? (
            <div class="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded">
              <div><strong>Estudiante:</strong> {alumno.nombre}</div>
              <div><strong>Materias:</strong> {Array.isArray(alumno.materias) ? alumno.materias.join(', ') : (alumno.materias || '-')}</div>
              <div><strong>Total clases:</strong> {alumno.clases_compradas ?? 0}</div>
            </div>
          ) : null}
        </div>
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
          <button
            class="bg-white border border-gray-200 px-3 py-2 rounded-md text-sm hover:shadow-md flex items-center gap-2"
            onClick={() => {
              try {
                const number = '59174325440';
                const mensaje = `Hola, necesito mi listado de asistencias. Estudiante: ${alumno ? alumno.nombre : ''}`;
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
    </div>
  );
}
