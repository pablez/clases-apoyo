(async ()=>{
  try {
    const r = await fetch('http://localhost:4321/api/usuarios', { method: 'GET' });
    console.log('status', r.status);
    const t = await r.text();
    console.log('body:\n', t);
  } catch(e) { console.error('error', e && e.message ? e.message : e); process.exitCode = 1; }
})();
