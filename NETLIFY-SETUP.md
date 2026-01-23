# Configuración de Variables de Entorno en Netlify

## Problema Detectado
Las variables de entorno NO están configuradas en Netlify. Necesitas agregar 3 variables.

## Paso 1: Obtener el JSON de credenciales

En tu terminal local (PowerShell), ejecuta este comando para obtener el JSON en una sola línea:

```powershell
node -e "const fs = require('fs'); const json = fs.readFileSync('./educacion-llave.json', 'utf8'); console.log(JSON.stringify(JSON.parse(json)));"
```

**COPIA TODO** el resultado que empieza con `{"type":"service_account"...` hasta el final `...}"`.

## Paso 2: Ir a Netlify

1. Ve a: https://app.netlify.com
2. Inicia sesión con tu cuenta
3. Selecciona tu sitio: **clases-de-apoyo**

## Paso 3: Agregar Variables de Entorno

1. En el menú lateral, ve a: **Site settings**
2. Busca la sección: **Environment variables** (o **Build & deploy** → **Environment**)
3. Haz clic en: **Add a variable** o **Edit variables**

## Paso 4: Agregar las 3 Variables

### Variable 1: USE_GOOGLE_SHEETS
- **Key:** `USE_GOOGLE_SHEETS`
- **Value:** `true`
- Scope: Todas (All, Same value for all deploy contexts)

### Variable 2: GOOGLE_SHEET_ID
- **Key:** `GOOGLE_SHEET_ID`
- **Value:** `13MCWCQV1VL9PBzByW-mJo0mbenYSeX_OTf9MJVwDO10`
- Scope: Todas (All, Same value for all deploy contexts)

### Variable 3: GOOGLE_SERVICE_ACCOUNT_JSON
- **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON`
- **Value:** `{"type":"service_account","project_id":"educacion-485101",...}` (TODO el JSON que copiaste en el Paso 1)
- Scope: Todas (All, Same value for all deploy contexts)

**MUY IMPORTANTE:** 
- El JSON debe estar en **UNA SOLA LÍNEA** (sin saltos de línea)
- Copia TODO desde el primer `{` hasta el último `}`
- NO agregues espacios adicionales al inicio o final

## Paso 5: Guardar y Redesplegar

1. Haz clic en: **Save**
2. Ve a la pestaña: **Deploys**
3. Haz clic en: **Trigger deploy** → **Clear cache and deploy site**
4. Espera a que termine el deploy (verás el status "Published")

## Paso 6: Verificar

1. Ve a: https://clases-de-apoyo.netlify.app/api/health
2. Deberías ver:
   ```json
   {
     "status": "ok",
     "message": "✅ Todo configurado correctamente",
     "environment": {
       "USE_GOOGLE_SHEETS": true,
       "GOOGLE_SHEET_ID": "13MCWCQV1V...",
       "hasCredentials": true,
       "credentialType": "JSON"
     }
   }
   ```

## Paso 7: Probar los Materiales

1. Ve a: https://clases-de-apoyo.netlify.app/materiales
2. Deberías ver tus materiales cargados desde Google Sheets

## Solución de Problemas

### Si sigue sin funcionar después de configurar:

1. **Verifica que las variables estén guardadas:**
   - Ve a Site settings → Environment variables
   - Confirma que las 3 variables existan

2. **Verifica el JSON:**
   - Debe empezar con `{"type":"service_account"`
   - Debe terminar con `"universe_domain":"googleapis.com"}`
   - NO debe tener saltos de línea

3. **Fuerza un nuevo deploy:**
   - Deploys → Options → Clear cache and retry deploy

4. **Revisa los logs:**
   - Functions → Ver logs de las funciones
   - Busca errores relacionados con Google Sheets

### Si ves error de permisos en Google Sheets:

1. Ve a tu Google Sheet: https://docs.google.com/spreadsheets/d/13MCWCQV1VL9PBzByW-mJo0mbenYSeX_OTf9MJVwDO10
2. Haz clic en "Compartir"
3. Agrega el email: `curso-apoyo@educacion-485101.iam.gserviceaccount.com`
4. Dale permisos de "Editor"
5. Guarda

## Recursos Adicionales

- Panel de Netlify: https://app.netlify.com
- Health Check: https://clases-de-apoyo.netlify.app/api/health
- Documentación de Netlify Environment Variables: https://docs.netlify.com/environment-variables/overview/
