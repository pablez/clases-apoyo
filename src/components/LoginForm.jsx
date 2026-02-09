import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export default function LoginForm({ apiBaseUrl = '/api' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [remember, setRemember] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    // client-side validation
    const errors = {};
    if (!email || String(email).trim().length === 0) errors.email = 'Email o ID requerido';
    if (!password || String(password).trim().length === 0) errors.password = 'Contraseña requerida';
    // simple email-ish check (allow numeric ID too)
    const looksLikeEmail = String(email).includes('@') && /@.+\..+/.test(String(email));
    if (String(email).includes('@') && !looksLikeEmail) errors.email = 'Formato de email inválido';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setLoading(true);
    setError(null);
    console.log('Login submit', { email, password });
    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember })
      });
      const data = await res.json();
      console.log('Login response', res.status, data);
      if (!res.ok) {
        setError(data.error || 'Error en autenticación');
        setLoading(false);
        return;
      }
      // Login correcto: almacenar token en localStorage (para Authorization header) y redirigir al portal
      try {
        if (data && data.token) {
          if (remember) {
            localStorage.setItem('auth_token', data.token);
            sessionStorage.removeItem('auth_token');
          } else {
            sessionStorage.setItem('auth_token', data.token);
            localStorage.removeItem('auth_token');
          }
        }
      } catch (e) {
        // ignore storage errors
      }
      window.location.href = '/alumno';
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log('LoginForm mounted');
  }, []);

  return (
    <div class="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
      <h2 class="text-xl font-semibold mb-4">Acceso alumno/padre</h2>
      <form onSubmit={handleSubmit}>
        <label class="block mb-2">
          <span class="text-sm">Email o ID</span>
          <input name="email" autocomplete="username" class={`w-full border rounded px-2 py-1 mt-1 ${fieldErrors.email ? 'border-red-500' : ''}`} value={email} onInput={e => { setEmail(e.target.value); setFieldErrors(f => ({...f, email: null})); }} />
          {fieldErrors.email && <div class="text-red-600 text-sm mt-1">{fieldErrors.email}</div>}
        </label>
        <label class="block mb-4">
          <span class="text-sm">Contraseña</span>
          <input type="password" autocomplete="current-password" class={`w-full border rounded px-2 py-1 mt-1 ${fieldErrors.password ? 'border-red-500' : ''}`} value={password} onInput={e => { setPassword(e.target.value); setFieldErrors(f => ({...f, password: null})); }} />
          {fieldErrors.password && <div class="text-red-600 text-sm mt-1">{fieldErrors.password}</div>}
        </label>
        {error && <div class="text-red-600 mb-2">{error}</div>}
        <div class="flex items-center gap-2">
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading || Object.keys(fieldErrors).length > 0} onClick={e => { console.log('submit button clicked'); handleSubmit(e); }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
          <button type="button" class="text-sm text-gray-600" onClick={() => { setEmail('1'); setPassword('test'); }}>
            Demo (Juan)
          </button>
        </div>
        <div class="mt-3 text-sm">
          <a href={(() => {
            const number = '59174325440';
            const text = 'Hola, necesito recuperar mi contraseña para el gestor de asistencias. Mi email/ID: ';
            return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
          })()} target="_blank" rel="noopener" class="text-blue-600 hover:underline">¿Olvidaste tu contraseña? Contáctanos por WhatsApp</a>
        </div>
      </form>
    </div>
  );
}
