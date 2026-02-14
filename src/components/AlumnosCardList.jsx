export default function AlumnosCardList({ rows = [], onEdit, onRequestDelete, onRequestCascade, expandedId, setExpandedId, deletingId, cascadeDeletingId }) {
  return (
    <div class="block sm:hidden space-y-3">
      {rows.map(alumno => (
        <div key={alumno.id} class="bg-white rounded-lg shadow p-3 border">
          <div class="flex justify-between items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="text-base font-semibold truncate">{alumno.nombre}</div>
              <div class="text-xs text-gray-500 truncate">{alumno.curso || 'N/A'} · {alumno.edad || 'N/A'} años</div>
              <div class="text-xs text-gray-500 mt-1 truncate">{alumno.telefono_padre || 'N/A'}</div>
              <div class="text-xs text-gray-500 mt-1 truncate">{alumno.email || '—'} · {alumno.rol || 'padre'}</div>
            </div>
            <div class="flex flex-col items-end gap-2">
              <div class="text-sm font-medium text-gray-700">{alumno.clases_compradas || 0} clases</div>
              <div class="flex gap-2 flex-wrap">
                <button aria-label="Editar" onClick={() => onEdit && onEdit(alumno)} class="px-3 py-1 min-w-[44px] bg-blue-600 text-white rounded text-xs" disabled={deletingId === alumno.id}>✏️</button>
                <button aria-label="Eliminar" onClick={() => onRequestDelete && onRequestDelete(alumno.id)} class="px-3 py-1 min-w-[44px] bg-red-600 text-white rounded text-xs" disabled={deletingId === alumno.id}>{deletingId === alumno.id ? '...' : '🗑️'}</button>
                <button aria-label="Borrar todo" onClick={() => onRequestCascade && onRequestCascade(alumno.id)} class="px-3 py-1 min-w-[44px] bg-red-700 text-white rounded text-xs" disabled={cascadeDeletingId === alumno.id}>{cascadeDeletingId === alumno.id ? '...' : '⚠️'}</button>
              </div>
              <button onClick={() => setExpandedId(expandedId === alumno.id ? null : alumno.id)} class="text-xs text-gray-500 mt-1">
                {expandedId === alumno.id ? 'Ocultar' : 'Ver más'}
              </button>
            </div>
          </div>
          {expandedId === alumno.id && (
            <div class="mt-3 text-xs text-gray-600 space-y-1">
              <div><strong>Horas:</strong> {alumno.horas || 'N/A'}</div>
              <div><strong>Teléfono:</strong> {alumno.telefono_padre || 'N/A'}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
