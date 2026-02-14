import { useState } from 'preact/hooks';
import AlumnosForm from './AlumnosForm.jsx';
import useAlumnos from '../hooks/useAlumnos.js';
import AlumnosTable from './AlumnosTable.jsx';
import AlumnosCardList from './AlumnosCardList.jsx';
import AlumnoModal from './AlumnosModals/AlumnoModal.jsx';
import UsuarioModal from './AlumnosModals/UsuarioModal.jsx';
import EditAlumnoModal from './AlumnosModals/EditAlumnoModal.jsx';

export default function AlumnosManager({ apiBaseUrl = '/api' }) {
  // alumnos state and CRUD are handled by `useAlumnos` below
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
  const [cascadeDeletingId, setCascadeDeletingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingCascadeId, setPendingCascadeId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showAlumnoModal, setShowAlumnoModal] = useState(false);
  const [showUsuarioModal, setShowUsuarioModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editActiveTab, setEditActiveTab] = useState('alumno');

  // use custom hook for alumnos CRUD (provides alumnos, loading, saving, error, and actions)
  const {
    alumnos,
    loading,
    saving: hookSaving,
    error: hookError,
    loadAlumnos,
    createAlumno,
    updateAlumno,
    deleteAlumno,
    cascadeDeleteAlumno,
    setError: setHookError
  } = useAlumnos(apiBaseUrl, { onToast: addToast });

  // keep `saving` reference compatible with existing code
  const saving = hookSaving;
  const error = hookError;

  function addToast(message, type = 'success', ttl = 4000) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    setToasts(t => [{ id, message, type }, ...t]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ttl);
  }


  function startCreating() {
    resetForm();
    // legacy start; keep for compatibility but prefer modal flow
    setIsCreating(true);
    setEditingId(null);
  }

  function startCreatingModal() {
    resetForm();
    setIsCreating(false);
    setEditingId(null);
    setShowAlumnoModal(true);
  }

  function submitAlumnoModal() {
    // basic validation
    const errors = {};
    if (!formData.nombre || !formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    // close alumno modal and open usuario modal
    setShowAlumnoModal(false);
    setShowUsuarioModal(true);
  }

  function cancelCreateFlow() {
    setShowAlumnoModal(false);
    setShowUsuarioModal(false);
    resetForm();
  }

  async function submitUsuarioModal() {
    // minimal validation
    const errors = {};
    if (!formData.email || !formData.email.trim()) errors.email = 'El email es obligatorio';
    if (!formData.password || !String(formData.password).trim()) errors.password = 'La contraseña es obligatoria';
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    // delegate creation to hook (handles saving state and toasts)
    setShowUsuarioModal(false);
    try {
      const payload = {
        nombre: formData.nombre,
        edad: formData.edad,
        curso: formData.curso,
        telefono_padre: formData.telefono_padre,
        materias: Array.isArray(formData.materias) ? formData.materias : (typeof formData.materias === 'string' ? formData.materias.split(',').map(s=>s.trim()).filter(Boolean) : formData.materias),
        clases_compradas: formData.clases_compradas,
        horas: formData.horas,
        email: formData.email,
        password: formData.password,
        rol: formData.rol || 'padre'
      };
      await createAlumno(payload);
      resetForm();
    } catch (err) {
      addToast(String(err.message || err), 'error');
      setHookError(err.message || String(err));
    }
  }

  function editAlumno(alumno) {
    // Log for debugging: inspect alumno and linked usuario when opening edit modal
    try {
      console.log('Opening edit modal for alumno:', alumno);
      if (alumno && alumno._usuario) console.log('Attached _usuario:', alumno._usuario);
    } catch (e) {
      // ignore logging errors
    }
    setFormData({
      nombre: alumno.nombre || '',
      edad: alumno.edad || '',
      curso: alumno.curso || '',
      telefono_padre: alumno.telefono_padre || '',
      materias: Array.isArray(alumno.materias) ? alumno.materias.join(', ') : (typeof alumno.materias === 'string' ? alumno.materias : (alumno.materias ?? '')),
      clases_compradas: alumno.clases_compradas || '',
      horas: alumno.horas || '',
      email: (alumno._usuario && (alumno._usuario.email || alumno._usuario.correo)) || alumno.email || '',
      // Do NOT prefill password for security — require explicit change
      password: '',
      rol: (alumno._usuario && (alumno._usuario.rol)) || alumno.rol || 'padre'
    });
    setEditingId(alumno.id);
    setIsCreating(false);
    setEditActiveTab('alumno');
    setShowEditModal(true);
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
    // saving handled by hook methods
    const errors = {};
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (formData.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) errors.email = 'Email inválido';
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    try {
      const payload = {
        ...formData,
        materias: formData.materias.split(',').map(m => m.trim()).filter(Boolean)
      };

      if (isCreating) {
        await createAlumno(payload);
        setSuccessMessage('✅ Alumno creado y guardado en Google Sheets correctamente');
      } else {
        console.log('🔁 Enviando PUT para id:', editingId, 'payload:', payload);
        await updateAlumno(editingId, payload);
        setSuccessMessage('✅ Alumno actualizado en Google Sheets correctamente');
      }

      // close edit modal if open
      if (showEditModal) setShowEditModal(false);
      setTimeout(() => {
        resetForm();
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setHookError(err.message || String(err));
    } finally {
      // hook manages saving
    }
  }

  // request flow: open confirmation modal
  function requestDelete(id) {
    setPendingDeleteId(id);
  }

  function requestCascadeDelete(id) {
    setPendingCascadeId(id);
  }

  async function confirmDelete() {
    const id = pendingDeleteId;
    if (!id) return;
    setDeletingId(id);
    try {
      await deleteAlumno(id);
      addToast('Alumno eliminado correctamente', 'success');
      setPendingDeleteId(null);
    } catch (err) {
      addToast(String(err.message || err), 'error');
      setHookError(err.message || String(err));
    } finally {
      setDeletingId(null);
    }
  }

  async function confirmCascadeDelete() {
    const id = pendingCascadeId;
    if (!id) return;
    setCascadeDeletingId(id);
    try {
      await cascadeDeleteAlumno(id);
      addToast('Alumno y datos relacionados eliminados correctamente', 'success');
      setPendingCascadeId(null);
    } catch (err) {
      addToast(String(err.message || err), 'error');
      setHookError(err.message || String(err));
    } finally {
      setCascadeDeletingId(null);
    }
  }

  function cancelPendingDelete() {
    setPendingDeleteId(null);
  }

  function cancelPendingCascade() {
    setPendingCascadeId(null);
  }

  return (
    <div class="space-y-4">
      {successMessage && (
        <div class="bg-green-100 text-green-700 p-4 rounded mb-4">{successMessage}</div>
      )}
      {error && (
        <div class="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
      )}

      {/* Toast notifications */}
      <div class="fixed top-4 right-4 space-y-2 z-40">
        {toasts.map(t => (
          <div key={t.id} class={`p-3 rounded text-white ${t.type === 'error' ? 'bg-red-500' : t.type === 'info' ? 'bg-blue-500' : 'bg-green-500'}`}>
            {t.message}
          </div>
        ))}
      </div>

      <AlumnoModal
        visible={showAlumnoModal}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        onSubmit={submitAlumnoModal}
        onCancel={cancelCreateFlow}
      />

      <EditAlumnoModal
        visible={showEditModal}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        onClose={() => { setShowEditModal(false); resetForm(); }}
        editActiveTab={editActiveTab}
        setEditActiveTab={setEditActiveTab}
        handleSave={handleSave}
        saving={saving}
        resetForm={resetForm}
      />

      <UsuarioModal
        visible={showUsuarioModal}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        onSubmit={submitUsuarioModal}
        onBack={() => { setShowUsuarioModal(false); setShowAlumnoModal(true); }}
      />

      {/* Confirmación: eliminar alumno (simple) */}
      {pendingDeleteId && (
        <div class="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-50">
          <div class="bg-white rounded-t-lg sm:rounded p-4 sm:p-6 w-full sm:max-w-md">
            <h3 class="text-lg font-bold mb-2">Confirmar eliminación</h3>
            <p class="text-sm text-gray-700 mb-4">¿Estás seguro? Esta acción eliminará el alumno seleccionado.</p>
            <div class="flex flex-col sm:flex-row sm:justify-end gap-2">
              <button onClick={cancelPendingDelete} class="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button onClick={confirmDelete} disabled={deletingId === pendingDeleteId} class="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50">
                {deletingId === pendingDeleteId ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación: eliminar alumno y cascada (todo) */}
      {pendingCascadeId && (
        <div class="fixed inset-0 bg-black bg-opacity-40 flex items-end sm:items-center justify-center z-50">
          <div class="bg-white rounded-t-lg sm:rounded p-4 sm:p-6 w-full sm:max-w-md">
            <h3 class="text-lg font-bold mb-2">Eliminar con datos relacionados</h3>
            <p class="text-sm text-gray-700 mb-4">Esta acción eliminará el alumno y todo su historial (asistencias, registros). Esta operación no se puede deshacer.</p>
            <div class="flex flex-col sm:flex-row sm:justify-end gap-2">
              <button onClick={cancelPendingCascade} class="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button onClick={confirmCascadeDelete} disabled={cascadeDeletingId === pendingCascadeId} class="w-full sm:w-auto px-4 py-2 bg-red-700 text-white rounded disabled:opacity-50">
                {cascadeDeletingId === pendingCascadeId ? 'Eliminando...' : 'Borrar todo'}
              </button>
            </div>
          </div>
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
              onClick={startCreatingModal}
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
              return (
                <AlumnosTable
                  rows={visible}
                  onEdit={editAlumno}
                  onRequestDelete={requestDelete}
                  onRequestCascade={requestCascadeDelete}
                  deletingId={deletingId}
                  cascadeDeletingId={cascadeDeletingId}
                />
              );
            })()}

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
            <AlumnosCardList
              rows={alumnos.filter(a => {
                const q = searchTerm.trim().toLowerCase();
                if (!q) return true;
                return [a.nombre, a.curso, a.telefono_padre, (a.email||'')].some(v => String(v||'').toLowerCase().includes(q));
              }).slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)}
              onEdit={editAlumno}
              onRequestDelete={requestDelete}
              onRequestCascade={requestCascadeDelete}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              deletingId={deletingId}
              cascadeDeletingId={cascadeDeletingId}
            />
          </>
        )}
      </div>
    </div>
  );
}
  