# 🔧 Diagnóstico y Solución del Bug: AlumnoPortal No Carga Asistencias

## 📋 Resumen del Problema

Al iniciar sesión, el componente `AlumnoPortal` no muestra las asistencias del alumno/padre. El usuario ve la interfaz pero sin datos.

## 🔍 Causas Identificadas

### 1. **Vinculación de Usuarios-Alumnos**
El problema más probable es que los `alumnos_ids` no estén configurados correctamente en la tabla Usuarios de Google Sheets.

**Estructura esperada en Google Sheets:**
```
Usuarios!A1:E100
Columnas: id_usuario | email | password | rol | alumnos_ids
```

**Ejemplo correcto:**
```
id_usuario          | email                    | password     | rol   | alumnos_ids
u_1770418779170     | test@example.com         | 123456       | padre | 1
u_1772841721336     | uriel@clasesapoyo.com    | uriel123     | padre | 10
u_1773170420365     | alex@clasesapoyo.com     | alex123      | padre | 12
```

### 2. **Formateo de `alumnos_ids`**
- **Con múltiples alumnos:** `"10,11,12"` (valores separados por coma, sin espacios)
- **Con un alumno:** `"10"` (valor único como texto)

### 3. **Token Parsing**
El token generado en login tiene el formato: `mock-token:USUARIO_ID:timestamp`

El endpoint `/api/alumno/asistencias` lo parsea como:
```javascript
const parts = token.split(':');
const possibleId = parts[1] || token; // Obtiene el USUARIO_ID
```

## ✅ Soluciones Implementadas

### 1. **Componente Chart Agregado**
✅ Nuevo archivo: `src/components/AttendanceChart.jsx`
- Gráfica de barras con máximo 2 barras (Presentes vs Faltas)
- Muestra estadísticas visuales de asistencia
- Compatible con Preact/Astro

### 2. **Integración en AlumnoPortal.jsx**
✅ Cambios realizados:
```jsx
// Importar
import AttendanceChart from './AttendanceChart.jsx';

// Usar en JSX
<AttendanceChart 
  presentes={presentes} 
  faltas={faltas} 
  pendientes={pendientes}
  className="w-full"
/>
```

### 3. **Script de Diagnóstico Creado**
✅ Nuevo archivo: `scripts/debug-asistencias.js`

**Uso:**
```bash
# Con valores por defecto
npm run debug:asistencias

# Con credenciales personalizadas
BASE_URL=http://localhost:4321/api \
TEST_EMAIL=uriel@clasesapoyo.com \
TEST_PASSWORD=uriel123 \
node scripts/debug-asistencias.js

# Con token existente
TEST_TOKEN=mock-token:u_1772841721336:1234567890 \
node scripts/debug-asistencias.js
```

**Output esperado:**
```
✅ Login exitoso
✅ Alumnos encontrados
✅ Asistencias encontradas
```

## 🛠️ Pasos para Resolver el Bug

### Paso 1: Ejecutar Diagnóstico
```bash
node scripts/debug-asistencias.js
```

### Paso 2: Verificar Estructura de Usuarios en Google Sheets

**Si el diagnóstico falla con:**
- "❌ Error obteniendo alumnos" → Check `alumnos_ids` en Usuarios
- "❌ Error obteniendo asistencias" → Check vinculación usuario-alumno

### Paso 3: Corrección en Google Sheets

**Asegurese que:**
1. La hoja "Usuarios" existe en el Google Sheet
2. El encabezado tiene: `id_usuario`, `email`, `password`, `rol`, `alumnos_ids`
3. Cada usuario padre tiene sus alumnos listados en `alumnos_ids`

**Ejemplo completo:**
```
TABLA: Usuarios (A1:E10)

id_usuario          email                  password   rol    alumnos_ids
u_1770418779170     test@example.com       123456     padre  1
u_1772841721336     uriel@clasesapoyo.com  uriel123   padre  10
u_1773170420365     alex@clasesapoyo.com   alex123    padre  12
admin_01            admin@clasesapoyo.com  admin123   admin  
u_1773084737803     veronica@clasesapoyo.com veronica123 padre 11
```

### Paso 4: Verificar Estructura de Alumnos
```
TABLA: Alumnos (A1:H100)

id_alumno  nombre                    edad  curso          telefono_padre  materias      clases_compradas  horas
1          Juan Pérez                16    4to Secundaria +51987654321    Matemáticas   10                1
10         Uriel Carlos Vargas Ali   8     3ro de primaria 75158569       Lectura       12                1
12         Alex Mamani Choque        17    6to de secundaria 74808595     Física        12                1
```

### Paso 5: Verificar Estructura de Asistencias
```
TABLA: Asistencias (A1:F100)

id_asistencia  id_alumno  fecha      hora    estado    observaciones
1              10         03/03/2026  15:00  Presente  Clase 1
2              10         05/03/2026  15:00  Presente  Clase 2
3              10         12/03/2026  15:00  Falta     No asistió
```

## 🧪 Prueba Manual en Navegador

### 1. Abrir DevTools (F12)
### 2. En Console, ejecutar:
```javascript
// Login
await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'uriel@clasesapoyo.com', 
    password: 'uriel123' 
  })
}).then(r => r.json()).then(d => {
  console.log('Login:', d);
  localStorage.setItem('auth_token', d.token);
});

// Obtener alumnos
await fetch('/api/usuario/alumnos', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);

// Obtener asistencias
await fetch('/api/alumno/asistencias', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

## 📊 Gráfica de Asistencia

La nueva gráfica muestra:
- **Verde:** Presentes (barra izquierda)
- **Rojo:** Faltas (barra derecha)
- **Gris:** Pendientes (solo en leyenda)
- **Total:** Suma de presentes + faltas

### Características
✅ Máximo 2 barras (Presentes vs Faltas)
✅ Canvas-based (sin dependencias externas)
✅ Responsivo
✅ Leyenda con información adicional

## 🚀 Endpoints Clave

### 1. `/api/auth/login` (POST)
```json
Request: { "email": "uriel@clasesapoyo.com", "password": "uriel123" }
Response: { "token": "mock-token:u_1772841721336:1234567890", "alumno": {...} }
```

### 2. `/api/usuario/alumnos` (GET)
```
Headers: Authorization: Bearer TOKEN
Response: { "alumnos": [...], "isMultiAlumno": true/false }
```

### 3. `/api/alumno/asistencias` (GET)
```
Headers: Authorization: Bearer TOKEN
Params: ?page=1&pageSize=10&alumno_id=10 (opcional)
Response: {
  "meta": { "total": 15, "presentes": 10, "faltas": 2, "pendientes": 3 },
  "data": [...asistencias...],
  "alumno": {...}
}
```

## 📝 Notas Importantes

1. **Token Format:** El sistema usa `mock-token:ID:timestamp`. En producción debería usar JWT.
2. **Google Sheets:** Asegurar que `GOOGLE_SHEET_ID` está configurado en `.env`
3. **USE_GOOGLE_SHEETS:** Verificar que `USE_GOOGLE_SHEETS=true` en `.env`
4. **Credenciales:** Las credenciales de Google Sheets deben tener permisos de lectura en el documento.

## 🆘 Troubleshooting

| Síntoma | Causa | Solución |
|---------|-------|----------|
| "No autenticado" | Token no enviado | Check cookie `session` en Network |
| "Token inválido" | Usuario no existe | Verify `id_usuario` matches |
| "Sin alumnos asociados" | `alumnos_ids` vacío | Populate `alumnos_ids` in Usuarios |
| 0 asistencias | No datos en Asistencias sheet | Add test records |
| Gráfica vacía | Presentes=0, Faltas=0 | Agregar datos de asistencia |

## 📈 Métricas de Éxito

✅ Usuario puede iniciar sesión  
✅ `/api/usuario/alumnos` devuelve lista de alumnos  
✅ `/api/alumno/asistencias` devuelve registros de asistencia  
✅ AlumnoPortal muestra datos  
✅ AttendanceChart se renderiza con datos  
✅ Estadísticas de presentes/faltas son correctas  
