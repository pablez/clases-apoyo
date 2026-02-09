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
        window.location.href = '/';
      }
    }
    doLogout();
  }, []);

  return (
    <div class="p-6 text-center">Cerrando sesión...</div>
  );
}
