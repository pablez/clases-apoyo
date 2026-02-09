Sprint backlog — Próximo sprint (refactor + pruebas)
===============================================

Objetivo: Extraer adaptadores, refactorizar servicios a repositorios (Clean/Hexagonal) y añadir pruebas unitarias mínimas.

Prioridad:
- Refactorizar capa de servicios y repositorios (convertir llamadas directas en uso de repositorios DI)
- Extraer conector de Google Sheets como adaptador (`src/infrastructure/googleSheetsAdapter.js`)
- Añadir interfaz `IAsistenciasRepo` (hecho) y adaptar `getAsistencias` para usarla
- Añadir pruebas unitarias para `getAsistencias` y `loginUser` (mock)
- Añadir tests de integración básicos (login -> asistencias) en Playwright (ya hay E2E)
- Verificar en entorno local y documentar pasos de despliegue

Tareas técnicas (primeros tickets):
1. Implementar `googleSheetsAdapter` conectando con `src/services/googleSheets.js`.
2. Refactorizar `src/services/api.js` para delegar a `IAsistenciasRepo`/`IAlumnosRepo` mediante wrappers.
3. Escribir tests unitarios usando `node:test` o `vitest` (decidir runner).
4. Añadir scripts de test unitario en `package.json`.
5. Ejecutar pipeline CI y ajustar matrices si es necesario.

Notas:
- En CI las pruebas usarán mocks (`USE_GOOGLE_SHEETS=false`). Para pruebas de integración con Google Sheets, configuraremos secretos y un job separado.
