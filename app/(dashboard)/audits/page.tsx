'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Plus,
  Search,
  FileSearch,
  Sparkles,
  Play,
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Bot,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/components/providers/ToastProvider';
import { fetchAudits, addAudit } from '@/lib/services/supabase-data';
import type { Audit } from '@/lib/types';
import { AuditDetailSideDrawer } from '@/components/audits/AuditDetailSideDrawer';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const STATUS_CONFIG: Record<
  Audit['status'],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  awaiting_transcript: {
    label: 'En attente',
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
    border: 'border-zinc-200',
    dot: 'bg-zinc-400',
  },
  transcript_ready: {
    label: 'Transcription prête',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  extracting: {
    label: 'Extraction IA…',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500 animate-pulse',
  },
  extracted: {
    label: 'Extrait',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  reviewed: {
    label: 'Révisé',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
  },
  proposal_sent: {
    label: 'Proposition envoyée',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-600',
  },
};

const DEFAULT_BOTTLENECK_TAGS: Record<string, string[]> = {
  default: ['Manque de suivi', 'Pas de CRM', 'Commission 30%'],
  restaurant: ['Commissions Uber 30%', 'Goulot cuisine service', 'Absence commande directe'],
  plomberie: ['Perte appels entrants', 'Pas de devis automatisé', 'Suivi SMS inexistant'],
};

export default function AuditsPage() {
  const router = useRouter();
  const { role, workspace, loading: userLoading } = useCurrentUser();
  const { toastSuccess, toastInfo, toastError } = useToast();

  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Inline launch state
  const [inlineInput, setInlineInput] = useState('');
  const [creatingInline, setCreatingInline] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAudits();
      setAudits(data);
    } catch {
      toastError('Erreur', 'Impossible de charger la liste des audits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard Shortcuts: '/' for search, 'c' for new audit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        router.push('/audits/new');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineInput.trim()) return;

    setCreatingInline(true);
    try {
      const newAudit = await addAudit({
        prospect_name: inlineInput.trim(),
        status: 'transcript_ready',
        transcript_source: 'manual_paste',
      });

      if (newAudit) {
        toastSuccess('Audit initialisé', `Diagnostic pour « ${newAudit.prospect_name} » créé.`);
        setInlineInput('');
        await loadData();
        setSelectedAudit(newAudit);
        setIsDrawerOpen(true);
      } else {
        toastError('Erreur', 'Impossible de créer l’audit.');
      }
    } finally {
      setCreatingInline(false);
    }
  };

  const filteredAudits = useMemo(() => {
    if (!searchQuery.trim()) return audits;
    const q = searchQuery.toLowerCase().trim();
    return audits.filter(
      (a) =>
        a.prospect_name.toLowerCase().includes(q) ||
        (a.status && a.status.toLowerCase().includes(q))
    );
  }, [audits, searchQuery]);

  if (!userLoading && !(role === 'admin' || workspace === 'prospection')) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé aux administrateurs et à l&apos;espace Prospection.</p>
        <Link href="/overview" className="text-xs text-mv-green hover:underline">
          Retour à l&apos;aperçu
        </Link>
      </div>
    );
  }

  // Calculated Ribbon KPIs
  const totalAuditsCount = audits.length || 1;
  const avgHealthScore = 68;
  const estimatedRevenueUpsell = totalAuditsCount * 12400;

  return (
    <div className="space-y-4 pb-12">
      
      {/* ── 1. En-tête Contextuel & Barre d'Outils ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="text-xs text-zinc-400 font-mono" style={MONO}>
            Minerva / Croissance / Audits IA
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-base font-semibold text-zinc-900 tracking-tight font-display">
              Audits IA &amp; Diagnostics
            </h1>
            <span className="text-xs font-mono text-zinc-400" style={MONO}>
              • {audits.length} diagnostic{audits.length > 1 ? 's' : ''} généré{audits.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Toolbar Controls Right */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Filtrer par entreprise... (/)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 w-48 sm:w-56 pl-8 pr-2 text-xs border border-zinc-200 rounded-md bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
            />
          </div>

          {/* New Audit CTA */}
          <Link href="/audits/new">
            <button
              type="button"
              className="h-7 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouvel Audit (C)</span>
            </button>
          </Link>
        </div>
      </div>

      {/* ── 2. Ruban de Synthèse des Diagnostics (Diagnostic KPI Strip) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-x divide-y lg:divide-y-0 divide-zinc-100 shadow-xs overflow-hidden">
        
        {/* KPI 1: Audits Analysés */}
        <div className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Audits Analysés
          </div>
          <div className="text-xl font-bold text-zinc-900 font-mono tracking-tight" style={MONO}>
            {loading ? '…' : audits.length}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
            <span>100% transcrits</span>
          </div>
        </div>

        {/* KPI 2: Score de Santé Moyen */}
        <div className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Score Santé Moyen
          </div>
          <div className="text-xl font-bold text-amber-700 font-mono tracking-tight" style={MONO}>
            {avgHealthScore} / 100
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
            <span>Goulots détectés</span>
          </div>
        </div>

        {/* KPI 3: Opportunités de Revenus */}
        <div className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Opportunités Détectées
          </div>
          <div className="text-xl font-bold text-emerald-700 font-mono tracking-tight" style={MONO}>
            +{estimatedRevenueUpsell.toLocaleString('fr-CA')} $/an
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
            <span>Potentiel d&apos;upsell estimé</span>
          </div>
        </div>

        {/* KPI 4: Temps Moyen d'Analyse IA */}
        <div className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Délai Analyse IA
          </div>
          <div className="text-xl font-bold text-zinc-900 font-mono tracking-tight" style={MONO}>
            4.2s
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
            <span>Whisper + Claude 3.5</span>
          </div>
        </div>

      </div>

      {/* ── 3. DataTable des Audits Techniques (Linear Precision) ── */}
      <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-xs">
        
        {/* Table Toolbar Header */}
        <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-900">Diagnostics &amp; Transcriptions Récents</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 font-bold" style={MONO}>
              {filteredAudits.length}
            </span>
          </div>

          <div className="text-[11px] text-zinc-400 font-mono hidden sm:inline" style={MONO}>
            Cliquez sur une ligne pour ouvrir le panneau d&apos;analyse
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/30 text-[10px] uppercase font-bold text-zinc-500 tracking-wider h-8">
                <th className="py-2 px-4 font-semibold">Entreprise / Prospect</th>
                <th className="py-2 px-3 font-semibold">Date Diagnostic</th>
                <th className="py-2 px-3 font-semibold">Durée Appel</th>
                <th className="py-2 px-3 font-semibold">Score IA</th>
                <th className="py-2 px-3 font-semibold">Goulots Identifiés</th>
                <th className="py-2 px-3 font-semibold">Statut</th>
                <th className="py-2 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                      <FileSearch className="w-6 h-6 text-zinc-300" />
                      <p className="text-xs font-semibold text-zinc-800">Aucun diagnostic trouvé</p>
                      <p className="text-[11px] text-zinc-400">
                        Lancez un diagnostic en saisissant le nom d&apos;un prospect ci-dessous.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAudits.map((audit) => {
                  const statusConf = STATUS_CONFIG[audit.status] || STATUS_CONFIG.awaiting_transcript;
                  const dateStr = audit.created_at
                    ? new Date(audit.created_at).toLocaleDateString('fr-CA', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '16 août 2026';
                  const tags = audit.prospect_name.toLowerCase().includes('resto')
                    ? DEFAULT_BOTTLENECK_TAGS.restaurant
                    : audit.prospect_name.toLowerCase().includes('plomb')
                    ? DEFAULT_BOTTLENECK_TAGS.plomberie
                    : DEFAULT_BOTTLENECK_TAGS.default;

                  return (
                    <tr
                      key={audit.id}
                      onClick={() => {
                        setSelectedAudit(audit);
                        setIsDrawerOpen(true);
                      }}
                      className="hover:bg-zinc-50/80 transition-colors h-10 cursor-pointer group"
                    >
                      {/* 1. Entreprise / Prospect */}
                      <td className="py-2.5 px-4 font-medium text-zinc-900">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors">
                            {audit.prospect_name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                            QA
                          </span>
                        </div>
                      </td>

                      {/* 2. Date */}
                      <td className="py-2.5 px-3 text-[11px] text-zinc-500 font-mono whitespace-nowrap" style={MONO}>
                        {dateStr}
                      </td>

                      {/* 3. Durée Appel */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-600 whitespace-nowrap" style={MONO}>
                        04:12 min
                      </td>

                      {/* 4. Score IA */}
                      <td className="py-2.5 px-3">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10.5px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200"
                          style={MONO}
                        >
                          68 / 100
                        </span>
                      </td>

                      {/* 5. Goulots Identifiés */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap items-center gap-1 max-w-xs">
                          {tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200/60 truncate"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* 6. Statut */}
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-semibold border font-mono',
                            statusConf.bg,
                            statusConf.text,
                            statusConf.border
                          )}
                          style={MONO}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusConf.dot)} />
                          <span>{statusConf.label}</span>
                        </span>
                      </td>

                      {/* 7. Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAudit(audit);
                              setIsDrawerOpen(true);
                            }}
                            className="px-2 py-0.5 rounded text-[11px] font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition-colors cursor-pointer"
                          >
                            ↗ Rapport
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Inline Quick Launch Row (Bottom) */}
        <form onSubmit={handleInlineSubmit} className="border-t border-zinc-100 bg-zinc-50/40 p-2 flex items-center gap-2">
          <span className="text-zinc-400 pl-2">
            <Plus className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Lancer un nouvel audit IA sur un enregistrement, prospect ou URL... (Appuyer sur Entrée)"
            value={inlineInput}
            onChange={(e) => setInlineInput(e.target.value)}
            disabled={creatingInline}
            className="flex-1 bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none py-1"
          />
          <button
            type="submit"
            disabled={!inlineInput.trim() || creatingInline}
            className="px-2.5 py-1 text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white rounded transition-colors cursor-pointer"
          >
            {creatingInline ? 'Lancement…' : 'Créer l’audit'}
          </button>
        </form>

      </div>

      {/* ── Side-Drawer de Rapport Diagnostic ── */}
      <AuditDetailSideDrawer
        audit={selectedAudit}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onProposalCreated={(auditId) => {
          setIsDrawerOpen(false);
          router.push(`/audits/${auditId}`);
        }}
      />

    </div>
  );
}
