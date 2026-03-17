export const prerender = false;

import { getContainer } from '../../../../infrastructure/container.js';

export async function DELETE({ params }) {
  try {
    const { useSheets } = getContainer();
    if (useSheets) {
      // Cascade solo existe en el adapter Sheets actual
      const mod = await import('../../../../infrastructure/sheets/index.js');
      if (!mod.cascadeDelete) throw new Error('cascadeDelete no disponible en sheets adapter');
      await mod.cascadeDelete(params.id);
    } else {
      // En mock, cascadeDelete existe
      const mod = await import('../../../../infrastructure/mock/index.js');
      if (!mod.cascadeDelete) throw new Error('cascadeDelete no disponible en mock adapter');
      await mod.cascadeDelete(params.id);
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
