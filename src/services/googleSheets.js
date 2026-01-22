import { google } from 'googleapis';
import path from 'path';

const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const GOOGLE_SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || '';

let sheetsClient = null;

async function getGoogleSheetsClient() {
  if (sheetsClient) return sheetsClient;

  if (!GOOGLE_SHEET_ID || !GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
    throw new Error('Google Sheets no configurado. Define GOOGLE_SHEET_ID y GOOGLE_SERVICE_ACCOUNT_KEY_PATH');
  }

  const keyPath = path.isAbsolute(GOOGLE_SERVICE_ACCOUNT_KEY_PATH) 
    ? GOOGLE_SERVICE_ACCOUNT_KEY_PATH 
    : path.resolve(process.cwd(), GOOGLE_SERVICE_ACCOUNT_KEY_PATH);

  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

/**
 * Lee datos de un rango en Google Sheets
 * @param {string} range - Ejemplo: "Alumnos!A1:D100"
 * @returns {Promise<Array>} Array de arrays con los valores
 */
export async function readSheetRange(range) {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEET_ID,
    range,
  });
  return response.data.values || [];
}

/**
 * Actualiza una celda o rango en Google Sheets
 * @param {string} range - Ejemplo: "Asistencias!D5"
 * @param {Array} values - Array de arrays con valores a escribir
 */
export async function updateSheetRange(range, values) {
  const sheets = await getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId: GOOGLE_SHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
  return response.data;
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
 * // Leer alumnos de una hoja llamada "Alumnos" con columnas: id, nombre, clases_compradas
 * const rows = await readSheetRange('Alumnos!A1:C100');
 * const alumnos = rowsToObjects(rows);
 * 
 * // Actualizar un estado de asistencia en la fila 5, columna D
 * await updateSheetRange('Asistencias!D5', [['Presente']]);
 */
