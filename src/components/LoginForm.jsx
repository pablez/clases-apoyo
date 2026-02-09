import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export default function LoginForm({ apiBaseUrl = '/api' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    // client-side validation
    const errors = {};
    if (!email || String(email).trim().length === 0) errors.email = 'Email';
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
      // Login correcto: almacenar token en localStorage (para Authorization header)
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
      // If user is admin (from Usuarios sheet) redirect to admin panel
      try {
        const isAdmin = data && data.alumno && data.alumno._usuario && String(data.alumno._usuario.rol || '').toLowerCase() === 'admin';
        if (isAdmin) {
          try { sessionStorage.setItem('admin_auth', 'true'); localStorage.setItem('admin_auth', 'true'); } catch(e) {}
          window.location.href = '/admin';
          return;
        }
      } catch (e) {}
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
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 21h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z"/></svg>
        </div>
        <h2 class="text-xl font-semibold">Acceso alumno/padre</h2>
      </div>

      <form onSubmit={handleSubmit} class="space-y-4" aria-live="polite">
        <label class="block">
          <span class="text-sm font-medium">Email o ID</span>
          <input name="email" autocomplete="username" autoFocus placeholder="ej. alumno@correo.com o ID" class={`w-full border rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300 ${fieldErrors.email ? 'border-red-500' : 'border-gray-200'}`} value={email} onInput={e => { setEmail(e.target.value); setFieldErrors(f => ({...f, email: null})); }} aria-invalid={fieldErrors.email ? 'true' : 'false'} />
          {fieldErrors.email && <div class="text-red-600 text-sm mt-1">{fieldErrors.email}</div>}
        </label>

        <label class="block">
          <span class="text-sm font-medium">Contraseña</span>
          <div class="relative mt-1">
            <input name="password" type={showPassword ? 'text' : 'password'} autocomplete="current-password" aria-required="true" aria-invalid={fieldErrors.password ? 'true' : 'false'} class={`w-full border rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-300 ${fieldErrors.password ? 'border-red-500' : 'border-gray-200'}`} value={password} onInput={e => { setPassword(e.target.value); setFieldErrors(f => ({...f, password: null})); }} />
            <button type="button" onClick={() => setShowPassword(s => !s)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} class="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600">{showPassword ? '🙈' : '👁️'}</button>
          </div>
          {fieldErrors.password && <div class="text-red-600 text-sm mt-1">{fieldErrors.password}</div>}
        </label>

        {error && <div class="text-red-600 mb-2" role="alert">{error}</div>}

        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <input id="remember" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} class="w-4 h-4" />
            <label for="remember" class="text-sm">Recordarme</label>
          </div>

          <div class="flex items-center gap-2">
            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded inline-flex items-center gap-2" disabled={loading} aria-busy={loading}>
              {loading ? (
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-8 11z"></path></svg>
              ) : null}
              <span>{loading ? 'Ingresando...' : 'Ingresar'}</span>
            </button>
            <button type="button" class="text-sm text-gray-600" onClick={() => { setEmail('1'); setPassword('test'); }}>
              
            </button>
          </div>
        </div>

        <div class="text-sm mt-2">
          <a href={(() => {
            const number = '59174325440';
            const text = 'Hola, necesito recuperar mi contraseña para el gestor de asistencias. Mi email/ID: ';
            return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
          })()} target="_blank" rel="noopener" class="text-blue-600 hover:underline">¿Olvidaste tu contraseña? Contáctanos</a>
        </div>
      </form>
    </div>
  );
}
