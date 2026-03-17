import { h } from 'preact';
import { useEffect } from 'preact/hooks';

export default function Toasts({ toasts = [] }) {
  // region for screen readers
  return (
    <div aria-live="polite" aria-atomic="true" class="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(t => (
        <div key={t.id} role="status" class={`p-3 rounded text-white ${t.type === 'error' ? 'bg-red-600' : t.type === 'info' ? 'bg-blue-600' : 'bg-green-600'}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
