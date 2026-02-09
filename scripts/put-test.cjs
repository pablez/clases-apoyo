const http = require('http');

const data = JSON.stringify({
  nombre: 'Pablo prueba',
  edad: '14',
  curso: '3ro de secundaria',
  telefono_padre: '74354567',
  email: 'test@example.com',
  password: '123',
  rol: 'padre',
  materias: ['Mat']
});

const options = {
  hostname: 'localhost',
  port: 4321,
  path: '/api/alumnos/1',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log('HEADERS:', res.headers);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => { console.log('BODY:', body); });
});

req.on('error', (e) => { console.error('problem with request:', e.message); });
req.write(data);
req.end();
