#!/usr/bin/env node
/**
 * Debug script para diagnosticar problemas de carga de asistencias
 * 
 * Uso:
 *   npm run debug:asistencias
 *   node scripts/debug-asistencias.js
 */

import http from 'http';
import https from 'https';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321/api/';
const TEST_EMAIL = process.env.TEST_EMAIL || 'uriel@clasesapoyo.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'uriel123';
const TEST_TOKEN = process.env.TEST_TOKEN || null;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(level, message, data = null) {
  const levels = {
    error: colors.red,
    success: colors.green,
    info: colors.cyan,
    warning: colors.yellow,
    debug: colors.blue
  };
  const color = levels[level] || colors.reset;
  console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}`, 'session-token': token })
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: { raw: data }, error: e.message });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function diagnosisFlow() {
  console.log(`\n${colors.bright}=== DEBUG: Diagnóstico de Asistencias ===${colors.reset}\n`);
  console.log(`📌 Configuración:`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Email: ${TEST_EMAIL}`);
  console.log(`   Password: ${TEST_PASSWORD.slice(0, 3)}***\n`);
  
  let token = TEST_TOKEN;

  // 0. Health check
  log('info', '🏥 Verificando que el servidor está funcionando...');
  try {
    const healthRes = await makeRequest('GET', 'health');
    if (healthRes.status === 200 || healthRes.status === 404) {
      log('success', '✅ Servidor respondiendo en ' + BASE_URL);
    }
  } catch (e) {
    log('error', `❌ No se puede conectar a ${BASE_URL}`, { error: e.message });
    log('warning', 'Asegúrate de que:');
    console.log('   1. npm run dev está ejecutándose');
    console.log('   2. El servidor escucha en puerto 4321');
    console.log('   3. La URL es correcta: ' + BASE_URL);
    process.exit(1);
  }

  // 1. Login si no hay token
  if (!token) {
    log('info', `🔑 Realizando login como: ${TEST_EMAIL}`);
    try {
      const res = await makeRequest('POST', 'auth/login', { email: TEST_EMAIL, password: TEST_PASSWORD });
      console.log('   Status:', res.status);
      console.log('   Response:', JSON.stringify(res.data, null, 2));
      
      if (res.status === 200 && res.data.token) {
        token = res.data.token;
        log('success', '✅ Login exitoso', { token: token.slice(0, 30) + '...' });
        log('info', 'Usuario información:', res.data.alumno);
      } else {
        log('error', '❌ Login fallido', res);
        if (res.data.error) {
          console.log('   Error:', res.data.error);
        }
        process.exit(1);
      }
    } catch (e) {
      log('error', '❌ Error en login', { message: e.message, stack: e.stack });
      process.exit(1);
    }
  } else {
    log('info', 'Usando token proporcionado:', token.slice(0, 30) + '...');
  }

  // 2. Obtener alumnos vinculados
  log('info', '📚 Obteniendo alumnos vinculados...');
  try {
    const res = await makeRequest('GET', 'usuario/alumnos', null, token);
    if (res.status === 200) {
      log('success', '✅ Alumnos encontrados:', res.data);
    } else {
      log('error', '❌ Error obteniendo alumnos', res);
    }
  } catch (e) {
    log('error', '❌ Error en /usuario/alumnos', { message: e.message });
  }

  // 3. Obtener asistencias
  log('info', '📋 Obteniendo asistencias...');
  try {
    const res = await makeRequest('GET', 'alumno/asistencias?page=1&pageSize=10', null, token);
    if (res.status === 200) {
      const meta = res.data.meta || {};
      log('success', '✅ Asistencias encontradas', {
        total: meta.total,
        presentes: meta.presentes,
        faltas: meta.faltas,
        pendientes: meta.pendientes,
        records: res.data.data?.length || 0
      });
      if (res.data.data && res.data.data.length > 0) {
        log('debug', 'Primeras 3 asistencias:', res.data.data.slice(0, 3));
      }
    } else {
      log('error', '❌ Error obteniendo asistencias', res);
    }
  } catch (e) {
    log('error', '❌ Error en /alumno/asistencias', { message: e.message });
  }

  // 4. Verificar Google Sheets (si USE_GOOGLE_SHEETS=true)
  if (process.env.USE_GOOGLE_SHEETS === 'true') {
    log('info', '🔍 Verificando conectividad con Google Sheets...');
    try {
      const res = await makeRequest('GET', '/health', null);
      log('success', '✅ Health check:', res);
    } catch (e) {
      log('warning', '⚠️ Posible problema con Google Sheets:', e.message);
    }
  }

  log('info', '✨ Diagnóstico completado');
  process.exit(0);
}

// Ejecutar
diagnosisFlow().catch(e => {
  log('error', 'Fatal error:', { message: e.message, stack: e.stack });
  process.exit(1);
});
