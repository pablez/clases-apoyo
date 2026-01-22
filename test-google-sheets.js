// Script de prueba para verificar conexión con Google Sheets
import 'dotenv/config';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testGoogleSheets() {
  console.log('\n🔍 Verificando configuración...\n');
  
  // 1. Verificar variables de entorno
  console.log('✅ USE_GOOGLE_SHEETS:', process.env.USE_GOOGLE_SHEETS);
  console.log('✅ GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID);
  console.log('✅ KEY_PATH:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
  
  if (process.env.USE_GOOGLE_SHEETS !== 'true') {
    console.log('\n⚠️  Google Sheets está deshabilitado. Cambia USE_GOOGLE_SHEETS=true en .env\n');
    return;
  }

  try {
    // 2. Verificar archivo de credenciales
    const keyPath = path.resolve(process.cwd(), process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
    console.log('\n📄 Ruta del archivo de credenciales:', keyPath);
    
    const auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // 3. Probar lectura de la hoja Alumnos
    console.log('\n📊 Intentando leer hoja "Alumnos"...');
    const responseAlumnos = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Alumnos!A1:H2',
    });

    console.log('✅ Hoja "Alumnos" leída correctamente');
    console.log('📋 Datos:', responseAlumnos.data.values);
    
    // 4. Probar lectura de la hoja Materiales
    console.log('\n📊 Intentando leer hoja "Materiales"...');
    try {
      const responseMateriales = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Materiales!A1:F10',
      });
      
      if (!responseMateriales.data.values || responseMateriales.data.values.length === 0) {
        console.log('⚠️  La hoja "Materiales" existe pero está VACÍA');
        console.log('💡 Agrega headers: id | materia | titulo | descripcion | url_recurso | imagen_url');
      } else {
        console.log('✅ Hoja "Materiales" leída correctamente');
        console.log('📋 Headers:', responseMateriales.data.values[0]);
        console.log('📋 Total filas:', responseMateriales.data.values.length);
      }
    } catch (error) {
      console.error('❌ Error al leer "Materiales":', error.message);
      console.log('💡 Asegúrate de crear una pestaña llamada "Materiales" con headers');
    }
    
    // 5. Probar lectura de la hoja Asistencias
    console.log('\n📊 Intentando leer hoja "Asistencias"...');
    try {
      const responseAsistencias = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Asistencias!A1:F10',
      });
      
      if (!responseAsistencias.data.values || responseAsistencias.data.values.length === 0) {
        console.log('⚠️  La hoja "Asistencias" existe pero está VACÍA');
        console.log('💡 Agrega headers: id | id_alumno | fecha | asistio | comentarios | materia');
      } else {
        console.log('✅ Hoja "Asistencias" leída correctamente');
        console.log('📋 Headers:', responseAsistencias.data.values[0]);
        console.log('📋 Total filas:', responseAsistencias.data.values.length);
      }
    } catch (error) {
      console.error('❌ Error al leer "Asistencias":', error.message);
      console.log('💡 Asegúrate de crear una pestaña llamada "Asistencias" con headers');
    }
    
    console.log('\n✨ Prueba completada!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 403) {
      console.log('\n💡 Solución: Comparte tu Google Sheet con:');
      console.log('   curso-apoyo@educacion-485101.iam.gserviceaccount.com');
      console.log('   (dale permisos de Editor)\n');
    } else if (error.code === 404) {
      console.log('\n💡 Solución: Verifica que:');
      console.log('   1. El GOOGLE_SHEET_ID en .env sea correcto');
      console.log('   2. La pestaña se llame exactamente "Alumnos"\n');
    }
  }
}

testGoogleSheets();
