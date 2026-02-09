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
  const [fechaFrom, setFechaFrom] = useState('');
  const [fechaTo, setFechaTo] = useState('');

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
        params.set('page', '1');
        params.set('pageSize', '100');
        if (estadoFilter && estadoFilter !== 'Todas') params.set('estado', estadoFilter);
        if (fechaFrom) params.set('fechaFrom', fechaFrom);
        if (fechaTo) params.set('fechaTo', fechaTo);
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
  }, []);

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
    <div class="max-w-4xl mx-auto mt-8 p-4 bg-white rounded shadow">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 class="text-2xl font-semibold">Mi historial de asistencias</h2>
          <p class="text-sm text-gray-500">Resumen de tus asistencias por estado</p>
          {alumno ? (
            <div class="mt-2 text-sm text-gray-700">
              <div><strong>Estudiante:</strong> {alumno.nombre}</div>
              <div><strong>Materias:</strong> {Array.isArray(alumno.materias) ? alumno.materias.join(', ') : (alumno.materias || '-')}</div>
              <div><strong>Total clases:</strong> {alumno.clases_compradas ?? 0}</div>
            </div>
          ) : null}
        </div>
        <div class="flex items-center gap-4">
            <div class="text-center px-3">
            <div class="text-xl font-bold">{presentes}</div>
            <div class="text-xs text-green-600">Presentes</div>
          </div>
          <div class="text-center px-3">
            <div class="text-xl font-bold">{faltas}</div>
            <div class="text-xs text-red-600">Faltas</div>
          </div>
          <div class="text-center px-3">
            <div class="text-xl font-bold">{pendientes}</div>
            <div class="text-xs text-gray-600">Pendientes</div>
          </div>
          <button class="bg-blue-600 text-white px-3 py-1 rounded text-sm" onClick={exportCsv}>Exportar CSV</button>
        </div>
      </div>
      <div class="mb-3 flex items-center gap-3">
        <label class="text-sm">Estado</label>
        <select value={estadoFilter} onChange={e => { setEstadoFilter(e.target.value); setPage(1); }} class="border rounded px-2 py-1">
          <option>Todas</option>
          <option>Presente</option>
          <option>Falta</option>
          <option>Pendiente</option>
        </select>
        <label class="text-sm ml-3">Desde</label>
        <input type="date" value={fechaFrom} onChange={e => { setFechaFrom(e.target.value.split('-').reverse().join('/')); setPage(1); }} class="border rounded px-2 py-1" />
        <label class="text-sm ml-3">Hasta</label>
        <input type="date" value={fechaTo} onChange={e => { setFechaTo(e.target.value.split('-').reverse().join('/')); setPage(1); }} class="border rounded px-2 py-1" />
        <button class="ml-3 px-2 py-1 border rounded" onClick={() => { setEstadoFilter('Todas'); setFechaFrom(''); setFechaTo(''); setPage(1); }}>Limpiar filtros</button>
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
              <div key={a.id} class="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-3">
                    <div class="text-sm text-gray-500">#{globalIndex}</div>
                    <div class="font-medium">{getWeekdayName(a.fecha)} {a.fecha} · {a.hora}</div>
                  </div>
                  <div class="text-sm text-gray-600">{a.observaciones || '-'}</div>
                </div>
                <div class="text-right">
                  <span class={`px-3 py-1 rounded-full text-sm font-semibold ${a.estado === 'Presente' ? 'bg-green-100 text-green-800' : a.estado === 'Falta' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
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
