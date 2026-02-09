(async () => {
  try {
    const base = 'http://localhost:4321/api';
    const fetch = global.fetch || (await import('node-fetch')).default;

    const listBeforeResp = await fetch(`${base}/alumnos`);
    const listBefore = listBeforeResp.ok ? await listBeforeResp.json() : [];
    console.log('Alumnos antes:', (listBefore || []).length);

    console.log('POST /alumnos -> crear alumno...');
    const createResp = await fetch(`${base}/alumnos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Test Alumno', edad: '12', curso: '6to', telefono_padre: '+591000', email: 'test@example.com', password: 'secret' })
    });
    console.log('status', createResp.status);
    const createText = await createResp.text();
    console.log('body', createText);
    let created = null;
    try { created = JSON.parse(createText); } catch (e) { /* ignore */ }

    if (!created || !created.id) {
      console.error('No se obtuvo id del alumno creado. Abortando pruebas de PUT/DELETE.');
      process.exit(created ? 0 : 1);
    }

    const id = created.id || created.id_alumno || created.idAlumno || created.id_alumno || created.id;
    console.log('ID creado:', id);

    console.log('\nPUT /alumnos/' + id + ' -> actualizar nombre');
    const putResp = await fetch(`${base}/alumnos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Test Alumno EDITADO' })
    });
    console.log('status', putResp.status);
    console.log('body', await putResp.text());

    console.log('\nVerificando que el alumno aparece en la lista...');
    const listAfterCreateResp = await fetch(`${base}/alumnos`);
    const listAfterCreate = listAfterCreateResp.ok ? await listAfterCreateResp.json() : [];
    console.log('Alumnos ahora:', (listAfterCreate || []).length, 'contiene id?', (listAfterCreate || []).some(a => String(a.id) === String(id)));

    console.log('\nDELETE /alumnos/' + id + ' -> eliminar');
    const delResp = await fetch(`${base}/alumnos/${id}`, { method: 'DELETE' });
    console.log('status', delResp.status);
    console.log('body', await delResp.text());

    console.log('\nComprobando lista final de alumnos y asistencias del alumno...');
    const listFinalResp = await fetch(`${base}/alumnos`);
    const listFinal = listFinalResp.ok ? await listFinalResp.json() : [];
    console.log('Alumnos finales:', (listFinal || []).length, 'contiene id?', (listFinal || []).some(a => String(a.id) === String(id)));

    const asisResp = await fetch(`${base}/asistencias?alumnoId=${id}`);
    const asis = asisResp.ok ? await asisResp.json() : [];
    console.log('Asistencias para alumno tras delete:', (asis || []).length);

    process.exit(0);
  } catch (e) {
    console.error('Error en script de prueba:', e);
    process.exit(1);
  }
})();
