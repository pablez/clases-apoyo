// Controlador del módulo de autenticación (thin controller)
export default function makeAuthController({ loginUser }) {
  if (!loginUser) throw new Error('loginUser usecase es requerido');

  async function login({ request }) {
    try {
      const body = await request.json();
      const { email, password, remember } = body;
      const result = await loginUser({ email, password });
      if (!result.success) {
        return new Response(JSON.stringify({ error: result.message }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
      // En entorno real generaríamos JWT y cookie segura. Ajustes SameSite/Secure según env.
      const sameSite = process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax';
      const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      // Si el usuario pide 'remember', hacemos la cookie persistente (ej. 30 días)
      const maxAge = remember ? '; Max-Age=2592000' : '';
      const headers = {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${encodeURIComponent(result.token)}; HttpOnly; Path=/; SameSite=${sameSite}${secureFlag}${maxAge}`
      };
      // In development/mock also return token in body to allow test harness to set cookie.
      return new Response(JSON.stringify({ alumno: result.alumno, token: result.token }), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  async function logout({ request }) {
    try {
      // Invalidate cookie by clearing it. Use sameSite/secure flags consistent with login.
      const sameSite = process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax';
      const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      const headers = {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=${sameSite}${secureFlag}`
      };
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  return { login, logout };
}
