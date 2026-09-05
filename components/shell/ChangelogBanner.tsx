'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, ArrowRight, Sparkles } from 'lucide-react';
import { useLatestChangelogEntry } from '@/hooks/use-latest-changelog-entry';

const STORAGE_KEY = 'mv-changelog-banner-dismissed-id';

export function ChangelogBanner() {
  const entry = useLatestChangelogEntry();
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDismissedId(localStorage.getItem(STORAGE_KEY));
    setHydrated(true);
  }, []);

  if (!hydrated || !entry || entry.id === dismissedId) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, entry.id);
    setDismissedId(entry.id);
  };

  return (
    <div className="flex items-center justify-center gap-2.5 px-4 py-2 bg-[#059669] text-white text-xs relative z-50 border-b border-mv-green-dark">
      <div className="flex items-center gap-2 flex-wrap justify-center pr-6">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 text-white text-[11px] font-bold shrink-0">
          <Sparkles className="w-3 h-3 text-[#a7f3d0]" />
          {entry.version ? `v${entry.version}` : 'Nouveauté'}
        </span>

        <span className="font-semibold text-white/95 truncate max-w-md sm:max-w-xl">
          {entry.title}
        </span>

        <Link
          href="/changelog"
          className="inline-flex items-center gap-1 text-[#a7f3d0] hover:underline font-bold text-xs shrink-0"
        >
          <span>Lire la suite</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <button
        onClick={handleDismiss}
        aria-label="Fermer la bannière"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-white/70 hover:text-white hover:bg-black/20 transition-all cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
