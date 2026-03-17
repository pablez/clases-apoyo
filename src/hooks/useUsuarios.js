import { useState, useEffect } from 'preact/hooks';
import * as usuariosApi from '../services/usuarios.js';

export default function useUsuarios(apiBase = '/api', { onToast } = {}) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function loadUsuarios() {
    setLoading(true);
    setError(null);
    try {
      const data = await usuariosApi.getUsuarios(apiBase);
      setUsuarios(data || []);
    } catch (err) {
      setError(err.message || String(err));
      if (onToast) onToast(err.message || String(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsuarios(); }, []);

  async function createUsuario(payload) {
    setSaving(true); setError(null);
    try {
      const res = await usuariosApi.createUsuario(apiBase, payload);
      if (onToast) onToast('Usuario creado', 'success');
      await loadUsuarios();
      return res;
    } catch (err) {
      setError(err.message || String(err));
      if (onToast) onToast(err.message || String(err), 'error');
      throw err;
    } finally { setSaving(false); }
  }

  async function updateUsuario(id, payload) {
    setSaving(true); setError(null);
    try {
      const res = await usuariosApi.updateUsuario(apiBase, id, payload);
      if (onToast) onToast('Usuario actualizado', 'success');
      await loadUsuarios();
      return res;
    } catch (err) {
      setError(err.message || String(err));
      if (onToast) onToast(err.message || String(err), 'error');
      throw err;
    } finally { setSaving(false); }
  }

  async function deleteUsuario(id) {
    setSaving(true); setError(null);
    try {
      const res = await usuariosApi.deleteUsuario(apiBase, id);
      if (onToast) onToast('Usuario eliminado', 'success');
      await loadUsuarios();
      return res;
    } catch (err) {
      setError(err.message || String(err));
      if (onToast) onToast(err.message || String(err), 'error');
      throw err;
    } finally { setSaving(false); }
  }

  return { usuarios, loading, saving, error, loadUsuarios, createUsuario, updateUsuario, deleteUsuario, setError };
}
