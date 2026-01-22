# Configuración de Google Sheets

## ✅ Archivos ya configurados

Ya tienes el archivo de credenciales: `educacion-llave.json`

## 📋 Pasos para conectar tu hoja de cálculo

### 1. Crear la hoja de cálculo en Google Sheets

1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea una nueva hoja de cálculo
3. Nómbrala como quieras (ej: "Gestor Educativo")
4. Copia el **ID de la hoja** de la URL:
   ```
   https://docs.google.com/spreadsheets/d/TU_SHEET_ID_AQUI/edit
   ```

### 2. Configurar las hojas (pestañas)

Crea 3 hojas (pestañas) con estos nombres exactos y columnas:

#### Hoja 1: `Alumnos`
Columnas en la fila 1 (A1:G1):
```
id | nombre | edad | curso | telefono_padre | materias | clases_compradas
```

#### Hoja 2: `Asistencias`
Columnas en la fila 1 (A1:F1):
```
id | alumnoId | fecha | hora | estado | observaciones
```

#### Hoja 3: `Materiales`
Columnas en la fila 1 (A1:F1):
```
id | materia | titulo | descripcion | url_recurso | imagen_url
```

### 3. Compartir la hoja con el service account

1. En Google Sheets, haz clic en **Compartir** (botón superior derecho)
2. Agrega este email como **Editor**:
   ```
   curso-apoyo@educacion-485101.iam.gserviceaccount.com
   ```
3. Haz clic en **Compartir**

### 4. Configurar variables de entorno

Edita el archivo `.env` y actualiza:

```env
# ==== GOOGLE SHEETS ====
USE_GOOGLE_SHEETS=true
GOOGLE_SHEET_ID=TU_SHEET_ID_AQUI
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./educacion-llave.json
```

Reemplaza `TU_SHEET_ID_AQUI` con el ID que copiaste en el paso 1.

### 5. Reiniciar el servidor

```bash
# Detener el servidor (Ctrl+C)
# Reiniciar
npm run dev
```

## 🎯 Probando la conexión

1. Ve a `http://localhost:4321/admin` (contraseña: `admin123`)
2. Intenta crear un alumno
3. Verifica que aparezca en tu Google Sheet
4. Prueba editar y eliminar

## ⚠️ Solución de problemas

### Error: "Google Sheets no configurado"
- Verifica que las variables de entorno estén bien configuradas en `.env`
- Asegúrate de que `USE_GOOGLE_SHEETS=true`

### Error: "Permission denied"
- Verifica que compartiste la hoja con el email del service account
- El email debe ser editor, no solo visor

### Error: "Range not found"
- Verifica que los nombres de las hojas sean exactos: `Alumnos`, `Asistencias`, `Materiales`
- Verifica que las columnas estén en la fila 1

## 📊 Ejemplo de datos iniciales

Puedes agregar estos datos de ejemplo directamente en tu Google Sheet:

### Alumnos:
```
1 | Juan Pérez | 16 | 4to Secundaria | +591 74325440 | Matemáticas, Física | 12
2 | María López | 15 | 3ro Secundaria | +591 74325441 | Química | 8
```

### Materiales:
```
1 | Matemáticas | Álgebra Lineal | Conceptos básicos | https://ejemplo.com | https://via.placeholder.com/300x200
```

## 🔄 Modo desarrollo (sin Google Sheets)

Si quieres probar sin Google Sheets primero:

```env
USE_GOOGLE_SHEETS=false
```

Esto usará el archivo `data/mock.json` para almacenamiento local.
