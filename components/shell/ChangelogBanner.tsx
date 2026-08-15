'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Sparkles } from 'lucide-react';
import { useLatestChangelogEntry } from '@/hooks/use-latest-changelog-entry';

const STORAGE_KEY = 'mv-changelog-banner-dismissed-id';

// Full-bleed strip above the sidebar/topbar announcing the latest shipped
// changelog entry -- dismissal is remembered per entry id (localStorage),
// so a NEW entry always re-shows the banner even if a previous one was
// dismissed.
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
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-mv-green text-white text-xs sm:text-sm relative">
      <Sparkles className="w-3.5 h-3.5 shrink-0" />
      <span className="text-center">
        <strong className="font-bold">{entry.version ? `Version ${entry.version}` : entry.title} disponible !</strong>{' '}
        <span className="opacity-90">
          {entry.version && `${entry.title} — `}Consultez les notes complètes{' '}
          <Link href="/changelog" className="underline underline-offset-2 font-semibold">
            ici
          </Link>
          .
        </span>
      </span>
      <button
        onClick={handleDismiss}
        aria-label="Fermer"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
