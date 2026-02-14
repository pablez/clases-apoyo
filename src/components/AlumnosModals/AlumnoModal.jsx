import { h } from 'preact';

export default function AlumnoModal({ visible, formData, setFormData, formErrors, onSubmit, onCancel }) {
  if (!visible) return null;
  return (
    <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg w-full max-w-lg p-6 shadow-lg">
        <h3 class="text-xl font-semibold mb-2">Crear Alumno</h3>
        <p class="text-sm text-gray-600 mb-4">Ingresa los datos del alumno.</p>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} class="grid grid-cols-1 gap-3 mb-4">
          <div>
            <label class="block text-sm font-medium mb-1">Nombre *</label>
            <input type="text" value={formData.nombre} onInput={e => setFormData({ ...formData, nombre: e.target.value })} class={`w-full px-3 py-2 border rounded ${formErrors.nombre ? 'border-red-500' : ''}`} />
            {formErrors.nombre && <p class="text-xs text-red-600">{formErrors.nombre}</p>}
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Edad</label>
            <input type="number" value={formData.edad} onInput={e => setFormData({ ...formData, edad: e.target.value })} class="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Curso</label>
            <input type="text" value={formData.curso} onInput={e => setFormData({ ...formData, curso: e.target.value })} class="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Teléfono Padre</label>
            <input type="text" value={formData.telefono_padre} onInput={e => setFormData({ ...formData, telefono_padre: e.target.value })} class="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Materias (separadas por comas)</label>
            <input type="text" value={formData.materias} onInput={e => setFormData({ ...formData, materias: e.target.value })} class="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Clases Compradas</label>
            <input type="number" value={formData.clases_compradas} onInput={e => setFormData({ ...formData, clases_compradas: e.target.value })} class="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Horas por Clase</label>
            <input type="text" value={formData.horas} onInput={e => setFormData({ ...formData, horas: e.target.value })} class="w-full px-3 py-2 border rounded" />
          </div>
          <div class="flex justify-end gap-3">
            <button type="button" class="px-4 py-2 bg-gray-100 rounded" onClick={onCancel}>Cancelar</button>
            <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded">Siguiente</button>
          </div>
        </form>
      </div>
    </div>
  );
}
