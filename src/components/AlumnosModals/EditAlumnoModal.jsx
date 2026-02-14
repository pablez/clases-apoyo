import { h } from 'preact';

export default function EditAlumnoModal({ visible, formData, setFormData, formErrors, onClose, editActiveTab, setEditActiveTab, handleSave, saving, resetForm }) {
  if (!visible) return null;
  return (
    <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg w-full max-w-3xl p-6 shadow-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold">Editar Alumno</h3>
          <button class="text-gray-500" onClick={() => { onClose(); }}>✕</button>
        </div>

        <div class="mb-4">
          <nav class="flex gap-2">
            <button class={`px-3 py-1 rounded ${editActiveTab === 'alumno' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={() => setEditActiveTab('alumno')}>Alumno</button>
            <button class={`px-3 py-1 rounded ${editActiveTab === 'usuario' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={() => setEditActiveTab('usuario')}>Usuario</button>
          </nav>
        </div>

        {editActiveTab === 'alumno' && (
          <form onSubmit={(e) => { e.preventDefault(); (async () => { await handleSave(); })(); }} class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Nombre *</label>
              <input id="nombre-input" type="text" value={formData.nombre} onInput={(e) => setFormData({ ...formData, nombre: e.target.value })} class={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${formErrors.nombre ? 'border-red-500' : ''}`} placeholder="Nombre completo" aria-invalid={formErrors.nombre ? 'true' : 'false'} aria-describedby={formErrors.nombre ? 'error-nombre' : undefined} />
              {formErrors.nombre && <p id="error-nombre" class="text-sm text-red-600 mt-1">{formErrors.nombre}</p>}
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Edad</label>
              <input type="number" value={formData.edad} onInput={(e) => setFormData({ ...formData, edad: e.target.value })} class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" placeholder="18" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Curso</label>
              <input type="text" value={formData.curso} onInput={(e) => setFormData({ ...formData, curso: e.target.value })} class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" placeholder="4to Secundaria" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Teléfono Padre</label>
              <input type="text" value={formData.telefono_padre} onInput={(e) => setFormData({ ...formData, telefono_padre: e.target.value })} class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" placeholder="+591 74325440" />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-1">Materias (separadas por comas)</label>
              <input type="text" value={formData.materias} onInput={(e) => setFormData({ ...formData, materias: e.target.value })} class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" placeholder="Matemáticas, Física" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Clases Compradas</label>
              <input type="number" value={formData.clases_compradas} onInput={(e) => setFormData({ ...formData, clases_compradas: e.target.value })} class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" placeholder="12" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Horas por Clase</label>
              <input type="text" value={formData.horas} onInput={(e) => setFormData({ ...formData, horas: e.target.value })} class="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" placeholder="2 horas" />
            </div>
            <div class="md:col-span-2 flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => { onClose(); resetForm(); }} class="px-6 py-2 rounded font-medium bg-gray-400 hover:bg-gray-500 text-white">Cancelar</button>
              <button type="submit" disabled={saving} class={`px-6 py-2 rounded font-medium ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white flex items-center gap-2`}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </form>
        )}

        {editActiveTab === 'usuario' && (
          <form onSubmit={(e) => { e.preventDefault(); (async () => { await handleSave(); })(); }} class="grid grid-cols-1 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Email</label>
              <input autocomplete="username" type="email" value={formData.email} onInput={(e) => setFormData({ ...formData, email: e.target.value })} class={`w-full px-3 py-2 border rounded ${formErrors.email ? 'border-red-500' : ''}`} />
              {formErrors.email && <p class="text-xs text-red-600">{formErrors.email}</p>}
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Password (dejar en blanco para no cambiar)</label>
              <input autocomplete="new-password" type="password" value={formData.password} onInput={(e) => setFormData({ ...formData, password: e.target.value })} class={`w-full px-3 py-2 border rounded ${formErrors.password ? 'border-red-500' : ''}`} />
              {formErrors.password && <p class="text-xs text-red-600">{formErrors.password}</p>}
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Rol</label>
              <select value={formData.rol} onInput={(e) => setFormData({ ...formData, rol: e.target.value })} class="w-full px-3 py-2 border rounded">
                <option value="padre">padre</option>
                <option value="alumno">alumno</option>
              </select>
            </div>
            <div class="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => { onClose(); resetForm(); }} class="px-6 py-2 rounded font-medium bg-gray-400 hover:bg-gray-500 text-white">Cancelar</button>
              <button type="submit" disabled={saving} class={`px-6 py-2 rounded font-medium ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white flex items-center gap-2`}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
