'use client';

import React from 'react';
import { LucideIcon, Inbox, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div className="p-8 md:p-12 text-center rounded-2xl bg-mv-cream-soft/60 border border-dashed border-mv-border flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto my-6 animate-mv-scale-in">
      <div className="w-14 h-14 rounded-2xl bg-mv-green-tint border border-mv-green/30 flex items-center justify-center text-mv-green shadow-mv-sm">
        <Icon className="w-7 h-7" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-mv-ink tracking-tight font-display">{title}</h3>
        <p className="text-xs text-mv-ink-soft leading-relaxed max-w-sm mx-auto">{description}</p>
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3 pt-2">
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={onAction}>
              {actionLabel}
            </Button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
