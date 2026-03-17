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

const testUsers = [
  { email: 'uriel@clasesapoyo.com', password: 'uriel123', name: 'Uriel' },
  { email: 'rosalinda@clasesapoyo.com', password: 'rosalinda123', name: 'Rosalinda' },
  { email: 'veronica@clasesapoyo.com', password: 'veronica123', name: 'Verónica' },
  { email: 'alex@clasesapoyo.com', password: 'alex123', name: 'Alex' },
];

(async () => {
  console.log('=== Debug: Flujo de Datos de Alumnos ===\n');
  
  for (const user of testUsers) {
    console.log(`\n📌 Usuario: ${user.name} (${user.email})`);
    console.log('─'.repeat(60));
    
    try {
      // Login
      const loginRes = await request('POST', 'auth/login', { 
        email: user.email, 
        password: user.password 
      });
      
      if (loginRes.status !== 200) {
        console.log(`❌ Login fallido: ${loginRes.status}`);
        console.log(JSON.stringify(loginRes.data, null, 2));
        continue;
      }
      
      const token = loginRes.data.token;
      const userId = loginRes.data.alumno.id;
      
      console.log(`✅ Login exitoso`);
      console.log(`   Token: ${token.slice(0, 40)}...`);
      console.log(`   User ID en token: ${token.split(':')[1]}`);
      console.log(`   User ID en respuesta login: ${userId}`);
      
      // Get alumnos
      const alumnosRes = await request('GET', 'usuario/alumnos', null, token);
      
      if (alumnosRes.status !== 200) {
        console.log(`❌ Error en /usuario/alumnos: ${alumnosRes.status}`);
        console.log(JSON.stringify(alumnosRes.data, null, 2));
        continue;
      }
      
      console.log(`\n✅ Endpoint /usuario/alumnos:`);
      console.log(`   Status: ${alumnosRes.status}`);
      console.log(`   User: ${JSON.stringify(alumnosRes.data.user, null, 2).split('\n').join('\n   ')}`);
      console.log(`   isMultiAlumno: ${alumnosRes.data.isMultiAlumno}`);
      console.log(`   Cantidad de alumnos: ${alumnosRes.data.alumnos.length}`);
      
      if (alumnosRes.data.alumnos.length > 0) {
        console.log(`\n   Alumnos devueltos:`);
        alumnosRes.data.alumnos.forEach((alu, idx) => {
          console.log(`\n   [${idx + 1}] ID: ${alu.id}`);
          console.log(`       Nombre: ${alu.nombre || '(VACÍO)'}`);
          console.log(`       Edad: ${alu.edad || '(VACÍO)'}`);
          console.log(`       Curso: ${alu.curso || '(VACÍO)'}`);
          console.log(`       Materias: ${alu.materias || '(VACÍO)'}`);
          console.log(`       Clases compradas: ${alu.clases_compradas || '(VACÍO)'}`);
          console.log(`       Teléfono: ${alu.telefono_padre || '(VACÍO)'}`);
        });
      } else {
        console.log(`   ⚠️  No se devolvieron alumnos`);
      }
      
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Debug completado\n');
})();
