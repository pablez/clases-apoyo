#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { readSheetRange, rowsToObjects, updateSheetRange } from '../src/services/googleSheets.js';

function usage() {
  console.log('Usage: node scripts/migrate-assign-user.js --dry-run [--map-by-email]');
  console.log('       node scripts/migrate-assign-user.js --apply --confirm [--map-by-email]');
}

function toCSV(rows) {
  return rows.map(r => r.map(c => String(c || '').replace(/"/g, '""')).map(c => `"${c}"`).join(',')).join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const apply = args.includes('--apply');
  const confirm = args.includes('--confirm');
  const mapByEmail = args.includes('--map-by-email');

  if (!dryRun && !apply) { usage(); process.exit(1); }
  if (apply && !confirm) {
    console.error('Apply requires --confirm to proceed');
    process.exit(2);
  }

  console.log('Reading sheets (Alumnos and Usuarios)...');
  const alumnosRange = 'Alumnos!A1:I100';
  const usuariosRange = 'Usuarios!A1:E100';

  const alumnosRows = await readSheetRange(alumnosRange);
  const usuariosRows = await readSheetRange(usuariosRange).catch(() => []);

  // backups
  const backupsDir = path.resolve(process.cwd(), 'backups');
  try { fs.mkdirSync(backupsDir, { recursive: true }); } catch (e) {}
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  if (alumnosRows && alumnosRows.length) {
    fs.writeFileSync(path.join(backupsDir, `alumnos-backup-${now}.csv`), toCSV(alumnosRows), 'utf8');
    console.log('Alumnos backup written:', `backups/alumnos-backup-${now}.csv`);
  }
  if (usuariosRows && usuariosRows.length) {
    fs.writeFileSync(path.join(backupsDir, `usuarios-backup-${now}.csv`), toCSV(usuariosRows), 'utf8');
    console.log('Usuarios backup written:', `backups/usuarios-backup-${now}.csv`);
  }

  const alumnosObjs = rowsToObjects(alumnosRows || []);
  const usuariosObjs = rowsToObjects(usuariosRows || []);

  // Build maps
  const usuariosByAlumno = {};
  const usuariosById = {};
  usuariosObjs.forEach(u => {
    const idUsuario = (u.id_usuario || u.id || '').toString();
    const idAlumno = (u.id_alumno || u.idAlumno || '').toString();
    if (idUsuario) usuariosById[idUsuario] = u;
    if (idAlumno) usuariosByAlumno[idAlumno] = u;
  });

  // Proposed migrations
  const proposals = [];

  alumnosObjs.forEach((a, idx) => {
    const alumnoId = (a.id_alumno || a.id || '').toString();
    const existingIdUsuario = (a.id_usuario || a.idUsuario || '').toString();
    let proposed = '';

    // prefer explicit Usuarios referencing id_alumno
    if (usuariosByAlumno[alumnoId] && usuariosByAlumno[alumnoId].id_usuario) {
      proposed = String(usuariosByAlumno[alumnoId].id_usuario);
    } else if (mapByEmail && a.email) {
      // if enabled, try mapping by email
      const match = usuariosObjs.find(u => String(u.email || '').toLowerCase() === String(a.email || '').toLowerCase());
      if (match && (match.id_usuario || match.id)) proposed = String(match.id_usuario || match.id);
    }

    if (proposed && proposed !== existingIdUsuario) {
      proposals.push({ rowIndex: idx, alumnoId, existingIdUsuario, proposed });
    }
  });

  const summary = { totalAlumnos: alumnosObjs.length, usuarios: usuariosObjs.length, proposals: proposals.length };
  console.log('Summary:', summary);

  const outDir = path.resolve(process.cwd(), 'migrations');
  try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) {}
  fs.writeFileSync(path.join(outDir, `dryrun-${now}.json`), JSON.stringify({ summary, proposals }, null, 2), 'utf8');
  console.log('Dry-run JSON written to', `migrations/dryrun-${now}.json`);

  if (dryRun && !apply) {
    console.log('Dry-run complete. Review migrations/dryrun-' + now + '.json');
    process.exit(0);
  }

  if (apply) {
    console.log('Applying migration: updating Alumnos sheet with id_usuario values...');
    // We must re-read rows to get authoritative sheet structure
    const fullRows = await readSheetRange(alumnosRange);
    const headers = fullRows[0] || [];
    const body = fullRows.slice(1);
    for (const p of proposals) {
      const r = body[p.rowIndex] || new Array(headers.length).fill('');
      // ensure row has at least 9 columns
      while (r.length < 9) r.push('');
      r[8] = p.proposed; // column I (0-based index 8)
      const sheetRowNumber = p.rowIndex + 2; // header + 1-based
      const range = `Alumnos!A${sheetRowNumber}:I${sheetRowNumber}`;
      await updateSheetRange(range, [r]);
      console.log('Updated row', sheetRowNumber, 'with id_usuario=', p.proposed);
    }
    console.log('Migration applied. Please verify Google Sheets content and backups in /backups.');
    process.exit(0);
  }
}

main().catch(e => { console.error('Migration error:', e); process.exit(1); });
