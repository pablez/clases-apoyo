(async () => {
  const api = 'http://localhost:4321/api';
  const alumnoId = process.env.ALUMNO_ID || '1';

  try {
    const listRes = await fetch(`${api}/asistencias?alumnoId=${alumnoId}&format=json`);
    if (!listRes.ok) {
      console.error('GET asistencias failed', listRes.status);
      process.exit(1);
    }
    const list = await listRes.json();
    if (!Array.isArray(list) || list.length === 0) {
      console.error('No asistencias found for alumno', alumnoId);
      process.exit(1);
    }

    const first = list[0];
    const id = first.id || first.id_asistencia || first.idAsistencia;
    console.log('Using asistencia id:', id, 'current estado:', first.estado);

    const newEstado = (first.estado === 'Presente') ? 'Falta' : 'Presente';

    const putRes = await fetch(`${api}/asistencias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: newEstado })
    });

    const putData = await putRes.json().catch(() => null);
    console.log('PUT status:', putRes.status, 'body:', putData);

    // Verify by fetching again
    const afterRes = await fetch(`${api}/asistencias?alumnoId=${alumnoId}&format=json`);
    const afterList = await afterRes.json();
    const updated = afterList.find(a => (a.id || a.id_asistencia || a.idAsistencia) == id);
    console.log('Updated record:', updated);

    if (updated && updated.estado === newEstado) {
      console.log('✅ Update confirmed via API.');
      process.exit(0);
    } else {
      console.error('❌ Update not reflected via API.');
      process.exit(2);
    }
  } catch (e) {
    console.error('Error during test:', e);
    process.exit(1);
  }
})();
