import path from 'path';
import { pathToFileURL } from 'url';

async function main() {
  try {
    // Import dinámico para respetar el entorno ESM del proyecto
    const modPath = path.resolve(process.cwd(), 'src', 'services', 'googleSheets.js');
    const modUrl = pathToFileURL(modPath).href;
    const { readAllData } = await import(modUrl);

    console.log('🔎 Intentando leer todas las hojas (Alumnos, Asistencias, Materiales, Usuarios)...');
    const data = await readAllData();
    console.log('✅ Lectura completada. Resumen:');
    console.log('  - Alumnos:', (data.alumnos || []).length);
    console.log('  - Asistencias:', (data.asistencias || []).length);
    console.log('  - Materiales:', (data.materiales || []).length);
    console.log('  - Usuarios:', (data.usuarios || []).length);
  } catch (err) {
    console.error('❌ Error leyendo Google Sheets:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack.split('\n').slice(0,5).join('\n'));
    process.exitCode = 1;
  }
}

main();
