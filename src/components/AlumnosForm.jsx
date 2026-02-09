import { h } from 'preact';

export default function AlumnosForm({
  formData,
  setFormData,
  formErrors,
  isCreating,
  editingId,
  handleSave,
  resetForm,
  saving
}) {
  return (
    <div class="bg-white rounded-lg shadow p-6">
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <h3 class="text-lg font-bold mb-4">{isCreating ? 'Crear Nuevo Alumno' : 'Editar Alumno'}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Email (usuario)</label>
          <input
            type="email"
            value={formData.email}
            onInput={(e) => setFormData({ ...formData, email: e.target.value })}
            class={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${formErrors.email ? 'border-red-500' : ''}`}
            name="email"
            autoComplete="email"
            placeholder="padre@example.com"
            aria-invalid={formErrors.email ? 'true' : 'false'}
            aria-describedby={formErrors.email ? 'error-email' : undefined}
          />
          {formErrors.email && <p id="error-email" class="text-sm text-red-600 mt-1">{formErrors.email}</p>}
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Password (usuario)</label>
          <input
            type="password"
            value={formData.password}
            onInput={(e) => setFormData({ ...formData, password: e.target.value })}
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            name="password"
            autoComplete="new-password"
            placeholder="123456"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Rol</label>
          <select
            value={formData.rol}
            onInput={(e) => setFormData({ ...formData, rol: e.target.value })}
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="padre">padre</option>
            <option value="alumno">alumno</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Nombre *</label>
          <input
            id="nombre-input"
            type="text"
            value={formData.nombre}
            onInput={(e) => setFormData({ ...formData, nombre: e.target.value })}
            class={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${formErrors.nombre ? 'border-red-500' : ''}`}
            placeholder="Nombre completo"
            aria-invalid={formErrors.nombre ? 'true' : 'false'}
            aria-describedby={formErrors.nombre ? 'error-nombre' : undefined}
          />
          {formErrors.nombre && <p id="error-nombre" class="text-sm text-red-600 mt-1">{formErrors.nombre}</p>}
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Edad</label>
          <input
            type="number"
            value={formData.edad}
            onInput={(e) => setFormData({ ...formData, edad: e.target.value })}
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="18"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Curso</label>
          <input
            type="text"
            value={formData.curso}
            onInput={(e) => setFormData({ ...formData, curso: e.target.value })}
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="4to Secundaria"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Teléfono Padre</label>
          <input
            type="text"
            value={formData.telefono_padre}
            onInput={(e) => setFormData({ ...formData, telefono_padre: e.target.value })}
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="+591 74325440"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Materias (separadas por comas)</label>
          <input
            type="text"
            value={formData.materias}
            onInput={(e) => setFormData({ ...formData, materias: e.target.value })}
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Matemáticas, Física"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Clases Compradas</label>
          <input
            type="number"
            value={formData.clases_compradas}
            onInput={(e) => setFormData({ ...formData, clases_compradas: e.target.value })}
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="12"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Horas por Clase</label>
          <input
            type="text"
            value={formData.horas}
            onInput={(e) => setFormData({ ...formData, horas: e.target.value })}
            class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="2 horas"
          />
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
