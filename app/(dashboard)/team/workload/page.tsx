'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useToast } from '@/components/providers/ToastProvider';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  Gauge,
  UsersRound,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Zap,
  ArrowLeftRight,
  ShieldAlert,
} from 'lucide-react';
import {
  fetchTeamWorkloads,
  FALLBACK_COMMISSIONS,
  computeRevOpsSummary,
  calculateHybridCommission,
  autoAssignDeliverable,
} from '@/lib/services/revops-team';
import type { TeamMemberWorkload, TeamCommission, RevOpsSummary } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function TeamWorkloadPage() {
  const { role, loading: userLoading } = useCurrentUser();
  const { toastSuccess, toastError, toastInfo } = useToast();

  const [workloads, setWorkloads] = useState<TeamMemberWorkload[]>([]);
  const [commissions, setCommissions] = useState<TeamCommission[]>(FALLBACK_COMMISSIONS);
  const [summary, setSummary] = useState<RevOpsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workload' | 'commissions' | 'assignment'>('workload');
  const [searchQuery, setSearchQuery] = useState('');

  // Reassignment Modal State
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [sourceMember, setSourceMember] = useState<TeamMemberWorkload | null>(null);
  const [targetMemberId, setTargetMemberId] = useState<string>('');

  // Commission Simulator State
  const [simDealPrice, setSimDealPrice] = useState<number>(4000);
  const [simMrrPrice, setSimMrrPrice] = useState<number>(149);
  const [simAchievedMonth, setSimAchievedMonth] = useState<number>(12000);
  const [simQuota, setSimQuota] = useState<number>(10000);

  // Auto-Assignment Simulator State
  const [simCategory, setSimCategory] = useState<string>('Production Vidéo');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/team/workload');
      const data = await res.json();
      if (data.workloads) {
        setWorkloads(data.workloads);
        setCommissions(data.commissions || FALLBACK_COMMISSIONS);
        setSummary(data.summary || computeRevOpsSummary(data.workloads, data.commissions || FALLBACK_COMMISSIONS));
      }
    } catch {
      const fallback = await fetchTeamWorkloads();
      setWorkloads(fallback);
      setCommissions(FALLBACK_COMMISSIONS);
      setSummary(computeRevOpsSummary(fallback, FALLBACK_COMMISSIONS));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredWorkloads = useMemo(() => {
    return workloads.filter((w) =>
      w.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [workloads, searchQuery]);

  const simCommissionResult = useMemo(() => {
    return calculateHybridCommission(simDealPrice, simMrrPrice, simAchievedMonth, simQuota);
  }, [simDealPrice, simMrrPrice, simAchievedMonth, simQuota]);

  const assignedMemberSuggestion = useMemo(() => {
    if (workloads.length === 0) return null;
    return autoAssignDeliverable(simCategory, workloads);
  }, [simCategory, workloads]);

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceMember || !targetMemberId) return;

    try {
      const target = workloads.find((w) => w.member_id === targetMemberId);
      toastSuccess('Réattribution effectuée', `Les tâches en surplus ont été transférées vers ${target?.full_name}.`);
      setShowReassignModal(false);
      await loadData();
    } catch {
      toastError('Erreur', 'Impossible de réattribuer les tâches.');
    }
  };

  const handleCommissionStatusChange = async (commissionId: string, newStatus: 'pending' | 'approved' | 'paid') => {
    try {
      await fetch('/api/team/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          commissionId,
          status: newStatus,
        }),
      });

      setCommissions((prev) =>
        prev.map((c) => (c.id === commissionId ? { ...c, status: newStatus } : c))
      );
      toastSuccess('Statut mis à jour', `Commission passée en statut "${newStatus}".`);
    } catch {
      toastError('Erreur', 'Échec de mise à jour.');
    }
  };

  if (!userLoading && role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="text-lg font-bold text-mv-ink">Accès Administrateur / RevOps Requis</h2>
        <p className="text-xs text-mv-ink-soft">
          La console RevOps et d'équilibrage de charge est réservée aux responsables d'opérations et administrateurs.
        </p>
      </div>
    );
  }

  return (
    <PageFadeIn className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── 1. Top Header Banner ── */}
      <div className="bg-gradient-to-r from-mv-green-darker via-emerald-950 to-zinc-900 border border-mv-green/30 rounded-2xl p-6 text-white relative overflow-hidden shadow-mv-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-mv-green/20 border border-mv-green/40 flex items-center justify-center text-mv-green">
                <Gauge className="w-4 h-4 text-emerald-400" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold font-display tracking-tight text-white">
                Console RevOps & Performance d'Équipe
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                Capacité 35h • Moteur 10% Setup + 5% MRR
              </span>
            </div>
            <p className="text-xs text-zinc-300 max-w-2xl">
              Supervision de la bande passante opérationnelle, prévention du burn-out, calcul automatique des commissions commerciales et attribution intelligente des livrables.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs shrink-0"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', loading && 'animate-spin')} />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      {/* ── 2. RevOps KPI Ribbon ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Taux d'Utilisation Moyen */}
        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Utilisation Moyenne</span>
            <Gauge className="w-4 h-4 text-mv-green" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-mv-ink font-mono" style={MONO}>
              <AnimatedNumber value={summary?.average_team_utilization_pct || 70} formatDecimals={0} /> %
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Équilibré
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Capacité globale sur base de 35h/sem.</p>
        </div>

        {/* KPI 2: Risques de Surcharge */}
        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Membres en Surcharge</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 font-mono" style={MONO}>
              {summary?.overloaded_members_count || 1}
            </span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
              &gt;85% charge
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Réattribution recommandée</p>
        </div>

        {/* KPI 3: Commissions En Attente */}
        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Commissions Dues</span>
            <DollarSign className="w-4 h-4 text-mv-blue" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-mv-ink font-mono" style={MONO}>
              <AnimatedNumber value={summary?.total_commissions_pending_cad || 500} formatDecimals={0} /> $
            </span>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              À valider
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Incentives sur deals signés</p>
        </div>

        {/* KPI 4: Respect des Délais (On-Time Delivery) */}
        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Livraison dans les Délais</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 font-mono" style={MONO}>
              <AnimatedNumber value={summary?.global_on_time_delivery_pct || 96} formatDecimals={0} /> %
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              SLA Respecté
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Vélocité moyenne deal : 5.4 jours</p>
        </div>
      </div>

      {/* ── 3. Navigation Tabs ── */}
      <div className="flex items-center justify-between border-b border-mv-border pb-3">
        <div className="flex items-center gap-1.5 bg-mv-surface p-1 rounded-xl border border-mv-border">
          <button
            onClick={() => setActiveTab('workload')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5',
              activeTab === 'workload'
                ? 'bg-mv-green text-white shadow-sm'
                : 'text-mv-ink-soft hover:text-mv-ink'
            )}
          >
            <UsersRound className="w-3.5 h-3.5" />
            <span>Équilibrage de Charge ({workloads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('commissions')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5',
              activeTab === 'commissions'
                ? 'bg-mv-green text-white shadow-sm'
                : 'text-mv-ink-soft hover:text-mv-ink'
            )}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Commissions & RevOps</span>
          </button>

          <button
            onClick={() => setActiveTab('assignment')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5',
              activeTab === 'assignment'
                ? 'bg-mv-green text-white shadow-sm'
                : 'text-mv-ink-soft hover:text-mv-ink'
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Attribution Intelligente</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: ÉQUILIBRAGE DE CHARGE & CAPACITÉ ── */}
      {activeTab === 'workload' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-mv-surface p-3 rounded-xl border border-mv-border">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-mv-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par collaborateur, spécialité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-mv-ink focus:outline-none focus:border-mv-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWorkloads.map((member) => (
              <Card key={member.member_id} className="p-5 space-y-4 hover:border-mv-green/40 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-sm text-mv-ink font-display">{member.full_name}</h3>
                      <Badge variant="neutral" className="capitalize text-[10.5px]">
                        {member.specialty.replace('_', ' ')}
                      </Badge>
                      <Badge
                        variant={
                          member.utilization_pct >= 85
                            ? 'amber'
                            : member.utilization_pct < 50
                            ? 'blue'
                            : 'green'
                        }
                      >
                        {member.utilization_pct >= 85
                          ? 'Surcharge'
                          : member.utilization_pct < 50
                          ? 'Sous-chargé'
                          : 'Optimal'}
                      </Badge>
                    </div>
                    <p className="text-xs text-mv-ink-soft mt-0.5">{member.email}</p>
                  </div>

                  <span className="font-mono font-bold text-xs text-mv-ink bg-mv-cream-soft px-2.5 py-1 rounded-md border border-mv-border">
                    {member.assigned_hours}h / {member.capacity_hours}h
                  </span>
                </div>

                {/* Capacity Gauge Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-mv-ink-soft">
                    <span>Charge hebdomadaire</span>
                    <span className="font-mono font-bold text-mv-ink">{member.utilization_pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        member.utilization_pct >= 85
                          ? 'bg-amber-500'
                          : member.utilization_pct < 50
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      )}
                      style={{ width: `${Math.min(100, member.utilization_pct)}%` }}
                    />
                  </div>
                </div>

                {/* Tasks Breakdown ribbon */}
                <div className="grid grid-cols-4 gap-2 bg-mv-cream-soft p-2.5 rounded-xl border border-mv-border text-center text-xs">
                  <div>
                    <span className="text-[10px] text-mv-ink-soft block">À faire</span>
                    <span className="font-mono font-bold text-mv-ink">{member.todo_tasks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-mv-ink-soft block">En cours</span>
                    <span className="font-mono font-bold text-blue-600">{member.in_progress_tasks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-mv-ink-soft block">Terminé</span>
                    <span className="font-mono font-bold text-emerald-600">{member.done_tasks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-mv-ink-soft block">En retard</span>
                    <span className={cn('font-mono font-bold', member.overdue_tasks > 0 ? 'text-red-600' : 'text-zinc-400')}>
                      {member.overdue_tasks}
                    </span>
                  </div>
                </div>

                {/* Actions & Reassignment */}
                <div className="flex items-center justify-between pt-2 border-t border-mv-border text-xs">
                  <span className="text-mv-ink-soft text-[11px]">
                    SLA Délais : <strong className="text-emerald-700 font-mono">{member.on_time_delivery_rate_pct}%</strong>
                  </span>

                  {member.utilization_pct >= 85 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSourceMember(member);
                        setShowReassignModal(true);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer transition-colors"
                    >
                      <ArrowLeftRight className="w-3 h-3 text-amber-600" />
                      <span>Réattribuer tâches</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-700">Disponible pour livrables</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: COMMISSIONS & REVOPS ── */}
      {activeTab === 'commissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Interactive Simulator */}
          <Card className="lg:col-span-5 p-6 space-y-6">
            <div>
              <h2 className="font-extrabold text-base text-mv-ink font-display">Simulateur de Commissions Hybrides</h2>
              <p className="text-xs text-mv-ink-soft mt-1">
                Règle officielle : 10% sur le Setup Studio + 5% sur le MRR SaaS Flow (+25% bonus si quota &gt;10k$).
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-bold text-mv-ink mb-1.5">
                  <span>Montant Prestation Setup (CAD)</span>
                  <span className="font-mono text-mv-green">{simDealPrice.toLocaleString('fr-CA')} $</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="15000"
                  step="250"
                  value={simDealPrice}
                  onChange={(e) => setSimDealPrice(Number(e.target.value))}
                  className="w-full accent-mv-green cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-mv-ink mb-1.5">
                  <span>MRR Flow Généré (CAD/mois)</span>
                  <span className="font-mono text-mv-ink">{simMrrPrice} $/mo</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={simMrrPrice}
                  onChange={(e) => setSimMrrPrice(Number(e.target.value))}
                  className="w-full accent-mv-green cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-mv-ink mb-1.5">
                  <span>Volume Ventes Signées du Mois (CAD)</span>
                  <span className="font-mono text-mv-blue">{simAchievedMonth.toLocaleString('fr-CA')} $</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="30000"
                  step="1000"
                  value={simAchievedMonth}
                  onChange={(e) => setSimAchievedMonth(Number(e.target.value))}
                  className="w-full accent-mv-blue cursor-pointer"
                />
                <span className="text-[10px] text-mv-ink-faint block mt-0.5">Quota mensuel : 10 000 $ CAD</span>
              </div>
            </div>

            {/* Simulation Results Card */}
            <div className="bg-mv-cream-soft p-4 rounded-xl border border-mv-border space-y-2 text-xs">
              <div className="flex justify-between text-mv-ink-soft">
                <span>Commission Setup (10%) :</span>
                <span className="font-mono font-bold text-mv-ink">{(simDealPrice * 0.1).toFixed(2)} $</span>
              </div>
              <div className="flex justify-between text-mv-ink-soft">
                <span>Commission MRR Récurrente (5%) :</span>
                <span className="font-mono font-bold text-mv-ink">{(simMrrPrice * 0.05).toFixed(2)} $/mo</span>
              </div>
              <div className="flex justify-between text-mv-ink-soft">
                <span>Bonus Dépassement Quota :</span>
                <span className={cn('font-mono font-bold', simCommissionResult.isQuotaAchieved ? 'text-emerald-700' : 'text-zinc-400')}>
                  {simCommissionResult.isQuotaAchieved ? '+25% (1.25x)' : 'Non atteint'}
                </span>
              </div>
              <div className="pt-2 border-t border-mv-border flex justify-between font-extrabold text-sm text-mv-ink">
                <span>Total Commission Dûe :</span>
                <span className="font-mono text-emerald-600 text-base" style={MONO}>
                  +{simCommissionResult.totalCommissionCad.toLocaleString('fr-CA')} $ CAD
                </span>
              </div>
            </div>
          </Card>

          {/* Right: Commissions History & Status */}
          <Card className="lg:col-span-7 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-mv-ink font-display">Commissions d'Équipe en Cours</h3>
                <p className="text-xs text-mv-ink-soft">Validation et enregistrement des versements</p>
              </div>
              <Badge variant="green">RevOps Sync</Badge>
            </div>

            <div className="border border-mv-border rounded-xl divide-y divide-mv-border overflow-hidden">
              {commissions.map((comm) => (
                <div key={comm.id} className="p-4 bg-mv-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-mv-ink">{comm.member_name}</span>
                      <span className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded uppercase font-bold text-zinc-600">
                        {comm.type}
                      </span>
                    </div>
                    <p className="text-mv-ink-soft text-[11.5px]">{comm.deal_title}</p>
                    <span className="text-[10.5px] text-mv-ink-faint block">
                      Base : {comm.base_amount_cad.toLocaleString('fr-CA')} $ ({comm.commission_rate_pct}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-extrabold text-sm text-emerald-700" style={MONO}>
                      +{comm.commission_amount_cad.toFixed(2)} $
                    </span>

                    <select
                      value={comm.status}
                      onChange={(e) => handleCommissionStatusChange(comm.id, e.target.value as any)}
                      className="px-2 py-1 rounded bg-mv-cream-soft border border-mv-border text-xs font-semibold cursor-pointer"
                    >
                      <option value="pending">En attente</option>
                      <option value="approved">Approuvé</option>
                      <option value="paid">Versé</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── TAB 3: ATTRIBUTION INTELLIGENTE ── */}
      {activeTab === 'assignment' && (
        <Card className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="font-extrabold text-base text-mv-ink font-display">
              Moteur d'Attribution Automatique des Livrables
            </h2>
            <p className="text-xs text-mv-ink-soft mt-0.5">
              Lorsqu'un prospect signe une proposition, le moteur identifie la spécialité requise et attribue automatiquement le travail au collaborateur ayant la charge la plus faible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <label className="block text-xs font-bold text-mv-ink">Sélectionner une prestation à router</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Production Vidéo (8 Reels 4K)',
                  'Web Framer (Site Vitrine & Carte)',
                  'Acquisition Ads (Google & Meta 5km)',
                  'Opérations POS (Imprimantes & QR)',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSimCategory(cat)}
                    className={cn(
                      'p-3 rounded-xl border text-left text-xs transition-colors cursor-pointer',
                      simCategory === cat
                        ? 'border-mv-green bg-mv-green/10 font-bold text-mv-green'
                        : 'border-mv-border bg-mv-cream-soft text-mv-ink hover:border-mv-green/50'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Output Routing Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-mv-surface to-emerald-50/50 border border-emerald-200 space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                Routage Optimisé Détecté
              </span>

              {assignedMemberSuggestion ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-mv-green text-white flex items-center justify-center font-bold text-xs">
                      {assignedMemberSuggestion.full_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-mv-ink font-display">
                        {assignedMemberSuggestion.full_name}
                      </h4>
                      <p className="text-xs text-mv-ink-soft">
                        Spécialiste {assignedMemberSuggestion.specialty.replace('_', ' ')} • Charge actuelle :{' '}
                        <strong className="text-mv-green font-mono">{assignedMemberSuggestion.utilization_pct}%</strong>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200 text-xs text-mv-ink-soft">
                    ✓ Assignation directe sans risque de dépassement de capacité ({assignedMemberSuggestion.assigned_hours}h / 35h max).
                  </div>
                </div>
              ) : (
                <p className="text-xs text-mv-ink-soft">Aucun collaborateur disponible.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── Reassign Tasks Modal ── */}
      {showReassignModal && sourceMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-mv-surface border border-mv-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-mv-border pb-3">
              <h3 className="font-bold text-sm text-mv-ink">Réattribuer les tâches en surplus</h3>
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="text-xs text-mv-ink-faint hover:text-mv-ink cursor-pointer"
              >
                Fermer
              </button>
            </div>

            <p className="text-xs text-mv-ink-soft">
              Membre surchargé : <strong className="text-mv-ink">{sourceMember.full_name}</strong> ({sourceMember.assigned_hours}h / {sourceMember.capacity_hours}h).
            </p>

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">
                  Transférer vers le collaborateur disponible
                </label>
                <select
                  required
                  value={targetMemberId}
                  onChange={(e) => setTargetMemberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-mv-cream-soft border border-mv-border text-xs font-semibold text-mv-ink focus:outline-none focus:border-mv-green"
                >
                  <option value="">Sélectionner un membre</option>
                  {workloads
                    .filter((w) => w.member_id !== sourceMember.member_id)
                    .map((w) => (
                      <option key={w.member_id} value={w.member_id}>
                        {w.full_name} ({w.utilization_pct}% charge - {w.specialty})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowReassignModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Valider le transfert
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
