# Sprint 0 — Auditoría rápida: puntos de acoplamiento y hallazgos

Fecha: 2026-02-06

Resumen: se inspeccionó el subproyecto `gestor-asistencia` para localizar los puntos donde la app depende directamente de Google Sheets y de las credenciales. A continuación se listan los archivos clave, la naturaleza del acoplamiento y acciones recomendadas para el Sprint 1.

Archivos y puntos de acoplamiento
- `src/services/googleSheets.js`
  - Cliente central que crea `google.sheets()` y expone `readSheetRange`, `updateSheetRange`, `appendSheetRange`, `rowsToObjects`, `readUsuarios`, `readAllData`, `usuariosMap`.
  - Detecta `GOOGLE_SERVICE_ACCOUNT_JSON` y `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` y busca `educacion-llave.json` en rutas candidatas.
  - Acción: mantener como adaptador de baja prioridad; definir interfaz que usen los casos de uso.

- `src/infrastructure/googleSheetsAdapter.js`
  - Adaptador que usa funciones de `googleSheets.js` para operaciones concretas sobre `Asistencias` (create/update/delete/get).
  - Acción: convertir en implementación concreta de `IAsistenciasRepo` en la migración a Clean Architecture.

- `src/pages/api/usuarios/index.js`
  - Endpoint que llama a `readAllData()` y a `appendSheetRange()` para `POST` de usuarios.
  - Acción: convertir el controlador en un thin controller que llame a un caso de uso; evitar lógica de negocio en el endpoint.

- `src/services/wrappers.js`
  - Implementación mock que lee/escribe `src/data/mock.json` y es importada por rutas API en modo mock.
  - Acción: mantener como `infrastructure/mock` y garantizar paridad de contratos con los adaptadores de Sheets.

- `src/pages/api/*` (alumnos, asistencias, materiales)
  - Muchas rutas importan funciones de `wrappers.js` (modo mock) o usan adaptadores que llaman a `googleSheets.js`.
  - Acción: refactor para que las rutas sean controladores delgados que llamen a repositorios / casos de uso.

- `scripts/` (`read-google-sheets.js`, `append-usuario.js`, `check-api-usuarios.js`, `test-google-sheets.js`)
  - Scripts útiles para verificación manual; algunos importan adaptadores internos.
  - Acción: documentar su uso en README y añadir instrucciones concretas para smoke tests.

- `src/data/mock.json`
  - Almacén local de datos para modo `USE_GOOGLE_SHEETS=false`.
  - Acción: mantener y versionar como fixture para tests E2E/local.

Riesgos y observaciones
- Variables de entorno: `GOOGLE_SHEET_ID` tiene un valor por defecto pero CI/Netlify debe inyectar `GOOGLE_SERVICE_ACCOUNT_JSON` correctamente (una sola línea). Ver `NETLIFY-SETUP.md`.
- Ejecución local: se detectó `gestor-asistencia/educacion-llave.json` en el workspace; `googleSheets.js` ya intenta detectarlo automáticamente.
- Inicio de servidor en la sesión del asistente: hubo problemas de arranque (PowerShell/cmd env propagation). Recomendación: ejecutar manualmente los pasos de smoke test en una terminal local tal como se documenta.

Recomendaciones y próximos pasos (Sprint 1 - acciones prioritarias)
1. Definir contratos (interfaces) en `src/adapters/repositories`: `IAlumnosRepo`, `IAsistenciasRepo`, `IMaterialesRepo`, `IUsuariosRepo`.
2. Implementar adaptadores concretos:
   - `infrastructure/sheets/*` que usen `googleSheets.js` (o reescriban internals si se desea).
   - `infrastructure/mock/*` (mover desde `src/services/wrappers.js`).
3. Refactor de endpoints: convertir `src/pages/api/*` en controladores delgados que consuman los repositorios via DI o import.
4. Documentar y normalizar `scripts/` para smoke tests; añadir comandos concretos en README.
5. Añadir tests unitarios para adaptadores mock y un test de integración local que valide `GET /api/usuarios` y `POST /api/usuarios` en modo mock antes de tocar Sheets.

Checklist corto (para ejecutar ahora localmente)
- [ ] `cd gestor-asistencia`
- [ ] `npm install`
- [ ] En modo mock: `set USE_GOOGLE_SHEETS=false` (PowerShell: `$Env:USE_GOOGLE_SHEETS='false'`) y `npm run dev`
- [ ] En otra terminal: `node ./scripts/check-api-usuarios.js` -> debe retornar `200` y lista de usuarios (mock)

Conclusión: el repositorio ya separa razonablemente el cliente Sheets y el mock, lo que facilita la migración a una arquitectura por contratos. Para Sprint 1 propongo empezar por definir las interfaces y mover `wrappers.js` a `infrastructure/mock` para asegurar paridad de comportamiento.
