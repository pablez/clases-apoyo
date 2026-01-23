import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const GOOGLE_SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || '';
const GOOGLE_SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '';

// Validación inicial de configuración
console.log('🔧 Configuración de Google Sheets:');
console.log('  GOOGLE_SHEET_ID:', GOOGLE_SHEET_ID ? `${GOOGLE_SHEET_ID.substring(0, 10)}...` : '❌ NO DEFINIDO');
console.log('  GOOGLE_SERVICE_ACCOUNT_JSON:', GOOGLE_SERVICE_ACCOUNT_JSON ? `✅ Definido (${GOOGLE_SERVICE_ACCOUNT_JSON.length} caracteres)` : '❌ No definido');
console.log('  GOOGLE_SERVICE_ACCOUNT_KEY_PATH:', GOOGLE_SERVICE_ACCOUNT_KEY_PATH ? `✅ ${GOOGLE_SERVICE_ACCOUNT_KEY_PATH}` : '❌ No definido');

if (!GOOGLE_SHEET_ID) {
  console.error('❌ ADVERTENCIA: GOOGLE_SHEET_ID no está configurado');
}

if (!GOOGLE_SERVICE_ACCOUNT_JSON && !GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
  console.error('❌ ADVERTENCIA: No se encontraron credenciales de Google (ni JSON ni KEY_PATH)');
}

let sheetsClient = null;

async function getGoogleSheetsClient() {
  if (sheetsClient) return sheetsClient;

  if (!GOOGLE_SHEET_ID) {
    throw new Error('GOOGLE_SHEET_ID no está configurado');
  }

  let auth;

  // OPCIÓN 1: Credenciales desde variable de entorno (PRODUCCIÓN - Netlify)
  if (GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.log('🔑 Usando credenciales desde variable de entorno GOOGLE_SERVICE_ACCOUNT_JSON');
    console.log('📏 Longitud del JSON:', GOOGLE_SERVICE_ACCOUNT_JSON.length);
    try {
      const credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON);
      console.log('✅ JSON parseado correctamente');
      console.log('📧 Service account email:', credentials.client_email);
      console.log('🔑 Project ID:', credentials.project_id);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } catch (error) {
      console.error('❌ Error al parsear GOOGLE_SERVICE_ACCOUNT_JSON:', error.message);
      throw new Error(`Error al parsear GOOGLE_SERVICE_ACCOUNT_JSON: ${error.message}`);
    }
  }
  // OPCIÓN 2: Credenciales desde archivo (DESARROLLO - local)
  else if (GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
    console.log('🔑 Usando credenciales desde archivo:', GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
    const keyPath = path.isAbsolute(GOOGLE_SERVICE_ACCOUNT_KEY_PATH) 
      ? GOOGLE_SERVICE_ACCOUNT_KEY_PATH 
      : path.resolve(process.cwd(), GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
    
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Archivo de credenciales no encontrado: ${keyPath}`);
    }

    auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  } else {
    throw new Error(
      'No hay credenciales configuradas. Define GOOGLE_SERVICE_ACCOUNT_JSON (producción) o GOOGLE_SERVICE_ACCOUNT_KEY_PATH (desarrollo)'
    );
  }

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

/**
 * Lee datos de un rango en Google Sheets con reintentos
 * @param {string} range - Ejemplo: "Alumnos!A1:D100"
 * @returns {Promise<Array>} Array de arrays con los valores
 */
export async function readSheetRange(range) {
  console.log(`📖 Leyendo rango: ${range} del Sheet ID: ${GOOGLE_SHEET_ID}`);
  
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range,
    });
    
    const values = response.data.values || [];
    console.log(`✅ Rango leído exitosamente: ${values.length} filas`);
    
    if (values.length === 0) {
      console.warn(`⚠️ El rango ${range} está vacío`);
    }
    
    return values;
  } catch (error) {
    console.error(`❌ Error al leer rango ${range}:`, error.message);
    
    // Detalles adicionales del error
    if (error.code) console.error('Código de error:', error.code);
    if (error.errors) console.error('Errores:', error.errors);
    
    throw new Error(`Error al leer Google Sheets (${range}): ${error.message}`);
  }
}

/**
 * Actualiza una celda o rango en Google Sheets
 * @param {string} range - Ejemplo: "Asistencias!D5"
 * @param {Array} values - Array de arrays con valores a escribir
 */
export async function updateSheetRange(range, values) {
  console.log(`✏️ Actualizando rango: ${range}`);
  
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    
    console.log(`✅ Rango actualizado: ${response.data.updatedCells} celdas`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error al actualizar rango ${range}:`, error.message);
    throw new Error(`Error al actualizar Google Sheets (${range}): ${error.message}`);
  }  return response.data;
}

/**
 * Convierte filas de Google Sheets a objetos
 * Asume que la primera fila son los encabezados
 */
export function rowsToObjects(rows) {
  if (!rows || rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] || '';
    });
    return obj;
  });
}

/**
 * Ejemplo de uso:
 * 
 * // HOJA "Alumnos" (A1:H100)
 * // Columnas: id_alumno, nombre, edad, curso, telefono_padre, materias, clases_compradas, horas
 * const rows = await readSheetRange('Alumnos!A1:H100');
 * const alumnos = rowsToObjects(rows);
 * 
 * // HOJA "Asistencias" (A1:F100)
 * // Columnas: id_asistencia, id_alumno, fecha, hora, estado, observaciones
 * const rowsAsis = await readSheetRange('Asistencias!A1:F100');
 * const asistencias = rowsToObjects(rowsAsis);
 * 
 * // HOJA "Materiales" (A1:F100)
 * // Columnas: id_material, materia, titulo, descripcion, url_recurso, imagen_url
 * const rowsMat = await readSheetRange('Materiales!A1:F100');
 * const materiales = rowsToObjects(rowsMat);
 * 
 * // Actualizar un estado de asistencia en la fila 5, columna E
 * await updateSheetRange('Asistencias!E5', [['Presente']]);
 */
