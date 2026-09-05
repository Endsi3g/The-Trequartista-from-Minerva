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
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`p-8 text-center rounded-2xl bg-white border border-[#f2f2f2] flex flex-col items-center justify-center space-y-3 max-w-md mx-auto my-6 shadow-2xs ${className}`}>
      <div className="w-10 h-10 rounded bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-600 shadow-2xs">
        <Icon className="w-5 h-5" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[#08090a] tracking-tight">{title}</h3>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">{description}</p>
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-2 pt-1">
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={onAction}>
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
