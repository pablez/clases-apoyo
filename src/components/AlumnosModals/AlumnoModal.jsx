import { h } from 'preact';

export default function AlumnoModal({ visible, formData, setFormData, formErrors, onSubmit, onCancel }) {
  // Helper function for numeric inputs - mejorada
  function handleNumericInput(field, value) {
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
  }

  if (!visible) return null;
  return (
    <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg w-full max-w-lg p-6 shadow-lg">
        <h3 class="text-xl font-semibold mb-2">Crear Alumno</h3>
        <p class="text-sm text-gray-600 mb-4">Ingresa los datos del alumno.</p>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} class="space-y-4 mb-4">
          {/* Datos Personales */}
          <div class="border-b pb-3">
            <h5 class="text-sm font-medium text-gray-700 mb-2">Datos Personales</h5>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  value={formData.nombre || ''} 
                  onInput={e => setFormData({ ...formData, nombre: e.target.value })} 
                  class={`w-full px-3 py-2 border rounded ${formErrors.nombre ? 'border-red-500' : ''}`}
                  placeholder="Ej: María García López"
                  required
                />
                {formErrors.nombre && <p class="text-xs text-red-600">{formErrors.nombre}</p>}
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium mb-1">Edad</label>
                  <input 
                    type="number" 
                    min="5" 
                    max="25" 
                    value={formData.edad || ''} 
                    onInput={e => handleNumericInput('edad', e.target.value)} 
                    class={`w-full px-3 py-2 border rounded ${formErrors.edad ? 'border-red-500' : ''}`}
                    placeholder="18"
                  />
                  {formErrors.edad && <p class="text-xs text-red-600">{formErrors.edad}</p>}
                </div>
                
                <div>
                  <label class="block text-sm font-medium mb-1">Curso</label>
                  <input 
                    type="text" 
                    value={formData.curso || ''} 
                    onInput={e => setFormData({ ...formData, curso: e.target.value })} 
                    class="w-full px-3 py-2 border rounded"
                    placeholder="4to Sec."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div class="border-b pb-3">
            <h5 class="text-sm font-medium text-gray-700 mb-2">Contacto</h5>
            <div>
              <label class="block text-sm font-medium mb-1">Teléfono del Padre *</label>
              <input 
                type="tel" 
                value={formData.telefono_padre || ''} 
                onInput={e => setFormData({ ...formData, telefono_padre: e.target.value })} 
                class={`w-full px-3 py-2 border rounded ${formErrors.telefono_padre ? 'border-red-500' : ''}`}
                placeholder="+591 74325440"
                required
              />
              {formErrors.telefono_padre && <p class="text-xs text-red-600">{formErrors.telefono_padre}</p>}
            </div>
          </div>

          {/* Información Académica */}
          <div>
            <h5 class="text-sm font-medium text-gray-700 mb-2">Información Académica</h5>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1">Materias</label>
                <input 
                  type="text" 
                  value={formData.materias || ''} 
                  onInput={e => setFormData({ ...formData, materias: e.target.value })} 
                  class="w-full px-3 py-2 border rounded"
                  placeholder="Matemáticas, Física"
                />
                <p class="text-xs text-gray-500 mt-1">Separar con comas</p>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-medium mb-1">Clases Compradas</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="50"
                    value={formData.clases_compradas || ''} 
                    onInput={e => handleNumericInput('clases_compradas', e.target.value)} 
                    class={`w-full px-3 py-2 border rounded ${formErrors.clases_compradas ? 'border-red-500' : ''}`}
                    placeholder="12"
                  />
                  {formErrors.clases_compradas && <p class="text-xs text-red-600">{formErrors.clases_compradas}</p>}
                </div>
                
                <div>
                  <label class="block text-sm font-medium mb-1">Horas por Clase</label>
                  <input 
                    type="number" 
                    min="0.5" 
                    max="6"
                    step="0.5" 
                    value={formData.horas || ''} 
                    onInput={e => {
                      const numValue = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      if (isNaN(numValue) || numValue < 0) return;
                      setFormData(prev => ({ ...prev, horas: numValue }));
                    }} 
                    class={`w-full px-3 py-2 border rounded ${formErrors.horas ? 'border-red-500' : ''}`}
                    placeholder="2.0"
                  />
                  {formErrors.horas && <p class="text-xs text-red-600">{formErrors.horas}</p>}
                </div>
              </div>
            </div>
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
