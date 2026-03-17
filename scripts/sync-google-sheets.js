#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { readSheetRange, updateSheetRange, rowsToObjects } from '../src/services/googleSheets.js';

async function syncGoogleSheets() {
  try {
    console.log('📊 Sincronizando datos con Google Sheets...\n');

    // Leer CSV
    const alumnosPath = path.resolve(process.cwd(), 'backups', 'Alumnos.csv');
    const usuariosPath = path.resolve(process.cwd(), 'backups', 'Usuarios.csv');

    if (!fs.existsSync(alumnosPath)) {
      console.error('❌ No se encontró:', alumnosPath);
      process.exit(1);
    }

    // Parse CSV
    const parseCSV = (csv) => {
      const lines = csv.split('\n').filter(l => l.trim());
      const header = lines[0].split(',').map(h => h.trim().replace(/^"/, '').replace(/"$/, ''));
      const rows = lines.slice(1).map(line => {
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          const nextChar = line[i + 1];
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        return values;
      });
      return { header, rows: rows.map(row => ({ header, vals: row })) };
    };

    const alumnosCSV = fs.readFileSync(alumnosPath, 'utf8');
    const usuariosCSV = fs.readFileSync(usuariosPath, 'utf8');

    const alumnos = parseCSV(alumnosCSV);
    const usuarios = parseCSV(usuariosCSV);

    console.log(`✅ CSV cargado:`);
    console.log(`   - Alumnos: ${alumnos.rows.length} registros`);
    console.log(`   - Usuarios: ${usuarios.rows.length} registros`);

    // Actualizar Google Sheets
    console.log('\n📝 Actualizando Google Sheets...');

    // Actualizar Alumnos
    const alumnosData = [alumnos.header, ...alumnos.rows.map(r => r.vals)];
    await updateSheetRange('Alumnos!A1', alumnosData);
    console.log('✅ Tabla Alumnos actualizada');

    // Actualizar Usuarios
    const usuariosData = [usuarios.header, ...usuarios.rows.map(r => r.vals)];
    await updateSheetRange('Usuarios!A1', usuariosData);
    console.log('✅ Tabla Usuarios actualizada');

    console.log('\n✨ Sincronización completada');
    console.log('\nPróximamente, recarga el navegador para ver los cambios');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

syncGoogleSheets();
