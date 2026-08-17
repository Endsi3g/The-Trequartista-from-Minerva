'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  shape?: 'circle' | 'rounded';
  showStatus?: boolean;
  statusActive?: boolean;
  bgColor?: string;
  textColor?: string;
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-lg font-bold',
  '2xl': 'w-20 h-20 text-xl font-bold',
};

const STATUS_SIZE_MAP = {
  xs: 'w-1.5 h-1.5 ring-1',
  sm: 'w-2 h-2 ring-1',
  md: 'w-2.5 h-2.5 ring-2',
  lg: 'w-3 h-3 ring-2',
  xl: 'w-3.5 h-3.5 ring-2',
  '2xl': 'w-4 h-4 ring-2',
};

export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    const prefix = email.split('@')[0];
    return prefix.slice(0, 2).toUpperCase();
  }
  return 'MV';
}

export function UserAvatar({
  src,
  name,
  email,
  size = 'md',
  className,
  shape = 'circle',
  showStatus = false,
  statusActive = true,
  bgColor,
  textColor,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const initials = getInitials(name, email);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  const showImage = Boolean(src && !hasError && !src.includes('dicebear.com/7.x/broken'));

  return (
    <div className={cn('relative inline-flex shrink-0 select-none items-center justify-center font-display font-bold tracking-wider', sizeClass, className)}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={name || email || 'Avatar'}
          onError={() => setHasError(true)}
          className={cn('w-full h-full object-cover border border-mv-border/80 shadow-mv-sm transition-opacity duration-200', shapeClass)}
        />
      ) : (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center border border-mv-green/30 shadow-mv-sm select-none',
            shapeClass,
            bgColor ? '' : 'bg-[#059669]',
            textColor ? '' : 'text-[#F7F5F0]'
          )}
          style={{
            backgroundColor: bgColor || '#059669',
            color: textColor || '#F7F5F0',
          }}
          title={name || email || 'Minerva'}
        >
          <span>{initials}</span>
        </div>
      )}

      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-mv-surface',
            STATUS_SIZE_MAP[size] || STATUS_SIZE_MAP.md,
            statusActive ? 'bg-mv-green' : 'bg-mv-ink-faint'
          )}
        />
      )}
    </div>
  );
}
