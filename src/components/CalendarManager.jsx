import { useState, useEffect } from 'preact/hooks';

export default function CalendarManager({ apiBaseUrl = '/api' }) {
  const [asistencias, setAsistencias] = useState([]);
  const [alumnosMap, setAlumnosMap] = useState({});
  const [alumnosList, setAlumnosList] = useState([]);
  const [detail, setDetail] = useState({ open: false, date: null, hour: null, items: [] });
  const [reserveModal, setReserveModal] = useState({ open: false, date: null, hour: null });
  const [savingReservation, setSavingReservation] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, +/- weeks
  const [cancellingId, setCancellingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAsistencias();
  }, []);

  async function loadAsistencias() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/asistencias`);
      if (!res.ok) throw new Error('Error cargando asistencias');
      const data = await res.json();
      setAsistencias(data || []);
      // fetch alumnos to map id -> datos
      try {
        const ra = await fetch(`${apiBaseUrl}/alumnos`);
        if (ra.ok) {
          const al = await ra.json();
          const map = {};
          (al || []).forEach(a => map[String(a.id || a.id_alumno || a.id_alumno)] = a);
          setAlumnosMap(map);
          setAlumnosList(al || []);
        }
      } catch (e) {
        // ignore alumnos fetch error, detalle seguirá mostrando id
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Helpers
  function parseFecha(fechaStr) {
    // acepta DD/MM/YYYY o YYYY-MM-DD
    if (!fechaStr) return null;
    if (/\d{2}\/\d{2}\/\d{4}/.test(fechaStr)) {
      const [d, m, y] = fechaStr.split('/').map(Number);
      return new Date(y, m - 1, d);
    }
    // ISO
    const d = new Date(fechaStr);
    return isNaN(d) ? null : d;
  }

  function formatDDMMYYYY(d) {
    if (!d) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  function formatDayLabel(d) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
  }

  // Build occupied map: key = 'DD/MM/YYYY' -> Map of 'HH:MM' -> [asistencia...]
  const occupied = {};
  asistencias.forEach(a => {
    const fecha = a.fecha || a.date || null; // conserva compatibilidad
    const hora = a.hora || a.time || '';
    const d = parseFecha(fecha);
    if (!d) return;
    const key = formatDDMMYYYY(d);
    if (!occupied[key]) occupied[key] = new Map();
    const m = hora && hora.toString().trim();
    if (m) {
      const parts = m.split(':');
      let hh = parts[0] || '00';
      let mm = parts[1] || '00';
      hh = hh.padStart(2, '0');
      mm = mm.padStart(2, '0');
      const slot = `${hh}:${mm}`;
      if (!occupied[key].has(slot)) occupied[key].set(slot, []);
      occupied[key].get(slot).push(a);
    }
  });

  // Generate days: Monday..Saturday of week based on weekOffset
  const today = new Date();
  const ref = new Date(today);
  if (weekOffset && Number.isFinite(weekOffset)) ref.setDate(ref.getDate() + weekOffset * 7);
  // find Monday relative to ref
  const monday = new Date(ref);
  const dayIndex = monday.getDay(); // 0..6 (Sun..Sat)
  const diffToMonday = (dayIndex + 6) % 7; // days to subtract to get Monday
  monday.setDate(monday.getDate() - diffToMonday);
  const days = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  // Hours union 08..20 (we'll render rows 08..20 but disable cells outside allowed range)
  const hours = Array.from({ length: 13 }).map((_, i) => 8 + i); // 08..20

  function isOccupied(d, hour) {
    const key = formatDDMMYYYY(d);
    const hh = String(hour).padStart(2, '0');
    const slot = `${hh}:00`;
    return occupied[key] && occupied[key].has(slot);
  }

  function getAsistenciasForSlot(d, hour) {
    const key = formatDDMMYYYY(d);
    const hh = String(hour).padStart(2, '0');
    const slot = `${hh}:00`;
    if (occupied[key] && occupied[key].has(slot)) return occupied[key].get(slot);
    return [];
  }

  function isSlotAvailableForDay(d, hour) {
    // Monday..Friday: 11..20 ; Saturday: 8..18
    const wd = d.getDay(); // 0 Sun..6 Sat
    if (wd === 6) { // Saturday
      return hour >= 8 && hour <= 18;
    }
    // Monday..Friday -> day indices 1..5
    return hour >= 11 && hour <= 20;
  }

    function handleCopySlot(d, hour) {
    const key = formatDDMMYYYY(d);
    const hh = String(hour).padStart(2, '0');
    // Open reserve modal with alumnos list
    setReserveModal({ open: true, date: key, hour: `${hh}:00` });
  }

    async function assignAlumno(alumno) {
      if (!reserveModal.open) return;
      setSavingReservation(true);
      try {
        const payload = {
          id_alumno: alumno.id || alumno.id_alumno,
          fecha: reserveModal.date,
          hora: reserveModal.hour,
          estado: 'Reservado',
          observaciones: 'Reserva automática desde calendario'
        };
        const res = await fetch(`${apiBaseUrl}/asistencias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          let err = 'Error al crear reserva';
          try { const d = await res.json(); if (d && d.error) err = d.error; } catch(e){}
          throw new Error(err);
        }
        // success
        alert('Reserva creada correctamente');
        setReserveModal({ open: false, date: null, hour: null });
        await loadAsistencias();
      } catch (e) {
        alert(e.message || 'Error creando reserva');
      } finally {
        setSavingReservation(false);
      }
    }

  return (
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h2 class="text-lg font-bold">Calendario — Disponibilidad</h2>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <button aria-label="Semana anterior" onClick={() => setWeekOffset(w => w - 1)} class="p-2 sm:px-2 sm:py-1 bg-gray-100 rounded hover:bg-gray-200 text-xs sm:text-sm">◀</button>
            <div class="text-sm text-gray-700 truncate max-w-[9rem] sm:max-w-none">{formatDDMMYYYY(days[0])} — {formatDDMMYYYY(days[days.length - 1])}</div>
            <button aria-label="Semana siguiente" onClick={() => setWeekOffset(w => w + 1)} class="p-2 sm:px-2 sm:py-1 bg-gray-100 rounded hover:bg-gray-200 text-xs sm:text-sm">▶</button>
          </div>
          <button onClick={loadAsistencias} class="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1 bg-blue-600 text-white rounded text-xs sm:text-sm">
            <span class="sm:hidden">↻</span>
            <span class="hidden sm:inline">↻ Recargar</span>
          </button>
        </div>
      </div>

      {loading && <p class="text-gray-500">Cargando calendario...</p>}
      {error && <div class="text-red-600">Error: {error}</div>}

      {!loading && !error && (
        <>
          {/* Desktop grid */}
          <div class="hidden sm:grid grid-cols-6 gap-2">
            {/* header */}
            {days.map(d => (
              <div key={d.toDateString()} class="text-center font-medium text-sm">{formatDayLabel(d)}</div>
            ))}

            {/* rows: each hour */}
            {hours.map(hour => (
              days.map(d => {
                const inRange = isSlotAvailableForDay(d, hour);
                const occ = isOccupied(d, hour);
                const keyCell = `${d.toDateString()}-${hour}`;
                return (
                  <div key={keyCell} onContextMenu={(e) => {
                    if (occ) {
                      e.preventDefault();
                      const items = getAsistenciasForSlot(d, hour);
                      setDetail({ open: true, date: formatDDMMYYYY(d), hour: `${String(hour).padStart(2,'0')}:00`, items });
                    }
                  }} class={`p-2 border rounded text-center text-xs ${!inRange ? 'bg-gray-50 text-gray-300' : (occ ? 'bg-red-100 text-red-800' : 'bg-green-50 text-green-800')} ${inRange ? 'hover:shadow-sm' : ''}`}> 
                    <div class="font-semibold">{String(hour).padStart(2, '0')}:00</div>
                    <div class="mt-1">
                      {!inRange ? '—' : (occ ? 'Ocupado' : (
                        <button onClick={() => handleCopySlot(d, hour)} class="text-xs text-blue-600 underline">Reservar</button>
                      ))}
                    </div>
                  </div>
                );
              })
            ))}
          </div>

          {/* Mobile: day cards */}
          <div class="block sm:hidden space-y-3">
            {days.map(d => {
              const key = formatDDMMYYYY(d);
              return (
                <div key={d.toDateString()} class="border rounded p-3">
                  <div class="flex justify-between items-center mb-2">
                    <div>
                      <div class="font-semibold">{formatDayLabel(d)}</div>
                      <div class="text-xs text-gray-500">{key}</div>
                    </div>
                    <div class="text-xs text-gray-600">{/* reserved count */}
                      {occupied[key] ? `${[...occupied[key].keys()].length} ocupadas` : 'Libre'}
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    {hours.map(hour => {
                      const inRange = isSlotAvailableForDay(d, hour);
                      const occ = isOccupied(d, hour);
                      return (
                        <button key={`${key}-${hour}`} onClick={() => inRange && !occ && handleCopySlot(d, hour)} onContextMenu={(e) => {
                          if (occ) {
                            e.preventDefault();
                            const items = getAsistenciasForSlot(d, hour);
                            setDetail({ open: true, date: key, hour: `${String(hour).padStart(2,'0')}:00`, items });
                          }
                        }} class={`px-2 py-1 rounded text-xs ${!inRange ? 'bg-gray-50 text-gray-300' : (occ ? 'bg-red-100 text-red-800' : 'bg-green-50 text-green-800')} ${inRange && !occ ? 'hover:bg-green-200' : ''}`}>
                          {String(hour).padStart(2, '0')}:00 {occ ? '•' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div class="mt-4 text-xs text-gray-500">
        Haz clic en "Reservar" para copiar la fecha y hora al portapapeles y pegarla en el formulario de inscripción.
      </div>
      {/* Detail modal / panel */}
      {detail.open && (
        <div class="fixed inset-0 flex items-end sm:items-center justify-center p-4 pointer-events-auto">
          <div class="bg-white border rounded-lg shadow-lg w-full sm:max-w-md p-4">
            <div class="flex justify-between items-center mb-2">
              <div>
                <div class="font-semibold">Detalles — {detail.date} {detail.hour}</div>
                <div class="text-xs text-gray-500">Ocupado(s): {detail.items.length}</div>
              </div>
              <button onClick={() => setDetail({ open: false, date: null, hour: null, items: [] })} class="text-gray-500">✖</button>
            </div>
            <div class="space-y-2 text-sm">
              {detail.items.map(a => {
                const alumno = alumnosMap[String(a.id_alumno)];
                return (
                  <div key={a.id} class="p-2 border rounded">
                    <div class="font-medium">{alumno ? (alumno.nombre || alumno.nombre_completo || `${alumno.id}`) : `Alumno ID: ${a.id_alumno}`}</div>
                    <div class="text-xs text-gray-600">Estado: {a.estado || 'N/A'}</div>
                    {alumno && alumno.telefono_padre && <div class="text-xs text-gray-600">Tel: {alumno.telefono_padre}</div>}
                    {alumno && (alumno.curso || alumno.curso_escolar) && <div class="text-xs text-gray-600">Curso: {alumno.curso || alumno.curso_escolar}</div>}
                    <div class="mt-2 flex gap-2">
                      <button onClick={async () => {
                        if (!confirm('¿Cancelar esta reserva?')) return;
                        setCancellingId(a.id);
                        try {
                          const res = await fetch(`${apiBaseUrl}/asistencias/${a.id}`, { method: 'DELETE' });
                          if (!res.ok) {
                            const d = await res.json().catch(()=>null);
                            throw new Error((d && d.error) || 'Error cancelando reserva');
                          }
                          // actualiza lista
                          await loadAsistencias();
                          // actualizar detalle: filtrar items
                          setDetail(prev => ({ ...prev, items: prev.items.filter(it => String(it.id) !== String(a.id)) }));
                        } catch (e) {
                          alert(e.message || 'Error cancelando reserva');
                        } finally {
                          setCancellingId(null);
                        }
                      }} class="px-3 py-1 bg-red-600 text-white rounded text-xs" disabled={cancellingId === a.id}>
                        {cancellingId === a.id ? 'Cancelando...' : 'Cancelar reserva'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Reserve modal: lista de alumnos + crear nuevo */}
      {reserveModal.open && (
        <div class="fixed inset-0 flex items-end sm:items-center justify-center p-4 pointer-events-auto">
          <div class="bg-white border rounded-lg shadow-lg w-full sm:max-w-2xl p-4">
            <div class="flex justify-between items-center mb-3">
              <div>
                <div class="font-semibold">Reservar — {reserveModal.date} {reserveModal.hour}</div>
                <div class="text-xs text-gray-500">Selecciona un alumno existente o crea uno nuevo</div>
              </div>
              <button onClick={() => setReserveModal({ open: false, date: null, hour: null })} class="text-gray-500">✖</button>
            </div>
            <div class="flex gap-4">
              <div class="flex-1 max-h-64 overflow-auto">
                {alumnosList.length === 0 && <div class="text-gray-500">No hay alumnos registrados</div>}
                {alumnosList.map(al => (
                  <div key={al.id || al.id_alumno} class="p-2 border-b flex items-center justify-between">
                    <div>
                      <div class="font-medium">{al.nombre || al.nombre_completo || `ID ${al.id || al.id_alumno}`}</div>
                      <div class="text-xs text-gray-500">{al.curso || ''} · {al.telefono_padre || ''}</div>
                    </div>
                    <div class="flex gap-2">
                      <button onClick={() => assignAlumno(al)} disabled={savingReservation} class="px-3 py-1 bg-blue-600 text-white rounded text-xs">
                        {savingReservation ? 'Guardando...' : 'Seleccionar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div class="w-44">
                <div class="mb-2 text-sm font-medium">Acciones</div>
                <button onClick={() => {
                  const tabBtn = document.querySelector('.tab-button[data-tab="alumnos"]'); if (tabBtn) tabBtn.click();
                  window.dispatchEvent(new CustomEvent('calendar-reserve', { detail: { date: reserveModal.date, hour: reserveModal.hour } }));
                  setReserveModal({ open: false, date: null, hour: null });
                }} class="w-full px-3 py-2 bg-green-600 text-white rounded">Crear nuevo alumno</button>
                <button onClick={() => setReserveModal({ open: false, date: null, hour: null })} class="w-full mt-2 px-3 py-2 bg-gray-200 rounded">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
