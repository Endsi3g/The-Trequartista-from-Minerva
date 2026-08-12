'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

// Segment-level boundary: an error inside a dashboard page (e.g. a bad
// Supabase query on /clients/[id]) used to take down the entire app,
// falling through to the root app/error.tsx and losing the sidebar/topbar
// shell. This keeps the crash scoped to the page content.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard Error Boundary]:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mv-coral/10 border border-mv-coral/30 text-mv-coral text-xs font-extrabold">
        <AlertCircle className="w-4 h-4" />
        Cette page a rencontré une erreur
      </div>
      <p className="text-xs text-mv-ink-soft max-w-sm">
        Le reste de l'application reste fonctionnel — vous pouvez réessayer ou revenir au tableau de bord.
      </p>
      {error.digest && (
        <p className="text-[10px] text-mv-ink-faint font-mono">Référence support : {error.digest}</p>
      )}
      <div className="flex items-center gap-3 pt-2">
        <Button variant="primary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => reset()}>
          Réessayer
        </Button>
        <Link href="/overview">
          <Button variant="outline" size="sm" icon={<Home className="w-3.5 h-3.5" />}>
            Tableau de bord
          </Button>
        </Link>
      </div>
    </div>
  );
}
