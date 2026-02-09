(async ()=>{
  try {
    const r = await fetch('http://localhost:4321/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '1', password: 'test' })
    });
    console.log('status', r.status);
    console.log('headers:');
    r.headers.forEach((v,k)=>console.log(k+': '+v));
    const t = await r.text();
    console.log('body:\n', t);
  } catch(e) { console.error('error', e); }
})();
