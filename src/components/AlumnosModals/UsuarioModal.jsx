import { h } from 'preact';

export default function UsuarioModal({ visible, formData, setFormData, formErrors, onSubmit, onBack }) {
  if (!visible) return null;
  return (
    <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg w-full max-w-lg p-6 shadow-lg">
        <h3 class="text-xl font-semibold mb-2">Crear Usuario</h3>
        <p class="text-sm text-gray-600 mb-4">Datos de acceso para el alumno (email y contraseña).</p>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} class="grid grid-cols-1 gap-3 mb-4">
          <div>
            <label class="block text-sm font-medium mb-1">Email *</label>
            <input autocomplete="username" type="email" value={formData.email} onInput={e => setFormData({ ...formData, email: e.target.value })} class={`w-full px-3 py-2 border rounded ${formErrors.email ? 'border-red-500' : ''}`} />
            {formErrors.email && <p class="text-xs text-red-600">{formErrors.email}</p>}
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Password *</label>
            <input autocomplete="new-password" type="password" value={formData.password} onInput={e => setFormData({ ...formData, password: e.target.value })} class={`w-full px-3 py-2 border rounded ${formErrors.password ? 'border-red-500' : ''}`} />
            {formErrors.password && <p class="text-xs text-red-600">{formErrors.password}</p>}
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Rol</label>
            <select value={formData.rol} onInput={e => setFormData({ ...formData, rol: e.target.value })} class="w-full px-3 py-2 border rounded">
              <option value="padre">padre</option>
              <option value="alumno">alumno</option>
            </select>
          </div>
          <div class="flex justify-end gap-3">
            <button type="button" class="px-4 py-2 bg-gray-100 rounded" onClick={onBack}>Atrás</button>
            <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded">Confirmar y crear</button>
          </div>
        </form>
      </div>
    </div>
  );
}
