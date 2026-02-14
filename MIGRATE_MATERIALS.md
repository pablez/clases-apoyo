# MIGRACIÓN: Añadir campos `nivel` y `grado` a Materiales

Pasos:
1. Abrir la hoja de Google Sheets llamada `Materiales`.
2. Asegurarse de que las columnas estén en este orden:
   - A: id
   - B: materia
   - C: nivel
   - D: grado
   - E: titulo
   - F: descripcion
   - G: url_recurso
   - H: imagen_url
3. Si no existe la columna `nivel` o `grado`, insertar dos columnas en la posición C y D respectivamente.
4. Rellenar los valores `nivel` y `grado` según corresponda (puede dejarse vacío si no aplica).
5. Guardar y verificar desde la aplicación: ejecutar el script de prueba `node test-google-sheets.js` para comprobar lectura/escritura en `Materiales!A1:H100`.
6. Opcional: ejecutar una migración masiva desde JSON/CSV hacia la hoja usando la herramienta local o un script que suba filas al rango `A1:H100`.

Notas de seguridad:
- Hacer una copia del spreadsheet antes de ejecutar actualizaciones masivas.
- Verificar que la cuenta de servicio tenga permisos de editor sobre la hoja.

Registro de cambios aplicados en el repo:
- Backend: `src/infrastructure/sheets/materiales.js` ahora mapea A..H e incluye `nivel` y `grado`.
- UI: se añadieron campos `nivel` y `grado` en `MaterialesManager` y se muestran en la UI pública y en la tarjeta.
- Mock y tests: `src/infrastructure/mock/index.js` y `test-google-sheets.js` actualizados para reflejar el nuevo esquema.
