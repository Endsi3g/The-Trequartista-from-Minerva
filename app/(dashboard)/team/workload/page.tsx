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
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Zap,
  ArrowLeftRight,
  ShieldAlert,
  CheckSquare,
  Filter,
  Sparkles,
  CalendarClock,
  Ghost,
} from 'lucide-react';
import {
  fetchTeamWorkloads,
  fetchTeamCommissions,
  computeRevOpsSummary,
  reassignTaskAssignee,
} from '@/lib/services/revops-team';
import {
  fetchTasks,
  fetchStandupResponsesForDate,
  fetchWeeklyCheckinsForWeek,
  fetchLatestAvailabilityPoll,
  fetchAvailabilityVotes,
  fetchCoachWeeklyReports,
  fetchCoachGhostStatuses,
} from '@/lib/services/supabase-data';
import { getIsoWeekStart } from '@/lib/utils/dates';
import type { TeamMemberWorkload, TeamCommission, RevOpsSummary, Task, StandupResponse, WeeklyCheckinResponse, AvailabilityPoll, AvailabilityVote, CoachWeeklyReport, CoachGhostStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function TeamWorkloadPage() {
  const { role, workspace, loading: userLoading } = useCurrentUser();
  const isAdmin = role === 'admin';
  const { toastSuccess, toastError, toastInfo } = useToast();

  const [workloads, setWorkloads] = useState<TeamMemberWorkload[]>([]);
  const [commissions, setCommissions] = useState<TeamCommission[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<RevOpsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Reassignment Modal State
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [targetMemberId, setTargetMemberId] = useState<string>('');
  const [reassigning, setReassigning] = useState(false);

  // Coach Minerva admin review
  const [standups, setStandups] = useState<(StandupResponse & { member_name: string })[]>([]);
  const [checkins, setCheckins] = useState<(WeeklyCheckinResponse & { member_name: string })[]>([]);
  const [latestPoll, setLatestPoll] = useState<AvailabilityPoll | null>(null);
  const [latestPollVotes, setLatestPollVotes] = useState<(AvailabilityVote & { member_name: string })[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<CoachWeeklyReport[]>([]);
  const [ghostStatuses, setGhostStatuses] = useState<CoachGhostStatus[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [wlData, commData, tasksData, standupData, checkinData, poll, weeklyReportData, ghostData] = await Promise.all([
        fetchTeamWorkloads().catch(() => []),
        fetchTeamCommissions().catch(() => []),
        fetchTasks().catch(() => []),
        fetchStandupResponsesForDate(today).catch(() => []),
        fetchWeeklyCheckinsForWeek(getIsoWeekStart(new Date())).catch(() => []),
        fetchLatestAvailabilityPoll().catch(() => null),
        fetchCoachWeeklyReports(getIsoWeekStart(new Date())).catch(() => []),
        fetchCoachGhostStatuses().catch(() => []),
      ]);
      setWorkloads(Array.isArray(wlData) ? wlData : []);
      setCommissions(Array.isArray(commData) ? commData : []);
      setAllTasks(Array.isArray(tasksData) ? tasksData : []);
      setSummary(computeRevOpsSummary(Array.isArray(wlData) ? wlData : [], Array.isArray(commData) ? commData : []));
      setStandups(Array.isArray(standupData) ? standupData : []);
      setCheckins(Array.isArray(checkinData) ? checkinData : []);
      setLatestPoll(poll);
      setLatestPollVotes(poll ? await fetchAvailabilityVotes(poll.id).catch(() => []) : []);
      setWeeklyReports(Array.isArray(weeklyReportData) ? weeklyReportData : []);
      setGhostStatuses(Array.isArray(ghostData) ? ghostData : []);
    } catch {
      toastError('Erreur de chargement', 'Impossible de récupérer la charge de travail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredWorkloads = useMemo(() => {
    return workloads.filter((w) => {
      const matchSearch =
        w.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'overloaded' && w.utilization_pct >= 85) ||
        (statusFilter === 'available' && w.utilization_pct < 60) ||
        (statusFilter === 'optimal' && w.utilization_pct >= 60 && w.utilization_pct < 85);

      return matchSearch && matchStatus;
    });
  }, [workloads, searchQuery, statusFilter]);

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !targetMemberId) return;

    setReassigning(true);
    try {
      const ok = await reassignTaskAssignee(selectedTask.id, targetMemberId);
      if (ok) {
        toastSuccess('Tâche réassignée avec succès');
        setShowReassignModal(false);
        setSelectedTask(null);
        setTargetMemberId('');
        await loadData();
      } else {
        toastError('Erreur lors de la réassignation');
      }
    } catch {
      toastError('Erreur de communication');
    } finally {
      setReassigning(false);
    }
  };

  if (!userLoading && !(isAdmin || workspace === 'managing')) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé aux administrateurs et à l&apos;espace Managing.</p>
        <Link href="/overview" className="text-xs text-mv-green hover:underline">Retour à l&apos;aperçu</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <PageFadeIn className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-black/[0.06] rounded animate-pulse" />
          <div className="h-4 w-96 bg-black/[0.04] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-mv-surface border border-mv-border rounded-xl animate-pulse" />
          ))}
        </div>
      </PageFadeIn>
    );
  }

  return (
    <PageFadeIn className="space-y-3 max-w-7xl mx-auto pb-16">
      {/* ── 1. Linear-Style Toolbar Strip (h-10 / 40px) ── */}
      <div className="h-10 bg-white border border-zinc-200 rounded-lg px-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono" style={MONO}>
            <span>Minerva</span>
            <span>/</span>
            <span className="text-zinc-600 font-medium">Équipe</span>
          </div>
          <span className="text-zinc-200">|</span>
          <h1 className="text-xs sm:text-sm font-semibold text-zinc-900 tracking-tight truncate">
            Charge de Travail & Capacité
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded font-mono" style={MONO}>
            {workloads.length} Collaborateurs
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={loadData}
            className="h-7 px-2 text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
            title="Actualiser les charges d'équipe"
          >
            <RefreshCw size={12} className={cn(loading && 'animate-spin')} />
            <span className="hidden md:inline">Actualiser</span>
          </button>

          <Link
            href="/tasks"
            className="h-7 px-2.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 transition-colors shadow-2xs"
            title="Ouvrir la gestion des tâches"
          >
            <CheckSquare size={13} />
            <span>Gérer les Tâches</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Monolithic KPI Ribbon (divide-x) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-x divide-zinc-100 shadow-2xs overflow-hidden">
        {/* Metric 1 */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>Taux d’Occupation</span>
            <Gauge size={13} className="text-zinc-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
              <AnimatedNumber value={summary?.average_team_utilization_pct || 0} /> %
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono mt-0.5" style={MONO}>
            Moyenne hebdomadaire
          </span>
        </div>

        {/* Metric 2 */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>En Surcharge (≥85%)</span>
            <AlertTriangle size={13} className="text-amber-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={cn('text-lg font-bold font-mono tabular-nums', (summary?.overloaded_members_count || 0) > 0 ? 'text-amber-700' : 'text-zinc-900')} style={MONO}>
              <AnimatedNumber value={summary?.overloaded_members_count || 0} />
            </span>
            <span className="text-[10.5px] text-zinc-400 font-mono">collaborateurs</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono mt-0.5" style={MONO}>
            {(summary?.overloaded_members_count || 0) > 0 ? 'Rééquilibrage conseillé' : 'Charge équilibrée'}
          </span>
        </div>

        {/* Metric 3 */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>Tâches Actives</span>
            <CheckSquare size={13} className="text-blue-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
              <AnimatedNumber value={allTasks.filter((t) => t.status !== 'done').length} />
            </span>
            <span className="text-[10.5px] text-zinc-400 font-mono">en cours</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono mt-0.5" style={MONO}>
            Flux opérationnel
          </span>
        </div>

        {/* Metric 4 */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>Respect Échéances</span>
            <ShieldCheck size={13} className="text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono tabular-nums text-emerald-700" style={MONO}>
              <AnimatedNumber value={summary?.global_on_time_delivery_pct || 100} /> %
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-mono mt-0.5" style={MONO}>
            Livraisons à temps
          </span>
        </div>
      </div>

      {/* ── 3. Search & Filter Bar (h-8) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher un coéquipier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 sm:w-64 h-7 pl-7 pr-2 text-xs rounded-md bg-white border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-7 px-2 text-xs rounded-md bg-white border border-zinc-200 text-zinc-700 focus:outline-none focus:border-emerald-600 cursor-pointer font-mono"
          style={MONO}
        >
          <option value="all">Toutes les charges</option>
          <option value="overloaded">En Surcharge (≥85%)</option>
          <option value="optimal">Charge Optimale (60-84%)</option>
          <option value="available">Capacité Disponible (&lt;60%)</option>
        </select>
      </div>

      {/* ── 4. Staffing Heatmap DataTable (42px per row) ── */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                <th className="py-2 px-3 font-semibold min-w-[200px]">COLLABORATEUR</th>
                <th className="py-2 px-3 font-semibold w-28">CHARGE HEBDO</th>
                <th className="py-2 px-3 font-semibold w-48">JAUGE D’UTILISATION</th>
                <th className="py-2 px-3 font-semibold w-44">RÉPARTITION</th>
                <th className="py-2 px-3 font-semibold">TÂCHES ASSIGNÉES</th>
                <th className="py-2 px-3 font-semibold w-24 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredWorkloads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-zinc-400">
                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <UsersRound className="w-6 h-6 text-zinc-300 mx-auto" />
                      <p className="font-medium text-zinc-600">Aucun collaborateur trouvé</p>
                      <p className="text-[11px] text-zinc-400">
                        Aucun membre ne correspond à vos filtres de recherche.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWorkloads.map((member) => {
                  const isOverloaded = member.utilization_pct >= 85;
                  const isOptimal = member.utilization_pct >= 60 && member.utilization_pct < 85;
                  const displayName = (member.full_name || 'Membre').toUpperCase();
                  const initials = displayName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr
                      key={member.member_id}
                      className="h-11 hover:bg-zinc-50/80 transition-colors group select-none"
                    >
                      {/* Member profile */}
                      <td className="py-2 px-3 min-w-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-900 truncate leading-tight tracking-wide">
                              {displayName}
                            </p>
                            <p className="text-[10px] text-zinc-400 truncate leading-tight font-mono" style={MONO}>
                              {member.email || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Charge hebdo */}
                      <td className="py-2 px-3 font-mono text-[11.5px] text-zinc-700 whitespace-nowrap" style={MONO}>
                        <span className="font-bold text-zinc-900">{member.assigned_hours}h</span>
                        <span className="text-zinc-400"> / {member.capacity_hours}h</span>
                      </td>

                      {/* Utilization gauge */}
                      <td className="py-2 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10.5px] font-mono" style={MONO}>
                            <span className={cn('font-bold', isOverloaded ? 'text-rose-600' : isOptimal ? 'text-emerald-700' : 'text-blue-600')}>
                              {member.utilization_pct} %
                            </span>
                            <span className="text-zinc-400 text-[10px]">
                              {isOverloaded ? 'Surcharge' : isOptimal ? 'Optimal' : 'Disponible'}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-300',
                                isOverloaded ? 'bg-rose-500' : isOptimal ? 'bg-emerald-500' : 'bg-blue-500'
                              )}
                              style={{ width: `${Math.min(100, member.utilization_pct)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Task status breakdown */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[10.5px] font-mono" style={MONO}>
                          <span className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700 border border-zinc-200/60" title="À faire">
                            {member.todo_tasks} td
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200/60" title="En cours">
                            {member.in_progress_tasks} act
                          </span>
                          {member.overdue_tasks > 0 ? (
                            <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200/60" title="En retard">
                              {member.overdue_tasks} ret
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60" title="Zéro retard">
                              0 ret
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assigned Tasks Tags */}
                      <td className="py-2 px-3 min-w-0">
                        {member.active_deliverables.length === 0 ? (
                          <span className="text-[11px] text-zinc-400 italic">Aucune tâche assignée</span>
                        ) : (
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            {member.active_deliverables.slice(0, 2).map((d) => (
                              <span
                                key={d.id}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200/80 text-[10.5px] text-zinc-700 truncate max-w-[160px]"
                                title={d.title}
                              >
                                <span className="truncate">{d.title}</span>
                              </span>
                            ))}
                            {member.active_deliverables.length > 2 && (
                              <span className="text-[10px] font-mono text-zinc-400">
                                +{member.active_deliverables.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            const firstTask = member.active_deliverables[0];
                            if (firstTask) {
                              const found = allTasks.find((t) => t.id === firstTask.id);
                              setSelectedTask(found || ({ id: firstTask.id, title: firstTask.title, status: (firstTask.status as Task['status']) || 'todo' } as Task));
                            } else {
                              setSelectedTask(allTasks[0] || null);
                            }
                            setShowReassignModal(true);
                          }}
                          className="h-6 px-2 text-[10.5px] font-mono font-medium rounded border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-2xs"
                        >
                          Réassigner
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Coach Minerva — revue admin ── */}
      {isAdmin && (
        <div className="space-y-4 border-t border-mv-border pt-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-mv-ink">Coach Minerva</h2>
              <p className="text-[11px] text-mv-ink-soft">Points quotidiens/hebdo et sondage de disponibilité, générés par le bot IA d'équipe.</p>
            </div>
          </div>

          {ghostStatuses.length > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <Ghost className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-amber-800">
                  {ghostStatuses.length} membre{ghostStatuses.length > 1 ? 's' : ''} silencieux détecté{ghostStatuses.length > 1 ? 's' : ''}
                </p>
                <p className="text-amber-700 text-[11px] mt-0.5">
                  {ghostStatuses.map((g) => g.member_name).join(', ')} -- relancé{ghostStatuses.length > 1 ? 's' : ''} automatiquement par Coach Minerva.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4 bg-mv-surface border-mv-border rounded-xl space-y-2.5">
              <span className="text-[10.5px] font-bold text-mv-ink-faint uppercase tracking-wider">
                Point du jour ({standups.length}/{workloads.length || 0})
              </span>
              {standups.length === 0 ? (
                <p className="text-[11px] text-mv-ink-faint italic">Aucune réponse pour aujourd'hui.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {standups.map((s) => (
                    <div key={s.id} className="p-2.5 rounded-lg border border-mv-border bg-white text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-mv-ink">{s.member_name}</span>
                        <span className="text-[10px] text-mv-ink-faint" style={MONO}>{s.task_snapshot.length} tâche(s)</span>
                      </div>
                      {s.open_answer ? (
                        <p className="text-mv-ink-soft italic">« {s.open_answer} »</p>
                      ) : (
                        <p className="text-mv-ink-faint text-[10.5px]">Pas encore répondu à la question ouverte.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4 bg-mv-surface border-mv-border rounded-xl space-y-2.5">
              <span className="text-[10.5px] font-bold text-mv-ink-faint uppercase tracking-wider">
                Point hebdo ({checkins.length}/{workloads.length || 0})
              </span>
              {checkins.length === 0 ? (
                <p className="text-[11px] text-mv-ink-faint italic">Aucune réponse cette semaine.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {checkins.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg border border-mv-border bg-white text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-mv-ink">{c.member_name}</span>
                        <span className="text-[10px] text-mv-ink-faint" style={MONO}>{c.task_snapshot.length} tâche(s)</span>
                      </div>
                      {c.open_answer ? (
                        <p className="text-mv-ink-soft italic">« {c.open_answer} »</p>
                      ) : (
                        <p className="text-mv-ink-faint text-[10.5px]">Pas encore répondu à la question ouverte.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {latestPoll && (
            <Card className="p-4 bg-mv-surface border-mv-border rounded-xl space-y-2.5">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-3.5 h-3.5 text-mv-green" />
                <span className="text-[10.5px] font-bold text-mv-ink-faint uppercase tracking-wider">{latestPoll.question}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {latestPoll.proposed_slots.map((slot, idx) => {
                  const votes = latestPollVotes.filter((v) => v.slot_index === idx);
                  return (
                    <div key={idx} className="p-2.5 rounded-lg border border-mv-border bg-white text-xs space-y-1">
                      <p className="font-semibold text-mv-ink">{slot.label}</p>
                      <p className="text-[10px] text-mv-ink-faint" style={MONO}>{votes.length} vote{votes.length > 1 ? 's' : ''}</p>
                      {votes.length > 0 && (
                        <p className="text-[10.5px] text-mv-ink-soft truncate">{votes.map((v) => v.member_name).join(', ')}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {weeklyReports.length > 0 && (
            <Card className="p-4 bg-mv-surface border-mv-border rounded-xl space-y-2.5">
              <span className="text-[10.5px] font-bold text-mv-ink-faint uppercase tracking-wider">
                Rapport hebdomadaire (taux de réponse & tendance)
              </span>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {weeklyReports.map((r) => (
                  <div key={r.id} className="p-2.5 rounded-lg border border-mv-border bg-white text-xs space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-mv-ink flex items-center gap-1.5">
                        {r.member_name}
                        {r.is_ghosting && <Ghost className="w-3 h-3 text-amber-600" />}
                      </span>
                      <Badge variant={r.response_rate_pct >= 70 ? 'green' : r.response_rate_pct >= 40 ? 'amber' : 'red'} className="text-[10px]">
                        {r.response_rate_pct}% ({r.standups_answered}/{r.standups_total})
                      </Badge>
                    </div>
                    {r.trend_summary && <p className="text-mv-ink-soft text-[11px]">{r.trend_summary}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Reassign Task Modal ── */}
      {showReassignModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-mv-surface border-mv-border rounded-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-mv-border pb-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-mv-green" />
                <h3 className="text-sm font-bold text-mv-ink">Réassigner la tâche</h3>
              </div>
              <button
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedTask(null);
                }}
                className="text-mv-ink-faint hover:text-mv-ink text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div className="p-3 rounded-lg bg-mv-cream-soft border border-mv-border space-y-1">
                <span className="text-[10.5px] font-bold text-mv-ink-faint uppercase block">Tâche sélectionnée</span>
                <p className="text-xs font-semibold text-mv-ink">{selectedTask.title}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">
                  Nouveau collaborateur assigné
                </label>
                <select
                  required
                  value={targetMemberId}
                  onChange={(e) => setTargetMemberId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-mv-surface border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
                >
                  <option value="">Sélectionner un coéquipier...</option>
                  {workloads.map((w) => (
                    <option key={w.member_id} value={w.member_id}>
                      {w.full_name} ({w.utilization_pct}% charge — {w.assigned_hours}h)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-mv-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReassignModal(false);
                    setSelectedTask(null);
                  }}
                  className="text-xs cursor-pointer text-mv-ink-soft"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={reassigning || !targetMemberId}
                  className="bg-mv-green hover:bg-mv-green/90 text-white text-xs gap-1.5 cursor-pointer"
                >
                  <ArrowLeftRight size={13} />
                  <span>{reassigning ? 'Réassignation...' : 'Confirmer la réassignation'}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </PageFadeIn>
  );
}
