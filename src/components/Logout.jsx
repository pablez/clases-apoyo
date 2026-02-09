import { h } from 'preact';
import { useEffect } from 'preact/hooks';

export default function Logout({ apiBaseUrl = '/api' }) {
  useEffect(() => {
    async function doLogout() {
      try {
        await fetch(`${apiBaseUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
      } catch (e) {
        // ignore
      } finally {
        try { localStorage.removeItem('auth_token'); sessionStorage.removeItem('auth_token'); } catch (e) {}
        window.location.href = '/';
      }
    }
    doLogout();
  }, []);

  return (
    <div class="p-6 text-center">Cerrando sesión...</div>
  );
}
