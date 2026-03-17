# 📊 Estructura Correcta de Google Sheets para Gestor-Asistencia

## Resumen General

Para que el sistema funcione correctamente, debes tener 3 hojas principales en tu Google Sheet:

1. **Alumnos**: Información de estudiantes
2. **Usuarios**: Información de padres/administradores y sus alumnos vinculados
3. **Asistencias**: Registro de asistencias

## 🎓 HOJA 1: Alumnos

### Encabezados (Fila 1)
```
A              B         C    D                 E                F        G                 H
id_alumno      nombre    edad curso             telefono_padre   materias clases_compradas  horas
```

### Datos de Ejemplo (Filas 2+)
```
id_alumno  nombre                      edad  curso               telefono_padre  materias                          clases_compradas  horas
1          Juan Pérez                  16    4to Secundaria      51987654321     Matemáticas                       10                1
4          Joshua Samuel Vidaurre      14    3ro de Secundaria   61597405        Inglés, Matemáticas              12                2
7          Robin Matias Chávez         8     4to de primaria     68484810        Matemáticas, Lectura, escritura  8                 1
9          Rosalinda Chura Montero     13    1ro de secundaria   63851983        Matemáticas                       4                 2
10         Uriel Carlos Vargas Ali     8     3ro de primaria     75158569        Lectura, escritura                12                1
11         Alexandra Karlos            15    6to de secundaria   76430047        Matemáticas                       10                1
12         Alex Mamani Choque          17    6to de secundaria   74808595        Física, Matemáticas, Química      12                1
```

### Notas sobre esta tabla
- `id_alumno`: Identificador único (número)
- `nombre`: Nombre completo del estudiante
- `edad`: Edad en años
- `curso`: Nivel educativo
- `telefono_padre`: Teléfono de contacto (opcional)
- `materias`: Asignaturas separadas por coma
- `clases_compradas`: Número de clases pagadas
- `horas`: Duración de cada clase en horas

---

## 👥 HOJA 2: Usuarios (⚠️ MÁS IMPORTANTE)

### Encabezados (Fila 1)
```
A              B             C         D     E
id_usuario     email         password  rol   alumnos_ids
```

### Datos de Ejemplo (Filas 2+)
```
id_usuario          email                      password      rol    alumnos_ids
admin_01            admin@clasesapoyo.com      admin123      admin  
u_1770418779170     test@example.com           123456        padre  1
u_1770515733697     diego@clasesapoyo.com      diego123      padre  4
u_1772564761769     matias@clasesdeapoyo.com   matias123     padre  7
u_1772675894744     padreprueba@clasesapoyo.com             padre  8
u_1772677733999     rosalinda@clasesapoyo.com  rosalinda123  padre  9
u_1772841721336     uriel@clasesapoyo.com      uriel123      padre  10
u_1773084737803     veronica@clasesapoyo.com   veronica123   padre  11
u_1773170420365     alex@clasesapoyo.com       alex123       padre  12
```

### ⚠️ PUNTOS CRÍTICOS - Leer Obligatorio

1. **El campo `alumnos_ids` DEBE estar poblado**
   - Para usuario padre: poner el ID del alumno (ejemplo: `10`)
   - Para múltiples alumnos: separar por coma sin espacios (ejemplo: `10,11,12`)
   - Para admin: dejar vacío

2. **Los valores en `alumnos_ids` DEBEN corresponder exactamente** con los `id_alumno` de la tabla Alumnos
   - ✅ CORRECTO: usuario tiene `alumnos_ids=10` y existe alumno con `id_alumno=10`
   - ❌ INCORRECTO: usuario tiene `alumnos_ids=10` pero no existe alumno con ese ID

3. **El campo `id_usuario` debe ser único**
   - Formato recomendado: `u_` + timestamp (ejemplo: `u_1772841721336`)
   - O simplemente: `usuario_1`, `usuario_2`, etc.

4. **El email debe ser EXACTAMENTE igual** al que usa para login
   - El sistema busca por email para encontrar el usuario
   - Diferenciar mayúsculas/minúsculas

### Ejemplo de Configuración Correcta

Usuario padre que tiene 1 alumno:
```
id_usuario      | email                   | password   | rol   | alumnos_ids
u_1772841721336 | uriel@clasesapoyo.com   | uriel123   | padre | 10
```

Usuario padre que tiene múltiples alumnos:
```
id_usuario      | email                   | password   | rol   | alumnos_ids
u_1773084737803 | veronica@clasesapoyo.com | veronica123 | padre | 11,12
```

Admin que ve todas las asistencias:
```
id_usuario | email                  | password | rol   | alumnos_ids
admin_01   | admin@clasesapoyo.com  | admin123 | admin | 
```

---

## 📋 HOJA 3: Asistencias

### Encabezados (Fila 1)
```
A              B         C      D     E         F
id_asistencia  id_alumno fecha  hora  estado    observaciones
```

### Datos de Ejemplo (Filas 2+)
```
id_asistencia  id_alumno  fecha      hora    estado    observaciones
1              10         03/03/2026  15:00  Presente  Cancelo los 200bs
2              10         05/03/2026  15:00  Presente  Tarea de matemáticas
3              10         10/03/2026  15:00  Presente  Solución de problemas
4              10         12/03/2026  15:00  Falta     No asistió
5              10         17/03/2026  15:00  Pendiente Clase programada
6              11         09/03/2026  14:00  Presente  Ecuaciones de la recta
7              11         12/03/2026  14:00  Presente  Clase programada
8              11         14/03/2026  14:00  Pendiente Clase programada
9              12         10/03/2026  15:00  Presente  Física: electricidad
10             12         11/03/2026  15:00  Presente  Clase programada
11             12         13/03/2026  15:00  Falta     No asistió
```

### Notas sobre esta tabla
- `id_asistencia`: Identificador único autoincremental
- `id_alumno`: DEBE corresponder con un alumno existente en tabla Alumnos
- `fecha`: Formato DD/MM/YYYY (obligatorio)
- `hora`: Formato HH:MM (ej: 15:00)
- `estado`: SOLO puede ser: "Presente", "Falta", o "Pendiente"
- `observaciones`: Texto libre con notas (opcional)

### Restricciones Importantes
- El `id_alumno` DEBE existir en tabla Alumnos
- El `fecha` DEBE estar en formato DD/MM/YYYY
- El `estado` DEBE ser exactamente uno de: "Presente", "Falta", "Pendiente"

---

## 🔗 Validación de Integridad

Antes de usar el sistema, verifica:

### 1. Integridad Referencial
```
✓ Cada id_alumno en Asistencias existe en tabla Alumnos
✓ Cada alumnos_ids en Usuarios existe en tabla Alumnos
✓ No hay duplicados de id_usuario
✓ No hay duplicados de id_alumno
```

### 2. Formatos Correctos
```
✓ Fechas en formato DD/MM/YYYY
✓ Horas en formato HH:MM
✓ Estados EXACTAMENTE: "Presente", "Falta", "Pendiente"
✓ Emails válidos y únicos
```

### 3. Campos Requeridos
```
ALUMNOS:
✓ id_alumno (requerido)
✓ nombre (requerido)
✓ edad (requerido)
✓ curso (requerido)

USUARIOS:
✓ id_usuario (requerido)
✓ email (requerido)
✓ rol (requerido: admin, padre)
✓ alumnos_ids (requerido para padres, vacío para admin)

ASISTENCIAS:
✓ id_asistencia (requerido)
✓ id_alumno (requerido, debe existir en Alumnos)
✓ fecha (requerido, formato DD/MM/YYYY)
✓ estado (requerido: Presente, Falta, Pendiente)
```

---

## 🧪 Test Quick

Después de configurar, verifica con este query en Console del navegador:

```javascript
// 1. Login
fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'uriel@clasesapoyo.com', 
    password: 'uriel123' 
  })
}).then(r => r.json()).then(d => {
  console.log('✅ Login OK:', d.alumno);
  localStorage.setItem('auth_token', d.token);
});

// 2. Después de 2 segundos, obtener alumnos
await new Promise(r => setTimeout(r, 2000));
fetch('/api/usuario/alumnos').then(r => r.json()).then(d => {
  console.log('✅ Alumnos:', d);
});

// 3. Después de 2 segundos más, obtener asistencias
await new Promise(r => setTimeout(r, 2000));
fetch('/api/alumno/asistencias').then(r => r.json()).then(d => {
  console.log('✅ Asistencias:', d.meta);
});
```

---

## 📁 Archivo Exportado CSV

Si quieres crear esto desde CSV e importar a Google Sheets:

### Alumnos.csv
```csv
id_alumno,nombre,edad,curso,telefono_padre,materias,clases_compradas,horas
1,Juan Pérez,16,4to Secundaria,51987654321,Matemáticas,10,1
4,Joshua Samuel Vidaurre,14,3ro de Secundaria,61597405,Inglés; Matemáticas,12,2
```

### Usuarios.csv
```csv
id_usuario,email,password,rol,alumnos_ids
admin_01,admin@clasesapoyo.com,admin123,admin,
u_1772841721336,uriel@clasesapoyo.com,uriel123,padre,10
u_1773084737803,veronica@clasesapoyo.com,veronica123,padre,11,12
```

### Asistencias.csv
```csv
id_asistencia,id_alumno,fecha,hora,estado,observaciones
1,10,03/03/2026,15:00,Presente,Calcelo los 200bs
2,10,05/03/2026,15:00,Presente,Tarea realizada
```

---

## 🚀 Checklist Final

Antes de usar el sistema:

- [ ] Tabla Alumnos creada con estructura correcta
- [ ] Tabla Usuarios creada con estructura correcta
- [ ] Tabla Asistencias creada con estructura correcta
- [ ] Todos los `alumnos_ids` en Usuarios están poblados
- [ ] Todos los `id_alumno` en Usuarios existen en tabla Alumnos
- [ ] Todos los `id_alumno` en Asistencias existen en tabla Alumnos
- [ ] Fechas en formato correcto (DD/MM/YYYY)
- [ ] Estados EXACTOS: "Presente", "Falta", "Pendiente"
- [ ] Emails son únicos
- [ ] IDs de usuario son únicos
- [ ] LOGIN funciona correctamente
- [ ] Script `npm run debug:asistencias` pasa todos los tests

---

**Última actualización:** 16 de Marzo de 2026
