 (async () => {
  const [,, id, estado] = process.argv;
  if (!id || !estado) {
    console.error('Usage: node set-asistencia-state.cjs <id> <estado>');
    process.exit(1);
  }
  const api = 'http://localhost:4321/api';
  try {
    const res = await fetch(`${api}/asistencias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
    const body = await res.json().catch(() => null);
    console.log('PUT status:', res.status, 'body:', body);
    process.exit(res.ok ? 0 : 2);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
