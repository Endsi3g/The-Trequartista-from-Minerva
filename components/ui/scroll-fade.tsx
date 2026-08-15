'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ScrollFadeProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

// Wraps long content in a scrollable area with a soft fade at the top and
// bottom edges (mask-image gradient) so it's visually obvious there's more
// to scroll to, instead of a hard content cutoff. Built on the installed
// @skiper-ui/skiper87 ScrollArea primitive.
export function ScrollFade({ children, className, maxHeight = '70vh' }: ScrollFadeProps) {
  return (
    <ScrollArea
      className={cn('w-full', className)}
      style={{
        maxHeight,
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)',
        maskImage: 'linear-gradient(to bottom, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)',
      }}
    >
      {children}
    </ScrollArea>
  );
}
