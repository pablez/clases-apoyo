#!/usr/bin/env node

/**
 * Script de verificación para la migración 1:N Usuario-Alumnos
 * Verifica el estado actual y detecta referencias legacy pendientes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('🔍 Verificando migración Usuario-Alumnos 1:N...\n');

// Archivos a verificar
const FILES_TO_CHECK = [
  'src/core/entities/Alumno.js',
  'src/infrastructure/sheets/index.js', 
  'src/infrastructure/mock/index.js',
  'src/pages/api/**/*.js'
];

// Patrones legacy a buscar
const LEGACY_PATTERNS = [
  { pattern: /\.id_alumno\b/, description: 'Referencias a campo id_alumno legacy' },
  { pattern: /idUsuario\b/, description: 'Referencias a idUsuario variants' },
  { pattern: /alumno.*id_usuario/, description: 'Mapeo alumno -> id_usuario' },
  { pattern: /usuariosByAlumno/, description: 'Mapeo legacy usuariosByAlumno' }
];

let issuesFound = 0;
const results = [];

/**
 * Busca patrones legacy en un archivo
 */
function checkFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];

  LEGACY_PATTERNS.forEach(({ pattern, description }) => {
    lines.forEach((line, index) => {
      if (pattern.test(line) && !line.includes('// MIGRATED') && !line.includes('// OK')) {
        issues.push({
          file: filePath,
          line: index + 1,
          content: line.trim(),
          type: description
        });
      }
    });
  });

  return issues;
}

/**
 * Busca archivos recursivamente
 */
function findFiles(dir, extension = '.js') {
  const files = [];
  
  function scanDir(currentDir) {
    const entries = fs.readdirSync(currentDir);
    entries.forEach(entry => {
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        scanDir(fullPath);
      } else if (entry.endsWith(extension)) {
        files.push(fullPath);
      }
    });
  }
  
  scanDir(dir);
  return files;
}

console.log('📁 Escaneando archivos JavaScript...');

// Escanear directorios principales
const srcFiles = findFiles(path.join(ROOT_DIR, 'src'));
const scriptFiles = findFiles(path.join(ROOT_DIR, 'scripts'));

const allFiles = [...srcFiles, ...scriptFiles];
console.log(`   Encontrados ${allFiles.length} archivos JS\n`);

console.log('🔍 Buscando referencias legacy...\n');

allFiles.forEach(file => {
  const issues = checkFile(file);
  if (issues.length > 0) {
    results.push(...issues);
    issuesFound += issues.length;
  }
});

// Mostrar resultados
if (issuesFound === 0) {
  console.log('✅ ¡Migración completa! No se encontraron referencias legacy.\n');
} else {
  console.log(`❌ Se encontraron ${issuesFound} referencias legacy:\n`);
  
  // Agrupar por archivo
  const byFile = results.reduce((acc, issue) => {
    const relativePath = path.relative(ROOT_DIR, issue.file);
    if (!acc[relativePath]) acc[relativePath] = [];
    acc[relativePath].push(issue);
    return acc;
  }, {});

  Object.entries(byFile).forEach(([file, issues]) => {
    console.log(`📄 ${file}:`);
    issues.forEach(issue => {
      console.log(`   Línea ${issue.line}: ${issue.content}`);
      console.log(`   Tipo: ${issue.type}\n`);
    });
  });
}

// Verificar estructura de Google Sheets esperada
console.log('📊 Verificando estructura de datos esperada...\n');

async function verifySheetStructure() {
  try {
    const useSheets = process.env.USE_GOOGLE_SHEETS === 'true';
    if (!useSheets) {
      console.log('   ⚠️  Google Sheets deshabilitado - usando mock data');
      return;
    }

    // Importar módulo de sheets
    const { readSheetRange } = await import('../src/services/googleSheets.js');
    
    // Verificar headers de Usuarios
    const usuariosHeaders = await readSheetRange('Usuarios!A1:F1');
    if (usuariosHeaders && usuariosHeaders[0]) {
      const headers = usuariosHeaders[0];
      console.log('   Usuarios headers:', headers.join(', '));
      
      const expectedUsuarios = ['id_usuario', 'email', 'password', 'rol', 'alumnos_ids'];
      const hasLegacyIdAlumno = headers.includes('id_alumno');
      
      if (hasLegacyIdAlumno) {
        console.log('   ❌ ENCONTRADO: Campo legacy "id_alumno" en Usuarios');
        console.log('   📝 ACCIÓN: Eliminar columna B (id_alumno) de hoja Usuarios\n');
      } else {
        console.log('   ✅ Estructura Usuarios limpia\n');
      }
    }

    // Verificar headers de Alumnos  
    const alumnosHeaders = await readSheetRange('Alumnos!A1:Z1');
    if (alumnosHeaders && alumnosHeaders[0]) {
      const headers = alumnosHeaders[0];
      console.log('   Alumnos headers:', headers.join(', '));
      
      const hasLegacyIdUsuario = headers.includes('id_usuario');
      
      if (hasLegacyIdUsuario) {
        console.log('   ❌ ENCONTRADO: Campo legacy "id_usuario" en Alumnos');
        console.log('   📝 ACCIÓN: Eliminar columna de id_usuario de hoja Alumnos\n');
      } else {
        console.log('   ✅ Estructura Alumnos limpia\n');
      }
    }

  } catch (error) {
    console.log('   ⚠️  No se pudo verificar Google Sheets:', error.message);
  }
}

await verifySheetStructure();

// Resumen y recomendaciones
console.log('📋 RESUMEN DE MIGRACIÓN:\n');

if (issuesFound === 0) {
  console.log('✅ Código: Limpio de referencias legacy');
} else {
  console.log(`❌ Código: ${issuesFound} referencias legacy encontradas`);
}

console.log('\n🚀 PRÓXIMOS PASOS:');
console.log('1. Eliminar referencias legacy del código (ver arriba)');
console.log('2. Eliminar campos legacy de Google Sheets');  
console.log('3. Ejecutar tests: npm test');
console.log('4. Verificar UI multi-alumno funcional');

console.log('\n📖 Ver documentación completa:');
console.log('   docs/migracion-1-n-usuarios-alumnos.md');
console.log('   docs/database-schema.puml');

process.exit(issuesFound > 0 ? 1 : 0);