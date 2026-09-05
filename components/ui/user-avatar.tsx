'use client';

import React, { useState, useEffect, useMemo } from 'react';
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

// Distinct curated gradients based on user string hash
const AVATAR_GRADIENTS = [
  'bg-gradient-to-br from-emerald-600 to-teal-800 text-white',
  'bg-gradient-to-br from-blue-600 to-indigo-800 text-white',
  'bg-gradient-to-br from-purple-600 to-indigo-900 text-white',
  'bg-gradient-to-br from-rose-500 to-pink-700 text-white',
  'bg-gradient-to-br from-amber-500 to-orange-700 text-white',
  'bg-gradient-to-br from-cyan-600 to-blue-800 text-white',
  'bg-gradient-to-br from-violet-600 to-purple-800 text-white',
  'bg-gradient-to-br from-zinc-700 to-zinc-900 text-white',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

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
  const initials = useMemo(() => getInitials(name, email), [name, email]);

  const gradientClass = useMemo(() => {
    const seed = name || email || 'minerva';
    const index = hashString(seed) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[index];
  }, [name, email]);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const shapeClass = 'rounded';

  const validSrc = Boolean(
    src &&
      src.trim() !== '' &&
      !hasError &&
      !src.includes('dicebear.com/7.x/broken') &&
      (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:'))
  );

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center font-sans font-medium tracking-wider overflow-hidden ring-1 ring-black/[0.06] shadow-2xs',
        sizeClass,
        shapeClass,
        className
      )}
    >
      {validSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src!}
          alt={name || email || 'Avatar'}
          loading="lazy"
          onError={() => setHasError(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-200',
            shapeClass
          )}
        />
      ) : (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center select-none font-bold',
            shapeClass,
            bgColor ? '' : gradientClass
          )}
          style={{
            backgroundColor: bgColor || undefined,
            color: textColor || undefined,
          }}
          title={name || email || 'Minerva'}
        >
          <span className="leading-none">{initials}</span>
        </div>
      )}

      {showStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-[2px] ring-2 ring-white',
            STATUS_SIZE_MAP[size] || STATUS_SIZE_MAP.md,
            statusActive ? 'bg-emerald-500' : 'bg-zinc-400'
          )}
        />
      )}
    </div>
  );
}
