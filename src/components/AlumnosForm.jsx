import { h } from 'preact';

export default function AlumnosForm({
  formData,
  setFormData,
  formErrors,
  isCreating,
  editingId,
  handleSave,
  resetForm,
  saving,
  handleNumericInput
}) {
  // Helper function for this component if not passed down - mejorada
  const safeHandleNumericInput = handleNumericInput || ((field, value) => {
    // Si el valor está vacío, mantenerlo como string vacío
    if (value === '' || value === null || value === undefined) {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }
    
    let numValue;
    if (field === 'horas') {
      numValue = parseFloat(value);
    } else {
      numValue = parseInt(value, 10);
    }
    
    if (isNaN(numValue) || numValue < 0) return;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  });

  return (
    <div class="bg-white rounded-lg shadow p-6">
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <h3 class="text-lg font-bold mb-4">{isCreating ? 'Crear Nuevo Alumno' : 'Editar Alumno'}</h3>
        <div class="space-y-6">
          {/* Sección de Datos de Usuario */}
          <div class="border-b pb-4">
            <h4 class="text-md font-semibold mb-3 text-gray-700">Datos de Usuario</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Email (usuario) *</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onInput={(e) => setFormData({ ...formData, email: e.target.value })}
                  class={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : ''}`}
                  name="email"
                  autoComplete="email"
                  placeholder="padre@example.com"
                  required
                  aria-invalid={formErrors.email ? 'true' : 'false'}
                  aria-describedby={formErrors.email ? 'error-email' : undefined}
                />
                {formErrors.email && <p id="error-email" class="text-sm text-red-600 mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password || ''}
                  onInput={(e) => setFormData({ ...formData, password: e.target.value })}
                  class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  name="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Rol</label>
                <select
                  value={formData.rol || 'padre'}
                  onInput={(e) => setFormData({ ...formData, rol: e.target.value })}
                  class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="padre">Padre/Tutor</option>
                  <option value="alumno">Alumno</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección de Datos Personales */}
          <div class="border-b pb-4">
            <h4 class="text-md font-semibold mb-3 text-gray-700">Datos Personales del Alumno</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium mb-1">Nombre Completo *</label>
                <input
                  id="nombre-input"
                  type="text"
                  value={formData.nombre || ''}
                  onInput={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  class={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${formErrors.nombre ? 'border-red-500' : ''}`}
                  placeholder="Ej: Juan Pérez González"
                  required
                  aria-invalid={formErrors.nombre ? 'true' : 'false'}
                  aria-describedby={formErrors.nombre ? 'error-nombre' : undefined}
                />
                {formErrors.nombre && <p id="error-nombre" class="text-sm text-red-600 mt-1">{formErrors.nombre}</p>}
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Edad</label>
                <input
                  type="number"
                  min="5"
                  max="25"
                  value={formData.edad || ''}
                  onInput={(e) => safeHandleNumericInput('edad', e.target.value)}
                  class={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${formErrors.edad ? 'border-red-500' : ''}`}
                  placeholder="18"
                  aria-invalid={formErrors.edad ? 'true' : 'false'}
                  aria-describedby={formErrors.edad ? 'error-edad' : undefined}
                />
                {formErrors.edad && <p id="error-edad" class="text-sm text-red-600 mt-1">{formErrors.edad}</p>}
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Curso/Grado</label>
                <input
                  type="text"
                  value={formData.curso || ''}
                  onInput={(e) => setFormData({ ...formData, curso: e.target.value })}
                  class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 4to Secundaria, 1er Año Universidad"
                />
              </div>
            </div>
          </div>

          {/* Sección de Contacto */}
          <div class="border-b pb-4">
            <h4 class="text-md font-semibold mb-3 text-gray-700">Información de Contacto</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Teléfono del Padre/Tutor *</label>
                <input
                  type="tel"
                  value={formData.telefono_padre || ''}
                  onInput={(e) => setFormData({ ...formData, telefono_padre: e.target.value })}
                  class={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${formErrors.telefono_padre ? 'border-red-500' : ''}`}
                  placeholder="+591 74325440"
                  required
                  aria-invalid={formErrors.telefono_padre ? 'true' : 'false'}
                  aria-describedby={formErrors.telefono_padre ? 'error-telefono' : undefined}
                />
                {formErrors.telefono_padre && <p id="error-telefono" class="text-sm text-red-600 mt-1">{formErrors.telefono_padre}</p>}
              </div>
            </div>
          </div>

          {/* Sección Académica */}
          <div>
            <h4 class="text-md font-semibold mb-3 text-gray-700">Información Académica</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium mb-1">Materias</label>
                <input
                  type="text"
                  value={formData.materias || ''}
                  onInput={(e) => setFormData({ ...formData, materias: e.target.value })}
                  class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Matemáticas, Física, Química (separadas por comas)"
                />
                <p class="text-xs text-gray-500 mt-1">Separa las materias con comas</p>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Clases Compradas</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.clases_compradas || ''}
                  onInput={(e) => safeHandleNumericInput('clases_compradas', e.target.value)}
                  class={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${formErrors.clases_compradas ? 'border-red-500' : ''}`}
                  placeholder="12"
                  aria-invalid={formErrors.clases_compradas ? 'true' : 'false'}
                  aria-describedby={formErrors.clases_compradas ? 'error-clases' : undefined}
                />
                {formErrors.clases_compradas && <p id="error-clases" class="text-sm text-red-600 mt-1">{formErrors.clases_compradas}</p>}
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Duración por Clase (horas)</label>
                <input
                  type="number"
                  min="0.5"
                  max="6"
                  step="0.5"
                  value={formData.horas || ''}
                  onInput={(e) => {
                    const numValue = e.target.value === '' ? 0 : parseFloat(e.target.value);
                    if (isNaN(numValue) || numValue < 0) return;
                    setFormData(prev => ({ ...prev, horas: numValue }));
                  }}
                  class={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${formErrors.horas ? 'border-red-500' : ''}`}
                  placeholder="2.0"
                  aria-invalid={formErrors.horas ? 'true' : 'false'}
                  aria-describedby={formErrors.horas ? 'error-horas' : undefined}
                />
                {formErrors.horas && <p id="error-horas" class="text-sm text-red-600 mt-1">{formErrors.horas}</p>}
              </div>
            </div>
          </div>
        </div>
          <div class="mt-6 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              class={`px-6 py-2 rounded font-medium ${
                saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } text-white flex items-center gap-2`}
            >
              {saving && (
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {!saving && (
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {saving ? 'Guardando...' : (isCreating ? 'Crear' : 'Guardar Cambios')}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              class="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
      </form>
    </div>
  );
}
