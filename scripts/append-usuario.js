import path from 'path';
import { pathToFileURL } from 'url';

async function main() {
  try {
    const modPath = path.resolve(process.cwd(), 'src', 'services', 'googleSheets.js');
    const modUrl = pathToFileURL(modPath).href;
    const { appendSheetRange } = await import(modUrl);

    const id_usuario = `u_${Date.now()}`;
    const id_alumno = '1';
    const email = `test+${Date.now()}@example.com`;
    const rol = 'padre';

    console.log('Añadiendo usuario de prueba:', { id_usuario, id_alumno, email, rol });
    const res = await appendSheetRange('Usuarios!A:D', [[id_usuario, id_alumno, email, rol]]);
    console.log('Resultado append:', res);
  } catch (err) {
    console.error('Error append:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack.split('\n').slice(0,6).join('\n'));
    process.exitCode = 1;
  }
}

main();
