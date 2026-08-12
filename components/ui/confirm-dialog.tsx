'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  isDangerous = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = 'confirm-dialog-title';
  const descId = 'confirm-dialog-desc';

  // Focus the confirm button when opened; restore focus when closed
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    confirmBtnRef.current?.focus();

    // Apply `inert` to everything except the dialog
    document.body.childNodes.forEach((node) => {
      if (node instanceof HTMLElement && !node.contains(dialogRef.current)) {
        node.setAttribute('inert', '');
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      // Focus trap: Tab / Shift+Tab cycles inside dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Remove inert from all elements
      document.body.childNodes.forEach((node) => {
        if (node instanceof HTMLElement) node.removeAttribute('inert');
      });
      previouslyFocused?.focus();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-mv-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="bg-mv-surface border border-mv-border rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-mv-lg animate-mv-scale-in"
      >
        <div className="flex items-center justify-between border-b border-mv-border pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${isDangerous ? 'text-mv-red' : 'text-mv-amber'}`} />
            <h3 id={titleId} className="text-base font-extrabold text-mv-ink">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            aria-label="Fermer la boîte de dialogue"
            className="p-1 rounded-lg text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <p id={descId} className="text-xs text-mv-ink-soft leading-relaxed font-medium">{description}</p>

        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmBtnRef}
            variant={isDangerous ? 'destructive' : 'primary'}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
