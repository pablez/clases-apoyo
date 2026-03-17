import { h } from 'preact';

/**
 * Componente de barra de progreso horizontal para asistencia
 * Muestra Presentes vs Faltas como barras delgadas de progreso
 */
export default function AttendanceChart({ presentes = 0, faltas = 0, pendientes = 0, className = '' }) {
  const total = presentes + faltas + pendientes;
  const percentPresentes = total > 0 ? (presentes / total) * 100 : 0;
  const percentFaltas = total > 0 ? (faltas / total) * 100 : 0;
  const percentPendientes = total > 0 ? (pendientes / total) * 100 : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de carga horizontal - Presentes */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 w-24">Presentes</span>
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${percentPresentes}%` }}
            ></div>
          </div>
        </div>
        <span className="text-sm font-bold text-green-600 w-12 text-right">{presentes}</span>
      </div>

      {/* Barra de carga horizontal - Faltas */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 w-24">Faltas</span>
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${percentFaltas}%` }}
            ></div>
          </div>
        </div>
        <span className="text-sm font-bold text-red-600 w-12 text-right">{faltas}</span>
      </div>

      {/* Barra de carga horizontal - Pendientes */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 w-24">Pendientes</span>
        <div className="flex-1">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-300"
              style={{ width: `${percentPendientes}%` }}
            ></div>
          </div>
        </div>
        <span className="text-sm font-bold text-yellow-600 w-12 text-right">{pendientes}</span>
      </div>

      {/* Total */}
      <div className="pt-2 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <strong>Total clases:</strong> {total}
        </div>
      </div>
    </div>
  );
}
