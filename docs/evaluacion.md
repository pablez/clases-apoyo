Arquitectura recomendada (encaja con Astro + Sheets/Drive)
Tu mejor fit es Hexagonal/Clean Architecture (ya la empezaste), con esta idea central:

Dominio (src/core): entidades (Alumno, Usuario) + reglas (validaciones, invariantes).
Aplicación (src/application): Casos de uso (ej. ListAlumnos, CreateAlumno, Login, GetUsuarioAlumnos) que orquestan todo.
Infraestructura (src/infrastructure): implementaciones concretas (Google Sheets/Drive, mocks).
Presentación (src/pages + src/presentation):
src/pages/api/** = Controllers (traducen HTTP → request DTO → usecase → response DTO).
src/pages/*.astro y src/presentation/components/** = UI (islands Preact).
Patrones de diseño concretos para este proyecto
Repository Pattern (clave):
Interfaces en src/core/repositories/* (ya tienes IUsuarioRepository.js).
Implementaciones: SheetsUsuariosRepository, SheetsAlumnosRepository, Mock*Repository.
Adapter / Anti-Corruption Layer:
Un único adaptador “bajo nivel” para Google: GoogleSheetsGateway (wrap de googleapis) que exponga operaciones simples (getRange, append, update, batchUpdate).
Los repositorios de Sheets usan ese gateway; así el resto nunca toca googleapis.
Strategy + Factory (selección Sheets vs Mock):
En vez de resolveRepo() por endpoint, crea un composition root (ej. src/infrastructure/container.js) que arme dependencias según USE_GOOGLE_SHEETS.
DTO + Mapper:
DTOs de entrada/salida en src/application/dtos/ (ya existe) para no “filtrar” estructura de Sheets a la API.
Mappers (Sheets row ↔ entidad) en src/infrastructure/sheets/mappers/*.
Service Layer (aplicación):
Para cosas transversales: auth, auditoría, cache, validación.
Cache-Aside (muy recomendable con Sheets):
Cachear lecturas frecuentes (usuarios/alumnos/materiales) con TTL.
Retry con backoff + Circuit Breaker (resiliencia):
Retry controlado para 429/5xx de Google.
Circuit breaker simple para evitar “matar” la app cuando Google falla.
Idempotency para escrituras:
En append/update, usar un requestId (por ejemplo en una columna) para no duplicar filas si Netlify reintenta.
RBAC/Authorization:
Centralizar extractToken, requireRole, requireAdmin en src/shared/utils/AuthUtils.js (ya existe) y usarlo desde controllers.
Caso especial: “base de datos Excel en Drive”
Tienes 2 enfoques válidos (elige uno como estándar del sistema):

Opción A (recomendada): Google Sheets como fuente de verdad

Subes el Excel a Drive pero lo conviertes a Sheets (manual o automatizado) y el sistema solo lee Sheets.
Ventaja: todo tu código actual ya está alineado.
Opción B: Excel como fuente, lectura vía Drive API

Usar Drive API para files.export (a CSV) y luego parsear.
Recomendación arquitectónica: eso vive como DriveExcelGateway + repositorios Excel*Repository (otra estrategia), sin contaminar casos de uso.
Plan de trabajo (arquitectura/patrones, incremental y seguro)
Fase 1 — “Unificar arquitectura real” (alto impacto, poco riesgo)
Mover la lógica de resolveRepo() a un container único.
Hacer que todos los endpoints src/pages/api/** llamen usecases, no repos directos.
Fase 2 — Repositorios completos + mappers
Formalizar IAlumnosRepository, IUsuariosRepository, etc. y sus implementaciones Sheets/Mock.
Fase 3 — Resiliencia y performance
Cache-Aside + retries/backoff + circuit breaker.
Fase 4 — Excel/Drive (si aplica)
Implementar DriveExcelGateway (si decides Opción B) o automatizar conversión a Sheets (si decides Opción A).