import { useState, useEffect } from 'preact/hooks';

export default function AttendanceManager({ apiBaseUrl = '/api' }) {
  const [alumnos, setAlumnos] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [selectedAlumnoId, setSelectedAlumnoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingObservation, setEditingObservation] = useState(null);
  const [observationText, setObservationText] = useState('');
  const [editingDateTime, setEditingDateTime] = useState(null); // ID de asistencia en edición
  const [editFecha, setEditFecha] = useState('');
  const [editHora, setEditHora] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedTime, setSelectedTime] = useState('15:00');
  const [currentMonth, setCurrentMonth] = useState(0); // 0-11 para meses de 2026
  const [todasAsistencias, setTodasAsistencias] = useState([]);
  const [showDateDetails, setShowDateDetails] = useState(null); // Fecha seleccionada para ver detalles

  useEffect(() => {
    loadAlumnos();
  }, []);

  useEffect(() => {
    if (selectedAlumnoId) {
      loadAsistencias(selectedAlumnoId);
    } else {
      setAsistencias([]);
    }
  }, [selectedAlumnoId]);

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

  async function loadAsistencias(alumnoId) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/asistencias?alumnoId=${alumnoId}`);
      if (!res.ok) throw new Error('Error al cargar asistencias');
      const data = await res.json();
      
      // Ordenar por fecha (más reciente primero o más antigua primero)
      const sortedData = data.sort((a, b) => {
        const dateA = parseDateString(a.fecha);
        const dateB = parseDateString(b.fecha);
        return dateA - dateB; // Orden ascendente (más antigua primero)
      });
      
      setAsistencias(sortedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function parseDateString(dateStr) {
    // Convierte "22/01/2026" a objeto Date
    if (!dateStr) return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date(0);
    // parts[0] = día, parts[1] = mes, parts[2] = año
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }

  async function updateAsistencia(id, estado) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/asistencias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) throw new Error('Error al actualizar asistencia');
      // Recargar asistencias
      await loadAsistencias(selectedAlumnoId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveObservation(id) {
    if (!observationText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/asistencias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observaciones: observationText }),
      });
      if (!res.ok) throw new Error('Error al actualizar observación');
      await loadAsistencias(selectedAlumnoId);
      setEditingObservation(null);
      setObservationText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function generarFechasClases() {
    if (!selectedAlumno) return;
    
    const clasesPorGenerar = selectedAlumno.clases_compradas - asistencias.length;
    if (clasesPorGenerar <= 0) {
      setError('Ya se generaron todas las fechas de clases para este alumno');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Cargar todas las asistencias del sistema para visualizarlas
    try {
      const res = await fetch(`${apiBaseUrl}/asistencias`);
      if (res.ok) {
        const data = await res.json();
        // Ordenar por fecha
        const sortedData = data.sort((a, b) => {
          const dateA = parseDateString(a.fecha);
          const dateB = parseDateString(b.fecha);
          return dateA - dateB;
        });
        setTodasAsistencias(sortedData);
      }
    } catch (err) {
      console.error('Error al cargar asistencias:', err);
    }

    // Abrir el selector de calendario
    setSelectedDates([]);
    setCurrentMonth(new Date().getMonth()); // Empezar en el mes actual
    setShowCalendar(true);
  }

  function toggleDateSelection(dateString) {
    setSelectedDates(prev => {
      if (prev.includes(dateString)) {
        return prev.filter(d => d !== dateString);
      } else {
        const clasesPorGenerar = selectedAlumno.clases_compradas - asistencias.length;
        if (prev.length >= clasesPorGenerar) {
          setError(`Solo puedes seleccionar ${clasesPorGenerar} fechas`);
          setTimeout(() => setError(null), 2000);
          return prev;
        }
        return [...prev, dateString].sort();
      }
    });
  }

  async function guardarFechasSeleccionadas() {
    if (selectedDates.length === 0) {
      setError('Selecciona al menos una fecha');
      setTimeout(() => setError(null), 2000);
      return;
    }

    console.log('📅 Fechas seleccionadas a guardar:', selectedDates);
    console.log('🔢 Total de fechas:', selectedDates.length);

    const clasesPorGenerar = selectedAlumno.clases_compradas - asistencias.length;
    const confirmar = confirm(
      `¿Guardar ${selectedDates.length} fechas de clases para ${selectedAlumno.nombre}?\n\n` +
      `Fechas seleccionadas:\n${selectedDates.join('\n')}`
    );
    if (!confirmar) return;

    setLoading(true);
    setError(null);
    try {
      console.log('🚀 Iniciando guardado de asistencias de forma secuencial...');
      
      const resultados = [];
      
      // Guardar una por una en secuencia para evitar conflictos de filas
      for (let index = 0; index < selectedDates.length; index++) {
        const fecha = selectedDates[index];
        const nuevaAsistencia = {
          id_alumno: selectedAlumno.id,
          fecha: fecha,
          hora: selectedTime,
          estado: 'Pendiente',
          observaciones: 'Clase programada',
          materia: selectedAlumno.materias && selectedAlumno.materias.length > 0 ? selectedAlumno.materias[0] : ''
        };

        console.log(`📝 Creando asistencia ${index + 1}/${selectedDates.length}:`, nuevaAsistencia);

        const res = await fetch(`${apiBaseUrl}/asistencias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevaAsistencia),
        });
        
        const data = await res.json();
        if (!res.ok) {
          console.error('❌ Error en respuesta:', data);
          throw new Error(`Error al crear asistencia para ${fecha}: ${data.error || 'Error desconocido'}`);
        }
        console.log(`✅ Asistencia ${index + 1} guardada:`, data);
        resultados.push(data);
      }
      
      console.log('✅ Todas las asistencias guardadas:', resultados);
      
      await loadAsistencias(selectedAlumnoId);
      setShowCalendar(false);
      setSelectedDates([]);
      alert(`✅ Se guardaron ${resultados.length} fechas de clases correctamente`);
    } catch (err) {
      console.error('❌ Error al guardar asistencias:', err);
      setError(err.message);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function generateCalendarMonth(monthIndex) {
    const year = 2026;
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Domingo
    
    const days = [];
    
    // Agregar días vacíos al inicio
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Agregar todos los días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, monthIndex, day));
    }
    
    return days;
  }

  function getMonthName(monthIndex) {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex];
  }

  function formatDateForDisplay(date) {
    if (!date) return '';
    return date.getDate();
  }

  function formatDateForSave(date) {
    if (!date) return '';
    return date.toLocaleDateString('es-BO', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function getAsistenciasForDate(dateString) {
    return todasAsistencias.filter(a => a.fecha === dateString);
  }

  function getAlumnoNombre(alumnoId) {
    const alumno = alumnos.find(a => String(a.id) === String(alumnoId));
    return alumno ? alumno.nombre : 'Desconocido';
  }

  async function eliminarAsistencia(asistenciaId) {
    const confirmar = confirm('¿Estás seguro de eliminar esta asistencia?');
    if (!confirmar) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/asistencias/${asistenciaId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Error al eliminar asistencia');
      
      // Recargar todas las asistencias
      const resAll = await fetch(`${apiBaseUrl}/asistencias`);
      if (resAll.ok) {
        const data = await resAll.json();
        const sortedData = data.sort((a, b) => {
          const dateA = parseDateString(a.fecha);
          const dateB = parseDateString(b.fecha);
          return dateA - dateB;
        });
        setTodasAsistencias(sortedData);
      }
      
      // Recargar asistencias del alumno actual si está seleccionado
      if (selectedAlumnoId) {
        await loadAsistencias(selectedAlumnoId);
      }
      
      setShowDateDetails(null);
      alert('✅ Asistencia eliminada correctamente');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEditObservation(asistencia) {
    setEditingObservation(asistencia.id);
    setObservationText(asistencia.observaciones || '');
  }

  function startEditDateTime(asistencia) {
    setEditingDateTime(asistencia.id);
    // Convertir fecha DD/MM/YYYY a YYYY-MM-DD para input type="date"
    const [day, month, year] = asistencia.fecha.split('/');
    setEditFecha(`${year}-${month}-${day}`);
    setEditHora(asistencia.hora || '15:00');
  }

  async function saveDateTime(asistenciaId) {
    if (!editFecha || !editHora) {
      setError('Debes seleccionar fecha y hora');
      setTimeout(() => setError(null), 2000);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Convertir fecha YYYY-MM-DD a DD/MM/YYYY
      const [year, month, day] = editFecha.split('-');
      const fechaFormateada = `${day}/${month}/${year}`;

      const res = await fetch(`${apiBaseUrl}/asistencias/${asistenciaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: fechaFormateada,
          hora: editHora
        }),
      });

      if (!res.ok) throw new Error('Error al actualizar fecha y hora');
      
      await loadAsistencias(selectedAlumnoId);
      setEditingDateTime(null);
      setEditFecha('');
      setEditHora('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function calcularSesionesRestantes(alumno) {
    if (!alumno) return 0;
    const presentes = asistencias.filter(a => a.estado === 'Presente').length;
    return (alumno.clases_compradas || 0) - presentes;
  }

  const selectedAlumno = alumnos.find(a => String(a.id) === String(selectedAlumnoId));

  return (
    <div class="space-y-6">
      {error && (
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold mb-4">Seleccionar Alumno</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alumnos.map(alumno => (
            <button
              key={alumno.id}
              onClick={() => setSelectedAlumnoId(alumno.id)}
              class={`p-4 rounded-lg border-2 transition text-left ${
                String(selectedAlumnoId) === String(alumno.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div class="font-semibold">{alumno.nombre}</div>
              <div class="text-sm text-gray-600">
                Curso: {alumno.curso || 'N/A'}
              </div>
              <div class="text-sm text-gray-600">
                Clases: {alumno.clases_compradas || 0}
              </div>
              {alumno.horas && (
                <div class="text-sm text-purple-600 font-medium">
                  ⏱ {alumno.horas}
                </div>
              )}
              {alumno.materias && alumno.materias.length > 0 && (
                <div class="text-xs text-gray-500 mt-1">
                  {alumno.materias.join(', ')}
                </div>
              )}
            </button>
          ))}
        </div>
        {alumnos.length === 0 && !loading && (
          <p class="text-gray-500 text-center py-4">No hay alumnos disponibles</p>
        )}
      </div>

      {selectedAlumno && (
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h2 class="text-xl font-bold">{selectedAlumno.nombre}</h2>
              <p class="text-sm text-gray-600">
                Curso: {selectedAlumno.curso || 'N/A'} | Edad: {selectedAlumno.edad || 'N/A'}
              </p>
              <p class="text-sm text-gray-600">
                Teléfono: {selectedAlumno.telefono_padre || 'N/A'}
              </p>
              <p class="text-sm text-gray-600">
                Clases compradas: {selectedAlumno.clases_compradas || 0}
              </p>
              {selectedAlumno.horas && (
                <p class="text-sm text-purple-600 font-medium">
                  ⏱ Duración: {selectedAlumno.horas}
                </p>
              )}
              {selectedAlumno.materias && selectedAlumno.materias.length > 0 && (
                <p class="text-sm text-blue-600 mt-1">
                  Materias: {selectedAlumno.materias.join(', ')}
                </p>
              )}
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-green-600">
                {calcularSesionesRestantes(selectedAlumno)}
              </div>
              <div class="text-sm text-gray-600">Sesiones restantes</div>
            </div>
          </div>

          <div class="flex justify-between items-center mb-3">
            <h3 class="font-semibold">Registro de Asistencia</h3>
            {selectedAlumno.clases_compradas > asistencias.length && (
              <button
                onClick={generarFechasClases}
                disabled={loading}
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
              >
                <span>📅</span>
                Seleccionar fechas ({selectedAlumno.clases_compradas - asistencias.length} clases)
              </button>
            )}
          </div>

          {/* Modal de Calendario */}
          {showCalendar && (
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div class="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
                <div class="flex justify-between items-start mb-3 sm:mb-4">
                  <div class="flex-1 mr-2">
                    <h2 class="text-base sm:text-xl font-bold">Calendario 2026</h2>
                    <p class="text-xs sm:text-sm text-gray-600 mt-1">
                      {selectedAlumno.nombre}
                    </p>
                    <p class="text-xs sm:text-sm text-gray-600">
                      Pendientes: {selectedAlumno.clases_compradas - asistencias.length}
                    </p>
                    <p class="text-xs sm:text-sm text-blue-600 font-medium mt-1">
                      ✓ {selectedDates.length} / {selectedAlumno.clases_compradas - asistencias.length}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCalendar(false);
                      setSelectedDates([]);
                    }}
                    class="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0"
                  >
                    ×
                  </button>
                </div>

                {/* Selector de hora */}
                <div class="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <label class="text-xs sm:text-sm font-medium">Hora:</label>
                  <input
                    type="time"
                    value={selectedTime}
                    onInput={(e) => setSelectedTime(e.target.value)}
                    class="px-2 sm:px-3 py-1 sm:py-2 border rounded text-sm w-full sm:w-auto"
                  />
                </div>

                {/* Navegación de meses */}
                <div class="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                  <button
                    onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))}
                    disabled={currentMonth === 0}
                    class="px-2 sm:px-4 py-1 sm:py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  >
                    <span class="hidden sm:inline">← Anterior</span>
                    <span class="sm:hidden">←</span>
                  </button>
                  <h3 class="text-sm sm:text-lg font-bold text-center flex-1">{getMonthName(currentMonth)} 2026</h3>
                  <button
                    onClick={() => setCurrentMonth(Math.min(11, currentMonth + 1))}
                    disabled={currentMonth === 11}
                    class="px-2 sm:px-4 py-1 sm:py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                  >
                    <span class="hidden sm:inline">Siguiente →</span>
                    <span class="sm:hidden">→</span>
                  </button>
                </div>

                {/* Leyenda */}
                <div class="mb-2 sm:mb-3 flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs">
                  <div class="flex items-center gap-1">
                    <div class="w-3 h-3 sm:w-4 sm:h-4 bg-blue-600 rounded"></div>
                    <span>Seleccionado</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <div class="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                    <span>Con asist.</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <div class="w-3 h-3 sm:w-4 sm:h-4 bg-gray-100 rounded"></div>
                    <span>Pasado</span>
                  </div>
                </div>

                {/* Calendario mensual */}
                <div class="mb-3 sm:mb-4">
                  {/* Encabezados de días */}
                  <div class="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                      <div key={day} class="text-center text-[9px] sm:text-xs font-bold text-gray-600 py-0.5 sm:py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Días del mes */}
                  <div class="grid grid-cols-7 gap-0.5 sm:gap-1">
                    {generateCalendarMonth(currentMonth).map((date, idx) => {
                      if (!date) {
                        return <div key={`empty-${idx}`} class="aspect-square"></div>;
                      }
                      
                      const dateString = formatDateForSave(date);
                      const isSelected = selectedDates.includes(dateString);
                      const isPast = date < new Date().setHours(0, 0, 0, 0);
                      const asistenciasEnFecha = getAsistenciasForDate(dateString);
                      const tieneAsistencias = asistenciasEnFecha.length > 0;
                      
                      return (
                        <button
                          key={dateString}
                          onClick={() => !isPast && toggleDateSelection(dateString)}
                          onContextMenu={(e) => {
                            if (tieneAsistencias) {
                              e.preventDefault();
                              setShowDateDetails(dateString);
                            }
                          }}
                          disabled={isPast}
                          class={`aspect-square p-0.5 sm:p-1 rounded border sm:border-2 text-[10px] sm:text-sm transition relative ${
                            isPast
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                              : isSelected
                              ? 'bg-blue-600 text-white border-blue-600 font-bold'
                              : tieneAsistencias
                              ? 'bg-green-50 border-green-500 hover:border-green-600 cursor-pointer'
                              : 'bg-white hover:border-blue-300 border-gray-200'
                          }`}
                          title={tieneAsistencias ? `${asistenciasEnFecha.length} clase(s) - Clic derecho para ver detalles` : ''}
                        >
                          <div class="font-bold text-[10px] sm:text-sm">{formatDateForDisplay(date)}</div>
                          {tieneAsistencias && (
                            <div class="absolute bottom-0 left-0 right-0 text-[6px] sm:text-[8px] bg-green-600 text-white px-0.5 sm:px-1 rounded-b">
                              {asistenciasEnFecha.length}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Información de asistencias en fechas seleccionadas */}
                {selectedDates.length > 0 && (
                  <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 class="text-sm font-semibold mb-2">⚠️ Nota sobre fechas compartidas:</h4>
                    <p class="text-xs text-gray-700">
                      Puedes seleccionar fechas que ya tienen clases programadas. El sistema permite múltiples alumnos en el mismo día y hora.
                    </p>
                  </div>
                )}

                {/* Modal de detalles de fecha */}
                {showDateDetails && (
                  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg max-w-md w-full p-6">
                      <div class="flex justify-between items-start mb-4">
                        <div>
                          <h3 class="text-lg font-bold">Clases del {showDateDetails}</h3>
                          <p class="text-sm text-gray-600">
                            {getAsistenciasForDate(showDateDetails).length} clase(s) programada(s)
                          </p>
                        </div>
                        <button
                          onClick={() => setShowDateDetails(null)}
                          class="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                          ×
                        </button>
                      </div>
                      
                      <div class="space-y-2">
                        {getAsistenciasForDate(showDateDetails).map(asistencia => (
                          <div
                            key={asistencia.id}
                            class="p-3 border rounded flex justify-between items-center hover:bg-gray-50"
                          >
                            <div class="flex-1">
                              <div class="font-medium">
                                {getAlumnoNombre(asistencia.id_alumno)}
                              </div>
                              <div class="text-sm text-gray-600">
                                🕒 {asistencia.hora} | {asistencia.estado}
                              </div>
                              {asistencia.observaciones && (
                                <div class="text-xs text-gray-500 mt-1">
                                  {asistencia.observaciones}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => eliminarAsistencia(asistencia.id)}
                              disabled={loading}
                              class="ml-3 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setShowDateDetails(null)}
                        class="mt-4 w-full px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de fechas seleccionadas */}
                {selectedDates.length > 0 && (
                  <div class="mb-4 p-3 bg-blue-50 rounded">
                    <h4 class="text-sm font-semibold mb-2">Fechas seleccionadas:</h4>
                    <div class="flex flex-wrap gap-2">
                      {selectedDates.map(fecha => (
                        <span
                          key={fecha}
                          class="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-2"
                        >
                          {fecha}
                          <button
                            onClick={() => toggleDateSelection(fecha)}
                            class="hover:text-red-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={guardarFechasSeleccionadas}
                    disabled={loading || selectedDates.length === 0}
                    class="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
                  >
                    {loading ? 'Guardando...' : `Guardar ${selectedDates.length}`}
                  </button>
                  <button
                    onClick={() => {
                      setShowCalendar(false);
                      setSelectedDates([]);
                    }}
                    disabled={loading}
                    class="px-4 sm:px-6 py-2 sm:py-3 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
          {loading && <p class="text-gray-500">Cargando...</p>}
          
          {!loading && asistencias.length === 0 && (
            <p class="text-gray-500 text-center py-4">
              No hay registros de asistencia para este alumno
            </p>
          )}

          {!loading && asistencias.length > 0 && (
            <div class="space-y-2">
              {asistencias.map(asistencia => (
                <div
                  key={asistencia.id}
                  class="flex flex-col p-3 border rounded-lg"
                >
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex-1">
                      {editingDateTime === asistencia.id ? (
                        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2">
                          <input
                            type="date"
                            value={editFecha}
                            onInput={(e) => setEditFecha(e.target.value)}
                            class="px-2 py-1 border rounded text-sm flex-1"
                          />
                          <input
                            type="time"
                            value={editHora}
                            onInput={(e) => setEditHora(e.target.value)}
                            class="px-2 py-1 border rounded text-sm flex-1"
                          />
                          <div class="flex gap-2">
                            <button
                              onClick={() => saveDateTime(asistencia.id)}
                              disabled={loading}
                              class="flex-1 sm:flex-none px-3 sm:px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                            >
                              ✓ Guardar
                            </button>
                            <button
                              onClick={() => {
                                setEditingDateTime(null);
                                setEditFecha('');
                                setEditHora('');
                              }}
                              class="flex-1 sm:flex-none px-3 sm:px-2 py-1 bg-gray-300 rounded text-xs hover:bg-gray-400"
                            >
                              ✗ Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div class="flex items-center gap-2">
                            <div class="font-medium">{asistencia.fecha} - {asistencia.hora || 'N/A'}</div>
                            <button
                              onClick={() => startEditDateTime(asistencia)}
                              class="text-xs text-blue-600 hover:underline"
                              title="Editar fecha y hora"
                            >
                              ✏️
                            </button>
                          </div>
                        </div>
                      )}
                      <div class={`text-sm font-semibold ${
                        asistencia.estado === 'Presente' ? 'text-green-600' :
                        asistencia.estado === 'Falta' ? 'text-red-600' :
                        asistencia.estado === 'Modificado' ? 'text-orange-600' :
                        asistencia.estado === 'Pendiente' ? 'text-gray-500' :
                        'text-gray-600'
                      }`}>
                        {asistencia.estado}
                      </div>
                    </div>
                    <div class="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => updateAsistencia(asistencia.id, 'Presente')}
                        disabled={loading || asistencia.estado === 'Presente'}
                        class={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition ${
                          asistencia.estado === 'Presente'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 hover:bg-green-100'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        ✓ Presente
                      </button>
                      <button
                        onClick={() => updateAsistencia(asistencia.id, 'Falta')}
                        disabled={loading || asistencia.estado === 'Falta'}
                        class={`px-3 py-1 rounded text-sm transition ${
                          asistencia.estado === 'Falta'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 hover:bg-red-100'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        ✗ Falta
                      </button>
                      <button
                        onClick={() => updateAsistencia(asistencia.id, 'Modificado')}
                        disabled={loading || asistencia.estado === 'Modificado'}
                        class={`px-3 py-1 rounded text-sm transition ${
                          asistencia.estado === 'Modificado'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 hover:bg-orange-100'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        ⚠ Modificado
                      </button>
                      <button
                        onClick={() => updateAsistencia(asistencia.id, 'Pendiente')}
                        disabled={loading || asistencia.estado === 'Pendiente'}
                        class={`px-3 py-1 rounded text-sm transition ${
                          asistencia.estado === 'Pendiente'
                            ? 'bg-gray-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        ⏱ Pendiente
                      </button>
                    </div>
                  </div>
                  
                  {editingObservation === asistencia.id ? (
                    <div class="mt-2">
                      <textarea
                        value={observationText}
                        onInput={(e) => setObservationText(e.target.value)}
                        placeholder="Agregar observaciones..."
                        class="w-full px-3 py-2 border rounded text-sm"
                        rows="2"
                      />
                      <div class="flex gap-2 mt-2">
                        <button
                          onClick={() => saveObservation(asistencia.id)}
                          class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setEditingObservation(null);
                            setObservationText('');
                          }}
                          class="px-3 py-1 bg-gray-300 rounded text-sm hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div class="mt-2">
                      <p class="text-sm text-gray-700">
                        {asistencia.observaciones || 'Sin observaciones'}
                      </p>
                      <button
                        onClick={() => startEditObservation(asistencia)}
                        class="text-xs text-blue-600 hover:underline mt-1"
                      >
                        {asistencia.observaciones ? 'Editar' : 'Agregar'} observación
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
