'use client';

import React from 'react';
import Image from 'next/image';

interface BonsaiPlantLoaderProps {
  title?: string;
  subtitle?: string;
}

export function BonsaiPlantLoader({
  title = 'Hold tight!',
  subtitle = 'Your account is being configured...',
}: BonsaiPlantLoaderProps) {
  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center animate-mv-scale-in rounded-2xl">
      <div className="relative w-36 h-40 mb-4 flex items-center justify-center animate-pulse">
        <Image
          src="/bonsai-plant-outline.svg"
          alt="Loading Plant"
          width={140}
          height={160}
          className="object-contain"
          priority
        />
      </div>

      <h3 className="text-xl font-extrabold text-mv-ink tracking-tight font-display">
        {title}
      </h3>
      <p className="text-sm font-medium text-mv-ink-soft mt-1">
        {subtitle}
      </p>
    </div>
  );
}
