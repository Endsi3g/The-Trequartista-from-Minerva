'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Plus, FileSearch } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useCurrentUser } from '@/hooks/use-current-user';
import { fetchAudits } from '@/lib/services/supabase-data';
import type { Audit } from '@/lib/types';

// Six pipeline stages track progress via intensity of the single green
// accent (mv-amber is aliased to mv-green -- see CLAUDE.md -- so the old
// 'amber' variant made transcript_ready/extracting render identically to
// reviewed/proposal_sent, hiding real progress differences).
const STATUS_BADGE: Record<Audit['status'], { variant: 'neutral' | 'green'; style?: React.CSSProperties; label: string }> = {
  awaiting_transcript: { variant: 'neutral', label: 'En attente de transcription' },
  transcript_ready: {
    variant: 'neutral',
    style: { backgroundColor: 'rgba(5, 150, 105, 0.08)', borderColor: 'rgba(5, 150, 105, 0.25)', color: '#047857' },
    label: 'Transcription prête',
  },
  extracting: {
    variant: 'neutral',
    style: { backgroundColor: 'rgba(5, 150, 105, 0.14)', borderColor: 'rgba(5, 150, 105, 0.3)', color: '#047857' },
    label: 'Extraction en cours',
  },
  extracted: {
    variant: 'neutral',
    style: { backgroundColor: 'rgba(5, 150, 105, 0.22)', borderColor: 'rgba(5, 150, 105, 0.4)', color: '#065f46' },
    label: 'Extrait',
  },
  reviewed: { variant: 'green', label: 'Révisé' },
  proposal_sent: { variant: 'green', label: 'Proposition envoyée' },
};

export default function AuditsPage() {
  const { role, loading: userLoading } = useCurrentUser();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setAudits(await fetchAudits());
      setLoading(false);
    })();
  }, []);

  if (!userLoading && role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé aux administrateurs.</p>
        <Link href="/overview" className="text-xs text-mv-green hover:underline">Retour à l'aperçu</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Audits IA & Diagnostics
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Transcriptions d'appels de diagnostic, extraction IA des goulots d'étranglement, coûts cachés et opportunités.
          </p>
        </div>
        <Link href="/audits/new">
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
            Nouvel Audit
          </Button>
        </Link>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-xs text-mv-ink-soft">Chargement…</div>
        ) : audits.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="Aucun audit"
            description="Créez un audit après un appel de diagnostic pour lancer l'extraction IA des bottlenecks et coûts cachés."
          />
        ) : (
          <div className="divide-y divide-mv-border/40">
            {audits.map((audit) => (
              <Link
                key={audit.id}
                href={`/audits/${audit.id}`}
                className="flex items-center justify-between py-4 px-1 hover:bg-mv-cream-soft/40 transition-colors"
              >
                <div>
                  <div className="font-bold text-sm text-mv-ink">{audit.prospect_name}</div>
                  <div className="text-[11px] text-mv-ink-soft mt-0.5">
                    {new Date(audit.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <Badge variant={STATUS_BADGE[audit.status].variant} style={STATUS_BADGE[audit.status].style}>
                  {STATUS_BADGE[audit.status].label}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
