#!/usr/bin/env node
import http from 'http';

const BASE_URL = 'http://localhost:4321/api/';

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}`, 'session-token': token })
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
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

(async () => {
  try {
    console.log('=== Debug: Rosalinda ===\n');
    
    // Login
    const loginRes = await request('POST', 'auth/login', { 
      email: 'rosalinda@clasesapoyo.com', 
      password: 'rosalinda123' 
    });
    
    console.log('✅ Login:', loginRes.data.alumno.nombre);
    console.log('   ID:', loginRes.data.alumno.id);
    console.log('   Token:', loginRes.data.token.slice(0, 40) + '...');
    
    const token = loginRes.data.token;
    
    // Get alumnos
    const alumnosRes = await request('GET', 'usuario/alumnos', null, token);
    console.log('\n✅ Alumnos encontrados:');
    console.log(JSON.stringify(alumnosRes.data, null, 2));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
