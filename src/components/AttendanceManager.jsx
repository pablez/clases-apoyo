import { useState, useEffect } from 'preact/hooks';

export default function AttendanceManager({ apiBaseUrl = '/api' }) {
  const [alumnos, setAlumnos] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [selectedAlumnoId, setSelectedAlumnoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setAsistencias(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
              class={`p-4 rounded-lg border-2 transition ${
                String(selectedAlumnoId) === String(alumno.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div class="font-semibold">{alumno.nombre}</div>
              <div class="text-sm text-gray-600">
                Clases: {alumno.clases_compradas || 0}
              </div>
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
                Clases compradas: {selectedAlumno.clases_compradas || 0}
              </p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-green-600">
                {calcularSesionesRestantes(selectedAlumno)}
              </div>
              <div class="text-sm text-gray-600">Sesiones restantes</div>
            </div>
          </div>

          <h3 class="font-semibold mb-3">Registro de Asistencia</h3>
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
                  class="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div class="flex-1">
                    <div class="font-medium">{asistencia.fecha}</div>
                    <div class={`text-sm ${
                      asistencia.estado === 'Presente'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {asistencia.estado}
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button
                      onClick={() => updateAsistencia(asistencia.id, 'Presente')}
                      disabled={loading || asistencia.estado === 'Presente'}
                      class={`px-3 py-1 rounded text-sm ${
                        asistencia.estado === 'Presente'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 hover:bg-green-100'
                      } disabled:opacity-50`}
                    >
                      Presente
                    </button>
                    <button
                      onClick={() => updateAsistencia(asistencia.id, 'Falta')}
                      disabled={loading || asistencia.estado === 'Falta'}
                      class={`px-3 py-1 rounded text-sm ${
                        asistencia.estado === 'Falta'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 hover:bg-red-100'
                      } disabled:opacity-50`}
                    >
                      Falta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
