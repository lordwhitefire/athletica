'use client';

import { useCallback, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, message?: string) => {
      setToasts((prev) => [...prev.slice(-3), { id: Math.random().toString(36).slice(2), kind, title, message }]);
    },
    []
  );

  return { toasts, push, dismiss };
}

export function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="toast-viewport" aria-live="polite">
      {toasts.map((t) => (
        <div className={`toast toast--${t.kind}`} key={t.id} role="status">
          <div className="toast__body">
            <strong>{t.title}</strong>
            {t.message && <p>{t.message}</p>}
          </div>
          <button type="button" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}