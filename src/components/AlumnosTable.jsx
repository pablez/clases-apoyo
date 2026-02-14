export default function AlumnosTable({ rows = [], onEdit, onRequestDelete, onRequestCascade, deletingId, cascadeDeletingId }) {
  return (
    <div class="hidden sm:block overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left">Nombre</th>
            <th class="px-4 py-2 text-left">Edad</th>
            <th class="px-4 py-2 text-left">Curso</th>
            <th class="px-4 py-2 text-left">Teléfono</th>
            <th class="px-4 py-2 text-left">Clases</th>
            <th class="px-4 py-2 text-left">Horas</th>
            <th class="px-4 py-2 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(alumno => (
            <tr key={alumno.id} class="border-t hover:bg-gray-50">
              <td class="px-4 py-2 font-medium">{alumno.nombre}</td>
              <td class="px-4 py-2">{alumno.edad || 'N/A'}</td>
              <td class="px-4 py-2">{alumno.curso || 'N/A'}</td>
              <td class="px-4 py-2">{alumno.telefono_padre || 'N/A'}</td>
              <td class="px-4 py-2">{alumno.clases_compradas || 0}</td>
              <td class="px-4 py-2">{alumno.horas || 'N/A'}</td>
              <td class="px-4 py-2 flex gap-2 items-center">
                <button
                  onClick={() => onEdit && onEdit(alumno)}
                  class="text-blue-600 hover:underline text-sm flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5h6M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7" />
                  </svg>
                  Editar
                </button>
                <button
                  onClick={() => onRequestDelete && onRequestDelete(alumno.id)}
                  class="text-red-600 hover:underline text-sm flex items-center gap-2"
                  disabled={deletingId === alumno.id}
                >
                  {deletingId === alumno.id ? (
                    <>
                      <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Eliminar
                    </>
                  )}
                </button>
                <button
                  onClick={() => onRequestCascade && onRequestCascade(alumno.id)}
                  class="text-red-700 hover:underline text-sm flex items-center gap-2"
                  disabled={cascadeDeletingId === alumno.id}
                >
                  {cascadeDeletingId === alumno.id ? (
                    <>
                      <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Borrando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22" />
                      </svg>
                      Borrar todo
                    </>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
