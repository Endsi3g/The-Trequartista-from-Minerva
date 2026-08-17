'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  toastSuccess: (title: string, description?: string) => void;
  toastError: (title: string, description?: string) => void;
  toastWarning: (title: string, description?: string) => void;
  toastInfo: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, description, variant = 'info', duration = 4000 }: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      const newToast: ToastMessage = { id, title, description, variant, duration };

      setToasts((prev) => [newToast, ...prev].slice(0, 5));

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toastSuccess = useCallback(
    (title: string, description?: string) => addToast({ title, description, variant: 'success' }),
    [addToast]
  );

  const toastError = useCallback(
    (title: string, description?: string) => addToast({ title, description, variant: 'error' }),
    [addToast]
  );

  const toastWarning = useCallback(
    (title: string, description?: string) => addToast({ title, description, variant: 'warning' }),
    [addToast]
  );

  const toastInfo = useCallback(
    (title: string, description?: string) => addToast({ title, description, variant: 'info' }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, toastSuccess, toastError, toastWarning, toastInfo }}
    >
      {children}

      {/* Floating toast container -- compact/discreet by design (Q36): a
          thin single-line-first pill rather than a full card, small icon,
          no heavy shadow. aria-live so screen readers announce new toasts. */}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-1.5 max-w-[300px] w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.variant === 'success';
          const isError = t.variant === 'error';
          const isWarning = t.variant === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto py-2 pl-2.5 pr-2 rounded-lg border shadow-mv-md flex items-start gap-2 animate-mv-scale-in transition-all bg-mv-surface ${
                isSuccess
                  ? 'border-mv-green/30'
                  : isError
                  ? 'border-mv-red/30'
                  : isWarning
                  ? 'border-mv-amber/30'
                  : 'border-mv-border'
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-mv-green shrink-0 mt-0.5" />}
              {isError && <AlertCircle className="w-3.5 h-3.5 text-mv-red shrink-0 mt-0.5" />}
              {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-mv-amber shrink-0 mt-0.5" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-3.5 h-3.5 text-mv-green shrink-0 mt-0.5" />}

              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-bold text-mv-ink leading-tight">{t.title}</h4>
                {t.description && <p className="text-[10px] text-mv-ink-soft leading-snug mt-0.5">{t.description}</p>}
              </div>

              <button
                onClick={() => removeToast(t.id)}
                aria-label={`Fermer la notification : ${t.title}`}
                className="p-0.5 rounded text-mv-ink-faint hover:text-mv-ink hover:bg-mv-cream-soft cursor-pointer shrink-0"
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
