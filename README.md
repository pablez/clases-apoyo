# Gestor Asistencia — Configuración y despliegue seguro

## 📋 Resumen
**Gestor Asistencia** es una aplicación web para gestión de asistencia educativa integrada con Google Sheets. Este documento detalla cómo configurar credenciales de manera segura, desplegar localmente y en Netlify.

---

## 🗂️ Sprints (resumen rápido)

Sprint 0 — Hotfix de seguridad (COMPLETADO)
- Objetivo: eliminar credenciales expuestas y asegurar despliegues.
- Entregables: `README.md` con guía, `.gitignore` actualizado, endpoint `/api/test-credentials` validado.

Sprint 1 — Base operacional y saneamiento (Pendiente)
- Objetivo: soportar `GOOGLE_SERVICE_ACCOUNT_JSON` y sanitizar logs.
- Tareas: aceptar JSON single-line o Base64, remover logs que muestren `private_key`, actualizar `.env.example`.

Sprint 2 — Autenticación y validación (Planificado)
- Objetivo: reemplazar `mock-token` por JWT/ sesiones y añadir validación con `zod`.

Sprint 3 — Resiliencia: cache y reintentos (Planificado)
- Objetivo: cachear lecturas, añadir reintentos con backoff.

Sprint 4 — Escritos asíncronos y colas (Planificado)
- Objetivo: desacoplar escrituras con cola (ej.: `bullmq`) y worker.

Sprint 5 — Calidad, CI y documentación (Planificado)
- Objetivo: añadir detección de secretos en CI, linters y tests integrados.

Sprint 6 — Escala y migración (Opcional)
- Objetivo: preparar migración a una DB real y añadir observabilidad.

---


## 🔐 Credenciales y variables de entorno

### ⚠️ **Importante: Sin credenciales en el repositorio**
El repositorio **NO incluye** archivos de credenciales (como `educacion-llave.json`). Las credenciales deben inyectarse como variables de entorno en tiempo de ejecución.

### Variable requerida: `GOOGLE_SERVICE_ACCOUNT_JSON`

Esta variable debe contener el JSON completo del service account de Google Cloud, en **una sola línea** (sin saltos de línea).

**Formato válido:**
```json
{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"..."}
```

### Cómo obtener el JSON del service account:
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto
3. Ve a **IAM & Admin > Service Accounts**
4. Selecciona la cuenta de servicio
5. En la pestaña **Keys**, haz clic en **Create key > JSON**
6. Se descargará un archivo JSON

---

## 🖥️ Ejecución local

### Opción 1: Con PowerShell (Windows)
```powershell
# Importar el JSON descargado como variable de entorno
$env:GOOGLE_SERVICE_ACCOUNT_JSON = Get-Content ".\educacion-llave.json" -Raw

# Verifica la variable
Write-Host $env:GOOGLE_SERVICE_ACCOUNT_JSON | Select-Object -First 50

# Instala dependencias y ejecuta
npm install
npm run dev
```

### Opción 2: Con archivo `.env.local` (más seguro)
1. Crea un archivo `.env.local` en la raíz del proyecto:
   ```
   GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   GOOGLE_SHEET_ID=tu_id_de_hoja
   ```
2. **IMPORTANTE:** Añade `.env.local` a `.gitignore` si no está ya ahí
3. Ejecuta:
   ```
   npm install
   npm run dev
   ```

### Validar configuración
Accede a `http://localhost:3000/api/test-credentials` para validar que:
- ✅ La variable está configurada
- ✅ El JSON es válido
- ✅ Contiene los campos requeridos (`private_key`, `client_email`, etc.)

**Salida esperada:**
```json
{
  "timestamp": "2026-03-13T10:30:00.000Z",
  "hasVariable": true,
  "validation": {
    "success": true,
    "message": "JSON válido ✅"
  },
  "parsed": {
    "type": "service_account",
    "project_id": "...",
    "client_email": "...",
    "hasPrivateKey": true
  }
}
```

---

## 🚀 Despliegue en Netlify

### 1. Configurar variables en Netlify
1. Ve a tu sitio en Netlify
2. **Site settings > Build & deploy > Environment > Edit variables**
3. Añade estas variables:
   - **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON`
     **Value:** (pega el JSON en una línea, sin saltos de línea)
   - **Key:** `GOOGLE_SHEET_ID`
     **Value:** El ID de tu hoja de cálculo

**⚠️ IMPORTANTE:** Netlify usa un editor de texto simple. Si el JSON contiene comillas anidadas, asegúrate de usar escape correcto o una herramienta para convertir a base64 (opcional pero recomendado).

### 2. Deploy automático
```bash
# Sincroniza con tu repositorio
git push origin main
# Netlify desplegará automáticamente
```

### 3. Verificar después del deploy
Accede a `https://tu-sitio.netlify.app/api/test-credentials` para comprobar que las credenciales se cargan correctamente.

---

## 🔄 Rotación de credenciales (procedimiento estándar)

Si sospechas que las credenciales fueron expuestas o deseas rotarlas:

### Paso 1: Crear una nueva clave en Google Cloud
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. **IAM & Admin > Service Accounts**
3. Selecciona la cuenta de servicio
4. **Keys > Create new key > JSON**
5. Descarga el nuevo JSON

### Paso 2: Revocar la clave anterior (opcional pero recomendado)
1. En la misma pantalla, busca la clave antigua
2. Haz clic en el icono de eliminación (🗑️)
3. Confirma la eliminación

### Paso 3: Actualizar variables de entorno
**Localmente:**
```powershell
$env:GOOGLE_SERVICE_ACCOUNT_JSON = Get-Content ".\educacion-llave-nueva.json" -Raw
```

**En Netlify:**
1. Edita la variable `GOOGLE_SERVICE_ACCOUNT_JSON` con el nuevo JSON
2. Espera a que Netlify redeploy (automático si estás enlazado con Git)

### Paso 4: Verificar
Accede nuevamente a `/api/test-credentials` y confirma que la nueva clave funciona.

---

## ✅ Checklist de seguridad (Sprint 0)

- [ ] Archivo `educacion-llave.json` **no está** en el repositorio
- [ ] `.gitignore` contiene `educacion-llave.json` para evitar futuros commits accidentales
- [ ] Endpoint `src/pages/api/test-credentials.js` funciona y valida credenciales
- [ ] Variables de entorno configuradas localmente (PowerShell o `.env.local`)
- [ ] Variables de entorno configuradas en Netlify
- [ ] Test de conexión a Google Sheets desde `/api/test-credentials` devuelve ✅
- [ ] Si fue necesario, se ejecutó rotación de credenciales en GCP
- [ ] Se confirmó que el flujo de login/asistencia funciona correctamente

---

## 📁 Estructura relevante
```
gestor-asistencia/
├── .gitignore                          # educacion-llave.json está ignorado
├── .env.example                        # Plantilla de variables (SIN secretos reales)
├── .env.local                          # Local ONLY (no se sincroniza)
├── README.md                           # Este archivo
├── src/
│   ├── pages/
│   │   └── api/
│   │       ├── test-credentials.js     # ✅ Valida credenciales
│   │       ├── auth/
│   │       │   └── login.js
│   │       └── alumnos/
│   │           └── ...
│   ├── services/
│   │   ├── googleSheets.js             # Integración con Google Sheets
│   │   └── ...
│   └── ...
└── docs/
    └── plan.md                          # Sprint backlog
```

---

## 🆘 Troubleshooting

### Error: `GOOGLE_SERVICE_ACCOUNT_JSON no está definido`
**Solución:** Verifica que la variable esté definida en tu entorno actual.
- PowerShell: `Write-Host $env:GOOGLE_SERVICE_ACCOUNT_JSON`
- Node/Netlify: Revisa Site settings > Build & deploy > Environment

### Error: `JSON inválido` en `/api/test-credentials`
**Solución:** El JSON probablemente contiene saltos de línea. Cópialo en una herramienta como [JSON Minifier](https://www.minifycode.com/json-minifier/) para convertirlo a una sola línea.

### Error: `private_key` no encontrado
**Solución:** Asegúrate que el JSON descargado de Google Cloud contiene `private_key`. Si lo descargaste en otro formato, descárgalo nuevamente como **JSON**.

### Sheets no se actualizan localmente
**Solución:** 
1. Verifica que `GOOGLE_SHEET_ID` es correcto (en el archivo `.env.local`)
2. Verifica que la cuenta de servicio tiene permisos en la Hoja de cálculo (la hoja debe haber sido compartida con `client_email`)
3. Accede a `/api/test-credentials` para diagnosticar

---

## 📝 Cambios recientes (Sprint 0 - Hotfix de seguridad)

- ✅ Eliminado `educacion-llave.json` del árbol del repositorio
- ✅ Creado este `README.md` con guía completa
- ✅ Validado endpoint `/api/test-credentials.js` para diagnóstico
- ✅ Documentado estandar de rotación de credenciales
- ⏳ Recomendado: ejecutar rotación de clave en Google Cloud IAM si fue comprometida

---

## 📞 Soporte
Para más detalles sobre la arquitectura y estructura del proyecto, consulta:
- [ARCHITECTURE.md](src/ARCHITECTURE.md)
- [IMPLEMENTATION_SUMMARY.md](src/IMPLEMENTATION_SUMMARY.md)
- [Sprint backlog](docs/plan.md)
