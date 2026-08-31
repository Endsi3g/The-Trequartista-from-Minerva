'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  MessageSquare,
  Target,
  FileSearch,
  Send,
  TrendingUp,
  Mic,
  Volume2,
  PhoneCall,
  Sparkles,
  ArrowRight,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/components/providers/ToastProvider';
import {
  fetchAcquisitionFunnelStats,
  fetchIntakeLeads,
  createTestIntakeLead,
  type AcquisitionFunnelStats,
} from '@/lib/services/supabase-data';
import type { IntakeLead } from '@/lib/types';
import { VoiceSimulationDrawer } from '@/components/acquisition/VoiceSimulationDrawer';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

type PeriodKey = '24h' | '7j' | '30j' | 'all';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: '24h', label: '24h' },
  { key: '7j', label: '7j' },
  { key: '30j', label: '30j' },
  { key: 'all', label: 'All' },
];

const STATUS_CONFIG: Record<
  IntakeLead['status'],
  { label: string; bg: string; text: string; border: string; step: string }
> = {
  step1_abandoned: {
    label: 'Étape 1 (Abandon)',
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-200',
    step: 'Étape 1',
  },
  qualified: {
    label: 'Qualifié (IA)',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    step: 'Étape 2',
  },
  converted: {
    label: 'Converti CRM',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    step: 'Converti',
  },
  discarded: {
    label: 'Écarté',
    bg: 'bg-zinc-50',
    text: 'text-zinc-500',
    border: 'border-zinc-200',
    step: 'Archivé',
  },
};

const SMS_STATUS_CONFIG: Record<
  IntakeLead['sms_follow_up_status'],
  { label: string; bg: string; text: string; border: string }
> = {
  pending: { label: 'En attente', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  sent: { label: 'Envoyé (J+0)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  failed: { label: 'Échoué', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  skipped_qualified: {
    label: 'Ignoré (Qualifié)',
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
    border: 'border-zinc-200',
  },
  skipped_no_config: {
    label: 'Non configuré',
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
    border: 'border-zinc-200',
  },
};

export default function AcquisitionDashboardPage() {
  const router = useRouter();
  const { role, workspace, loading: userLoading } = useCurrentUser();
  const { toastSuccess, toastError, toastInfo } = useToast();

  const [period, setPeriod] = useState<PeriodKey>('30j');
  const [stats, setStats] = useState<AcquisitionFunnelStats | null>(null);
  const [leads, setLeads] = useState<IntakeLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSimulatingLead, setIsSimulatingLead] = useState(false);
  const [isVoiceDrawerOpen, setIsVoiceDrawerOpen] = useState(false);

  const loadData = async (selectedPeriod: PeriodKey) => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([
        fetchAcquisitionFunnelStats(selectedPeriod),
        fetchIntakeLeads(),
      ]);
      setStats(s);
      setLeads(l);
    } catch {
      toastError('Erreur de chargement', 'Impossible de récupérer la télémétrie d’acquisition.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(period);
  }, [period]);

  const handleSimulateLead = async () => {
    setIsSimulatingLead(true);
    try {
      const created = await createTestIntakeLead();
      if (created) {
        toastSuccess('Lead de test injecté', `Nouveau prospect « ${created.first_name} » reçu via Webhook Framer.`);
        await loadData(period);
      } else {
        toastError('Erreur', 'Impossible de créer la soumission de test.');
      }
    } finally {
      setIsSimulatingLead(false);
    }
  };

  const filteredLeads = useMemo(() => {
    if (period === 'all') return leads;
    const now = Date.now();
    const days = period === '24h' ? 1 : period === '7j' ? 7 : 30;
    const cutoff = now - days * 86400000;
    return leads.filter((l) => (l.created_at ? new Date(l.created_at).getTime() >= cutoff : true));
  }, [leads, period]);

  const formatRelativeTime = (isoDate: string) => {
    if (!isoDate) return 'Récemment';
    const diffMin = Math.round((Date.now() - new Date(isoDate).getTime()) / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} j`;
  };

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

  return (
    <div className="space-y-4 pb-12">
      
      {/* ── 1. En-tête Contextuel & Barre d'Outils ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="text-xs text-zinc-400 font-mono" style={MONO}>
            Minerva / Croissance / Acquisition
          </div>
          <h1 className="text-base font-semibold text-zinc-900 mt-0.5 tracking-tight font-display">
            Funnel d&apos;Acquisition &amp; Inbound
          </h1>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Link to Review Engine 297/mo */}
          <Link href="/acquisition/review-engine">
            <button
              type="button"
              className="h-7 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Review Engine ($297/mo)</span>
            </button>
          </Link>

          {/* Framer Webhook Active Tag */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 border border-emerald-200/80 text-[10.5px] font-mono text-emerald-700" style={MONO}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Framer Webhook Active</span>
          </div>

          {/* Period Segmented Control */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200/60 h-7 text-xs font-mono" style={MONO}>
            {PERIODS.map((p) => {
              const isSelected = period === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={cn(
                    'px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer',
                    isSelected
                      ? 'bg-white text-zinc-900 font-bold shadow-2xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Quick Refresh */}
          <button
            type="button"
            onClick={() => loadData(period)}
            title="Rafraîchir les métriques"
            className="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin text-emerald-600')} />
          </button>
        </div>
      </div>

      {/* ── 2. Ruban de Conversion du Funnel (6 KPIs Connectés) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-white border border-zinc-200 rounded-lg divide-x divide-y md:divide-y-0 divide-zinc-100 shadow-xs overflow-hidden">
        
        {/* KPI 1: Leads Captés */}
        <div className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Leads Captés (Étape 1)
          </div>
          <div className="text-xl font-bold text-zinc-900 font-mono tracking-tight" style={MONO}>
            {loading ? '…' : stats?.totalIntakeLeads ?? 0}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
            <span>Formulaires bruts</span>
          </div>
        </div>

        {/* KPI 2: SMS Relance */}
        <div className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            SMS Relance (Étape 2)
          </div>
          <div className="text-xl font-bold text-zinc-900 font-mono tracking-tight" style={MONO}>
            {loading ? '…' : stats?.smsSent ?? 0}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
            <span>Relances auto</span>
          </div>
        </div>

        {/* KPI 3: Taux de Qualification */}
        <div className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Taux Qualification
          </div>
          <div className="text-xl font-bold text-emerald-700 font-mono tracking-tight" style={MONO}>
            {loading ? '…' : `${stats?.qualificationRatePct ?? 0}%`}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
            <span>{stats?.qualified ?? 0} qualifié(s)</span>
          </div>
        </div>

        {/* KPI 4: Audits Complétés */}
        <div className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Audits Complétés
          </div>
          <div className="text-xl font-bold text-zinc-900 font-mono tracking-tight" style={MONO}>
            {loading ? '…' : stats?.auditsExtracted ?? 0}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
            <span>Générés par IA</span>
          </div>
        </div>

        {/* KPI 5: Propositions Envoyées */}
        <div className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Propositions Envoyées
          </div>
          <div className="text-xl font-bold text-zinc-900 font-mono tracking-tight" style={MONO}>
            {loading ? '…' : stats?.proposalsSent ?? 0}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
            <span>Offres actives</span>
          </div>
        </div>

        {/* KPI 6: Closing Estimé */}
        <div className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Closing Estimé
          </div>
          <div className="text-xl font-bold text-emerald-700 font-mono tracking-tight" style={MONO}>
            {loading ? '…' : `${stats?.closeRatePct ?? 0}%`}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
            <span>Conversion finale</span>
          </div>
        </div>

      </div>

      {/* ── 3. Bandeau de Test Vocal Compact (Voice Agent Strip - 40px) ── */}
      <div className="bg-white border border-zinc-200 rounded-lg px-4 py-2 flex items-center justify-between shadow-xs h-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
            <Volume2 className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold text-zinc-900">Assistant vocal Minerva (Alex)</span>
            <span className="hidden sm:inline text-zinc-300">•</span>
            <span className="hidden sm:inline text-[11px] text-zinc-400 truncate">
              Qualification vocale instantanée des leads entrants
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsVoiceDrawerOpen(true)}
          className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Tester l&apos;appel de simulation</span>
        </button>
      </div>

      {/* ── 4. DataTable des Leads Captés (Étape 1 & 2) ── */}
      <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-xs">
        
        {/* Table Toolbar Header */}
        <div className="px-4 py-2.5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-900">Leads Captés en Temps Réel</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 font-bold" style={MONO}>
              {filteredLeads.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateLead}
              disabled={isSimulatingLead}
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 px-2 py-0.5 rounded transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3 h-3" />
              <span>{isSimulatingLead ? 'Injection…' : 'Simuler une soumission de test'}</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/30 text-[10px] uppercase font-bold text-zinc-500 tracking-wider h-8">
                <th className="py-2 px-4 font-semibold">Prospect / Contact</th>
                <th className="py-2 px-3 font-semibold">Source</th>
                <th className="py-2 px-3 font-semibold">Échelon Funnel</th>
                <th className="py-2 px-3 font-semibold">Qualification IA</th>
                <th className="py-2 px-3 font-semibold">SMS Relance</th>
                <th className="py-2 px-3 font-semibold">Date Capture</th>
                <th className="py-2 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {filteredLeads.length === 0 ? (
                /* ── Empty State Active Listener ── */
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2 max-w-md mx-auto">
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>En écoute active des soumissions de formulaire Framer…</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Les prospects qui débutent ou abandonnent l&apos;Étape 1 apparaîtront ici automatiquement avec déclenchement de la relance SMS.
                      </p>
                      <button
                        type="button"
                        onClick={handleSimulateLead}
                        disabled={isSimulatingLead}
                        className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        + Simuler une soumission de test immédiate
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const statusConf = STATUS_CONFIG[lead.status] || STATUS_CONFIG.step1_abandoned;
                  const smsConf = SMS_STATUS_CONFIG[lead.sms_follow_up_status] || SMS_STATUS_CONFIG.pending;
                  const companyName = (lead.qualification_data?.company as string) || 'Entreprise Prospect';
                  const budgetEstimate = (lead.qualification_data?.budget_estimate as string) || null;

                  return (
                    <tr key={lead.id} className="hover:bg-zinc-50/70 transition-colors h-10">
                      {/* 1. Prospect */}
                      <td className="py-2.5 px-4 font-medium text-zinc-900">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-[10px] shrink-0 border border-zinc-200/60">
                            {lead.first_name?.charAt(0) || 'P'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-zinc-900 truncate">
                              {lead.first_name || 'Prospect Anonyme'}{' '}
                              <span className="text-zinc-400 font-normal text-[11px]">({companyName})</span>
                            </div>
                            <div className="text-[10.5px] text-zinc-500 font-mono truncate" style={MONO}>
                              {lead.phone || lead.email || 'Sans coordonnée'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Source */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500" style={MONO}>
                        {lead.source || 'Formulaire'}
                      </td>

                      {/* 3. Échelon Funnel */}
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold border',
                            statusConf.bg,
                            statusConf.text,
                            statusConf.border
                          )}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* 4. Qualification IA */}
                      <td className="py-2.5 px-3">
                        {lead.status === 'qualified' || lead.status === 'converted' ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-blue-700 font-medium font-mono" style={MONO}>
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            <span>Score 8.5/10</span>
                          </div>
                        ) : budgetEstimate ? (
                          <span className="text-[10.5px] text-zinc-600 font-mono" style={MONO}>
                            {budgetEstimate}
                          </span>
                        ) : (
                          <span className="text-[10.5px] text-zinc-400 italic">En attente</span>
                        )}
                      </td>

                      {/* 5. SMS Relance */}
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border font-mono',
                            smsConf.bg,
                            smsConf.text,
                            smsConf.border
                          )}
                          style={MONO}
                        >
                          {lead.sms_follow_up_status === 'sent' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {smsConf.label}
                        </span>
                      </td>

                      {/* 6. Date Capture */}
                      <td className="py-2.5 px-3 text-[11px] text-zinc-500 font-mono whitespace-nowrap" style={MONO}>
                        {formatRelativeTime(lead.created_at)}
                      </td>

                      {/* 7. Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {lead.crm_lead_id ? (
                            <Link
                              href={`/leads/${lead.crm_lead_id}`}
                              className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>Voir Lead CRM</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                toastInfo('Fiche prospect', `Détails de ${lead.first_name} (${companyName}) ouverts.`);
                              }}
                              className="px-2 py-0.5 rounded text-[11px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                            >
                              Voir fiche
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Voice Simulation Drawer Modal ── */}
      <VoiceSimulationDrawer
        isOpen={isVoiceDrawerOpen}
        onClose={() => setIsVoiceDrawerOpen(false)}
        onLeadConverted={async (companyName) => {
          await handleSimulateLead();
          toastSuccess('Lead créé', `Fiche audit et lead pour ${companyName} générés.`);
        }}
      />

    </div>
  );
}
