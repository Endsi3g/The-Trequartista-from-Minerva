'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-mv-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-mv-surface border border-mv-border rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-mv-lg animate-mv-scale-in">
        <div className="flex items-center justify-between border-b border-mv-border pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${isDangerous ? 'text-mv-coral' : 'text-mv-amber'}`} />
            <h3 className="text-base font-extrabold text-mv-ink">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-mv-ink-soft leading-relaxed font-medium">{description}</p>

        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
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
