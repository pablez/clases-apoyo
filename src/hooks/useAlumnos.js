import { useState, useEffect } from 'preact/hooks';
import * as alumnosApi from '../services/alumnos.js';

export default function useAlumnos(apiBase = '/api', { onToast } = {}) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function loadAlumnos() {
    setLoading(true);
    setError(null);
    try {
      const data = await alumnosApi.getAlumnos(apiBase);
      setAlumnos(data || []);
    } catch (err) {
      setError(err.message || String(err));
      if (onToast) onToast(err.message || String(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlumnos();
  }, []);

  async function createAlumno(payload) {
    setSaving(true);
    setError(null);
    try {
      const res = await alumnosApi.createAlumno(apiBase, payload);
      if (onToast) onToast('Alumno creado correctamente', 'success');
      await loadAlumnos();
      return res;
    } catch (err) {
      setError(err.message || String(err));
      if (onToast) onToast(err.message || String(err), 'error');
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function updateAlumno(id, payload) {
    setSaving(true);
    setError(null);
    try {
      const res = await alumnosApi.updateAlumno(apiBase, id, payload);
      if (onToast) onToast('Alumno actualizado', 'success');
      await loadAlumnos();
      return res;
    } catch (err) {
      setError(err.message || String(err));
      if (onToast) onToast(err.message || String(err), 'error');
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteAlumno(id) {
    setSaving(true);
    setError(null);
    try {
      const res = await alumnosApi.deleteAlumno(apiBase, id);
      if (onToast) onToast('Alumno eliminado', 'success');
      await loadAlumnos();
      return res;
    } catch (err) {
      setError(err.message || String(err));
      if (onToast) onToast(err.message || String(err), 'error');
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function cascadeDeleteAlumno(id) {
    setSaving(true);
    setError(null);
    try {
      const res = await alumnosApi.cascadeDelete(apiBase, id);
      if (onToast) onToast('Alumno y asistencias eliminados', 'success');
      await loadAlumnos();
      return res;
    } catch (err) {
      setError(err.message || String(err));
      if (onToast) onToast(err.message || String(err), 'error');
      throw err;
    } finally {
      setSaving(false);
    }
  }

  return {
    alumnos,
    loading,
    saving,
    error,
    loadAlumnos,
    createAlumno,
    updateAlumno,
    deleteAlumno,
    cascadeDeleteAlumno,
    setError
  };
}
