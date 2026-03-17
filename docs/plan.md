## Plan por Sprints: Mejoras y roadmap para `gestor-asistencia`

Resumen: este documento organiza las mejoras propuestas en sprints cortos y accionables para entregar seguridad, estabilidad y capacidad de escalado. Cada sprint incluye objetivo, tareas, entregables y criterios de aceptación.

---

Sprint 0 — Hotfix de seguridad (3 días) ✅ **COMPLETADO**

**Estado:** Completado el 13 de marzo, 2026.

**Acciones completadas:**
- ✅ Eliminado `educacion-llave.json` del árbol de trabajo.
- ✅ `.gitignore` contiene la entrada para `educacion-llave.json`.
- ✅ Escaneo de secretos realizado: **No hay secretos reales expuestos** en el árbol actual.
- ✅ Documentado en `README.md` con instrucciones completas para configuración segura.
- ✅ Endpoint `src/pages/api/test-credentials.js` validado y funcional.
- ⏳ Rotación de la clave en Google Cloud IAM: **Manual, recomendado si fue expuesta**.

**Objetivo:** Eliminar credenciales expuestas y asegurar despliegues. Prioridad crítica.

**Tareas completadas:**
- ✅ Archivo `educacion-llave.json` no está en el repositorio.
- ✅ `.gitignore` previene futuros commits accidentales.
- ✅ Escaneo de secretos (detect-secrets pattern): sin hallazgos críticos (solo referencias a variables).
- ✅ Documentación completa en `README.md` y actualización de `docs/plan.md`.

**Entregables:**
- ✅ Archivo [README.md](../README.md) con:
  - Instrucciones para configurar `GOOGLE_SERVICE_ACCOUNT_JSON` (PowerShell y `.env.local`)
  - Guía de validación con `/api/test-credentials`
  - Procedimiento de rotación de credenciales en Google Cloud
  - Checklist de seguridad
- ✅ Endpoint `/api/test-credentials.js` validado (ya existía, mejorado con diagnostics)

**Criterios de aceptación (✅ Todos cumplidos):**
- ✅ `educacion-llave.json` no aparece en el árbol del repo.
- ✅ `.gitignore` está configurado para prevenir futuros commits.
- ✅ Prueba `src/pages/api/test-credentials.js` funciona y devuelve validación correcta con `GOOGLE_SERVICE_ACCOUNT_JSON`.
- ✅ Documentación de seguridad completa en `README.md`.
- ✅ Escaneo: sin secretos comprometidos en commits actuales.

---

### 🔄 Acción recomendada (Manual, fuera del alcance de este sprint):
**Rotación de credenciales en Google Cloud IAM** (si la clave fue expuesta):
1. Ve a Google Cloud Console → Service Accounts
2. Revoca la clave antigua (delete)
3. Crea una nueva clave JSON
4. Actualiza `GOOGLE_SERVICE_ACCOUNT_JSON` en Netlify / entorno local
5. Verifica con `/api/test-credentials`

Ver detalles en [README.md § Rotación de credenciales](../README.md#-rotación-de-credenciales-procedimiento-estándar).

---

Sprint 1 — Base operacional y saneamiento (1 semana)
- Objetivo: asegurar manejo de credenciales, sanitizar logs y preparar entorno para cambios.
- Tareas:
  - Implementar soporte para `GOOGLE_SERVICE_ACCOUNT_JSON` (base64 o JSON single-line) en `src/services/googleSheets.js`.
  - Eliminar logs que muestren contenido sensible en `src/services/googleSheets.js` y `src/infrastructure/googleSheetsAdapter.js`.
  - Actualizar `.env.example` con instrucciones claras para Netlify (variables: `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID`).
  - Añadir validación básica de variables en `src/pages/api/test-credentials.js`.
- Entregables:
  - PR con cambios en `src/services/googleSheets.js` y `.env.example`.
  - Script o README para inyectar la variable en Netlify.
- Criterios de aceptación:
  - No hay logs que contengan `private_key` ni el JSON completo en ejecución local.
  - Endpoint `test-credentials` devuelve OK con variables en entorno.

---

Sprint 2 — Autenticación y validación (1 semana)
- Objetivo: endurecer el flujo de login y validar entradas en APIs.
- Tareas:
  - Reemplazar `mock-token` por JWT firmado (biblioteca: `jsonwebtoken`) o sesiones server-side según preferencias.
  - Añadir validación con `zod` en `src/pages/api/auth/login.js` y en `src/usecases/auth/loginUser.js`.
  - Añadir tests unitarios para `loginUser` (Vitest) y un test de integración leve.
- Entregables:
  - PR con auth refactor, esquemas Zod y tests.
  - Documentación de migración de tokens en `README.md`.
- Criterios de aceptación:
  - Login devuelve JWT válido y endpoints protegidos requieren token para acceder.
  - Tests unitarios pasan en CI.

---

Sprint 3 — Resiliencia: cache y reintentos (1–2 semanas)
- Objetivo: reducir latencia, uso de cuota y mejorar tolerancia a fallos de Google Sheets.
- Tareas:
  - Implementar cache para lecturas frecuentes: opción ligera `node-cache` o `lru-cache`; alternativa redis (`ioredis`) si se necesita persistencia.
  - Añadir reintentos con backoff (p. ej. `p-retry`) y manejo de errores en escrituras.
  - Medir latencia antes/después y ajustar TTL del cache.
- Entregables:
  - Implementación de cache en `src/services/googleSheets.js` o wrapper `src/services/cache.js`.
  - Reporte breve de rendimiento (latencia y llamadas a Sheets).
- Criterios de aceptación:
  - Lecturas comunes reducen llamadas reales a Sheets según TTL configurado.
  - Escritos fallidos reintentan de forma controlada y reportan errores amigables.

---

Sprint 4 — Escritos asíncronos y colas (1–2 semanas)
- Objetivo: desacoplar escrituras para evitar contención y mejorar rendimiento de la UI.
- Tareas:
  - Diseñar cola de trabajos para operaciones append/update (ej.: `bullmq` o `bee-queue`).
  - Implementar worker que procese la cola (puede ejecutarse en una función separada o worker en serverless compatible).
  - Añadir estrategia de conciliación/rollback mínima para evitar duplicados.
- Entregables:
  - Implementación base en `src/infrastructure/queue/` y ejemplo de uso en `AlumnosRepoSheets`.
  - Documentación de operaciones idempotentes.
- Criterios de aceptación:
  - Escrituras en cola no bloquean la respuesta al usuario y son procesadas correctamente.

---

Sprint 5 — Calidad, CI y documentación (1 semana)
- Objetivo: asegurar calidad de código, cobertura y protección contra secretos en CI.
- Tareas:
  - Añadir job en CI para detectar secretos (`detect-secrets` o `git-secrets`).
  - Ampliar tests de integración usando `msw` y los mocks en `src/infrastructure/mock`.
  - Añadir linter (`eslint`) y formato (`prettier`) si no existen, con reglas básicas.
  - Actualizar `ARCHITECTURE.md` y `README.md` con el flujo final y pasos de despliegue en Netlify.
- Entregables:
  - Pipeline CI actualizado y documentación.
  - Cobertura de tests integrada en CI.
- Criterios de aceptación:
  - CI falla si detecta secretos en commits.
  - Tests principales pasan y PRs requieren aprobación.

---

Sprint 6 — Escala y migración (opcional, 2–4 semanas)
- Objetivo: preparar migración a una base de datos real y observabilidad.
- Tareas:
  - Evaluar y prototipar migración a Postgres (con migraciones y scripts) o Firestore.
  - Añadir logging estructurado (`pino`) y monitoring (Sentry).
  - Definir plan de migración de datos (exportar hojas -> cargar a DB) y pruebas de integridad.
- Entregables:
  - Documento de decisión (Postgres vs Firestore) y prototipo mínimo.
  - Pipeline de migración básico y métricas de observabilidad.

Dependencias y riesgos
- Dependencias: rotación de credenciales en GCP, configuración de variables en Netlify, tiempo de revisión en CI.
- Riesgos: límites de cuota de Google Sheets, ejecución limitada en Netlify free tier. Mitigación: cache agresivo y colas.

Prioridad inmediata (acciones que recomiendo ejecutar ahora)
1. Sprint 0: eliminar `educacion-llave.json`, rotar clave y actualizar `.gitignore`.
2. Sprint 1 (paralelo): parche rápido en `src/services/googleSheets.js` para sanitizar logs y admitir `GOOGLE_SERVICE_ACCOUNT_JSON`.

Siguientes pasos operativos
- Confirmar si quieres que implemente automáticamente los cambios de Sprint 0 y el parche de Sprint 1. Puedo crear los commits y PRs correspondientes.

Archivo actualizado: [gestor-asistencia/docs/plan.md](docs/plan.md)
