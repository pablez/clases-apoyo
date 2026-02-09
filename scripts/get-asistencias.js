(async ()=>{
  try {
    const token = 'mock-token:1:1770414907980';
    const r = await fetch('http://localhost:4321/api/alumno/asistencias', {
      method: 'GET',
      headers: { 'Cookie': `session=${encodeURIComponent(token)}` }
    });
    console.log('status', r.status);
    const t = await r.text();
    console.log('body:\n', t);
  } catch(e) { console.error('error', e); }
})();
