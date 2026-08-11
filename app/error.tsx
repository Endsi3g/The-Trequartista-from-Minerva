'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw, Home, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error Boundary Caught]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-mv-surface text-mv-ink flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-md w-full text-center space-y-6 relative z-10 animate-mv-scale-in">
        {/* Error Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mv-coral/10 border border-mv-coral/30 text-mv-coral text-xs font-extrabold shadow-mv-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Erreur d'Exécution Capturee</span>
        </div>

        <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">
          Un problème est survenu
        </h1>

        <p className="text-xs text-mv-ink-soft leading-relaxed max-w-sm mx-auto">
          L'application Minerva a rencontré une anomalie inattendue. Nos triggers de secours ont préservé vos données.
        </p>

        {/* Technical Error Snippet */}
        {error.message && (
          <div className="p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-left text-[11px] font-mono text-mv-ink-soft overflow-x-auto space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-mv-coral">
              <Terminal className="w-3.5 h-3.5" /> Diagnostic Error Message:
            </div>
            <p className="text-mv-ink">{error.message}</p>
            {error.digest && <p className="text-[10px] text-mv-ink-faint">Digest: {error.digest}</p>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="primary" icon={<RefreshCw className="w-4 h-4" />} onClick={() => reset()}>
            Réessayer l'action
          </Button>

          <Link href="/overview">
            <Button variant="outline" icon={<Home className="w-4 h-4" />}>
              Accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
