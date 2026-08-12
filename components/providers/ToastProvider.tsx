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

      {/* Floating Animated Toast Container — aria-live so screen readers announce new toasts */}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.variant === 'success';
          const isError = t.variant === 'error';
          const isWarning = t.variant === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-3.5 rounded-2xl border shadow-mv-lg flex items-start justify-between gap-3 animate-mv-scale-in transition-all ${
                isSuccess
                  ? 'bg-mv-surface border-mv-green/40 text-mv-ink'
                  : isError
                  ? 'bg-mv-surface border-mv-coral/40 text-mv-ink'
                  : isWarning
                  ? 'bg-mv-surface border-mv-amber/40 text-mv-ink'
                  : 'bg-mv-surface border-mv-border text-mv-ink'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-mv-green shrink-0 mt-0.5" />}
                {isError && <AlertCircle className="w-5 h-5 text-mv-coral shrink-0 mt-0.5" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-mv-amber shrink-0 mt-0.5" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-mv-green shrink-0 mt-0.5" />}

                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-mv-ink leading-tight">{t.title}</h4>
                  {t.description && <p className="text-[11px] text-mv-ink-soft leading-normal">{t.description}</p>}
                </div>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                aria-label={`Fermer la notification : ${t.title}`}
                className="p-1 rounded-lg text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
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
