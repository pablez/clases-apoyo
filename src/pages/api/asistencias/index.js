export const prerender = false;

import { getContainer } from '../../../infrastructure/container.js';

export async function GET({ url }) {
  try {
    const alumnoId = url.searchParams.get('alumnoId');
    const format = url.searchParams.get('format') || 'json';
    const { repositories } = getContainer();
    const data = await repositories.asistenciasRepository.list(alumnoId);
    if (format === 'plain') {
      // Concatenate records as: id + fecha(dd/mm/yyyy) + hora + estado + observaciones
      const fmtDate = (d) => {
        if (!d) return '';
        // Accept yyyy-mm-dd or other common formats
        const m = String(d).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m) return `${m[3]}/${m[2]}/${m[1]}`;
        return String(d).replace(/-/g, '/');
      };
      const out = (data || []).map(r => {
        return `${r.id || ''}${fmtDate(r.fecha)}${r.hora || ''}${r.estado || ''}${r.observaciones || ''}`;
      }).join('\n');
      return new Response(out, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { repositories } = getContainer();
    const data = await repositories.asistenciasRepository.create(body);
    return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
