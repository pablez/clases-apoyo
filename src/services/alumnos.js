async function parseBody(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export async function getAlumnos(apiBase = '/api') {
  const res = await fetch(`${apiBase}/alumnos?t=${Date.now()}`);
  const body = await parseBody(res);
  if (!res.ok) throw new Error((body && body.error) || `Error ${res.status}`);
  return body;
}

export async function createAlumno(apiBase = '/api', payload) {
  const res = await fetch(`${apiBase}/alumnos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const body = await parseBody(res);
  if (!res.ok) throw new Error((body && body.error) || `Error ${res.status}`);
  return body;
}

export async function updateAlumno(apiBase = '/api', id, payload) {
  const res = await fetch(`${apiBase}/alumnos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const body = await parseBody(res);
  if (!res.ok) throw new Error((body && body.error) || `Error ${res.status}`);
  return body;
}

export async function deleteAlumno(apiBase = '/api', id) {
  const res = await fetch(`${apiBase}/alumnos/${id}`, { method: 'DELETE' });
  const body = await parseBody(res);
  if (!res.ok) throw new Error((body && body.error) || `Error ${res.status}`);
  return body;
}

export async function cascadeDelete(apiBase = '/api', id) {
  const res = await fetch(`${apiBase}/alumnos/${id}/cascade`, { method: 'DELETE' });
  const body = await parseBody(res);
  if (!res.ok) throw new Error((body && body.error) || `Error ${res.status}`);
  return body;
}
