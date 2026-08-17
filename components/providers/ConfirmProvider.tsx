'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

// Reach's exact spring — the single spring used for every animation in the app.
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30, mass: 1 };

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | undefined>(undefined);

  const confirmDialog = useCallback<ConfirmFn>((options) => {
    setState(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    resolver.current?.(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirmDialog}>
      {children}

      <AnimatePresence>
        {state && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="absolute inset-0 bg-mv-ink/40 backdrop-blur-[2px]"
              onClick={() => close(false)}
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              className="relative w-full max-w-sm bg-mv-surface border border-mv-border rounded-2xl shadow-mv-lg p-6 space-y-4"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={SPRING}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    state.variant === 'danger'
                      ? 'bg-mv-red-bg text-mv-red border-mv-red/30'
                      : 'bg-mv-green-tint text-mv-green border-mv-green/30'
                  }`}
                >
                  {state.variant === 'danger' ? <AlertTriangle className="w-4.5 h-4.5" /> : <HelpCircle className="w-4.5 h-4.5" />}
                </div>
                <div className="min-w-0 pt-0.5">
                  <h2 id="confirm-dialog-title" className="text-sm font-extrabold text-mv-ink">{state.title}</h2>
                  {state.message && (
                    <p className="text-xs text-mv-ink-soft mt-1 leading-relaxed">{state.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="px-4 py-2 rounded-xl bg-mv-cream-soft border border-mv-border text-xs font-bold text-mv-ink hover:bg-mv-border/40 transition-colors cursor-pointer"
                >
                  {state.cancelLabel || 'Annuler'}
                </button>
                <button
                  type="button"
                  onClick={() => close(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-mv-sm transition-colors cursor-pointer ${
                    state.variant === 'danger' ? 'bg-mv-red hover:bg-mv-red/90' : 'bg-mv-green hover:bg-mv-green-dark'
                  }`}
                >
                  {state.confirmLabel || 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return ctx;
}
