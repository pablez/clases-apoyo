async function parseBody(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export async function getAlumnos(apiBase = '/api') {
  const init = { credentials: 'include' };
  try {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) init.headers = { Authorization: `Bearer ${token}` };
  } catch (e) { /* ignore storage errors */ }
  const res = await fetch(`${apiBase}/alumnos?t=${Date.now()}`, init);
  const body = await parseBody(res);
  if (!res.ok) throw new Error((body && body.error) || `Error ${res.status}`);
  return body;
}

export async function createAlumno(apiBase = '/api', payload) {
  const init = { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
  try {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) init.headers = { ...init.headers, Authorization: `Bearer ${token}` };
  } catch (e) {}
  const res = await fetch(`${apiBase}/alumnos`, init);
  const body = await parseBody(res);
  if (!res.ok) throw new Error((body && body.error) || `Error ${res.status}`);
  return body;
}

export async function updateAlumno(apiBase = '/api', id, payload) {
  const init = { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
  try {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) init.headers = { ...init.headers, Authorization: `Bearer ${token}` };
  } catch (e) {}
  const res = await fetch(`${apiBase}/alumnos/${id}`, init);
  const body = await parseBody(res);
  if (!res.ok) throw new Error((body && body.error) || `Error ${res.status}`);
  return body;
}

export async function deleteAlumno(apiBase = '/api', id) {
  const init = { method: 'DELETE', credentials: 'include' };
  try {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) init.headers = { Authorization: `Bearer ${token}` };
  } catch (e) {}
  const res = await fetch(`${apiBase}/alumnos/${id}`, init);
  const body = await parseBody(res);
  if (!res.ok) throw new Error((body && body.error) || `Error ${res.status}`);
  return body;
}

export async function cascadeDelete(apiBase = '/api', id) {
  const init = { method: 'DELETE', credentials: 'include' };
  try {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) init.headers = { Authorization: `Bearer ${token}` };
  } catch (e) {}
  const res = await fetch(`${apiBase}/alumnos/${id}/cascade`, init);
  const body = await parseBody(res);
  if (!res.ok) throw new Error((body && body.error) || `Error ${res.status}`);
  return body;
}
