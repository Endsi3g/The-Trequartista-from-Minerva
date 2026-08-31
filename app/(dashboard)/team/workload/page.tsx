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
} from '@/lib/services/supabase-data';
import { getIsoWeekStart } from '@/lib/utils/dates';
import type { TeamMemberWorkload, TeamCommission, RevOpsSummary, Task, StandupResponse, WeeklyCheckinResponse, AvailabilityPoll, AvailabilityVote } from '@/lib/types';
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

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [wlData, commData, tasksData, standupData, checkinData, poll] = await Promise.all([
        fetchTeamWorkloads(),
        fetchTeamCommissions(),
        fetchTasks(),
        fetchStandupResponsesForDate(today),
        fetchWeeklyCheckinsForWeek(getIsoWeekStart(new Date())),
        fetchLatestAvailabilityPoll(),
      ]);
      setWorkloads(wlData);
      setCommissions(commData);
      setAllTasks(tasksData);
      setSummary(computeRevOpsSummary(wlData, commData));
      setStandups(standupData);
      setCheckins(checkinData);
      setLatestPoll(poll);
      setLatestPollVotes(poll ? await fetchAvailabilityVotes(poll.id) : []);
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
    <PageFadeIn className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-mv-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mv-green text-white flex items-center justify-center shadow-mv-sm">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold font-display tracking-tight text-mv-ink">
                  Charge de Travail & Capacité
                </h1>
                <Badge variant="green" className="text-xs font-semibold">
                  {workloads.length} Collaborateurs
                </Badge>
              </div>
              <p className="text-xs text-mv-ink-soft">
                Répartition opérationnelle en temps réel des tâches, livrables et capacité de l’équipe Minerva.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="text-xs bg-mv-surface border-mv-border text-mv-ink cursor-pointer gap-1.5"
          >
            <RefreshCw size={13} />
            <span>Actualiser</span>
          </Button>

          <Button
            asChild
            size="sm"
            className="bg-mv-green hover:bg-mv-green/90 text-white text-xs cursor-pointer gap-1.5"
          >
            <Link href="/tasks">
              <CheckSquare size={13} />
              <span>Gérer les Tâches</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Key Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>Taux d’Occupation Global</span>
            <Gauge size={16} className="text-mv-green" />
          </div>
          <div className="text-2xl font-bold text-mv-ink" style={MONO}>
            <AnimatedNumber value={summary?.average_team_utilization_pct || 0} />%
          </div>
          <p className="text-[11px] text-mv-ink-soft">Capacité hebdomadaire moyenne</p>
        </Card>

        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>Membres en Surcharge</span>
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-mv-ink" style={MONO}>
            <AnimatedNumber value={summary?.overloaded_members_count || 0} />
          </div>
          <p className="text-[11px] text-mv-ink-soft">Taux d’occupation ≥ 85%</p>
        </Card>

        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>Tâches Totales Actives</span>
            <CheckSquare size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-mv-ink" style={MONO}>
            <AnimatedNumber value={allTasks.filter((t) => t.status !== 'done').length} />
          </div>
          <p className="text-[11px] text-mv-ink-soft">À faire ou en cours</p>
        </Card>

        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>Respect des Échéances</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-mv-ink" style={MONO}>
            <AnimatedNumber value={summary?.global_on_time_delivery_pct || 100} />%
          </div>
          <p className="text-[11px] text-mv-ink-soft">Livraisons dans les temps</p>
        </Card>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mv-border pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mv-ink-faint" />
          <input
            type="text"
            placeholder="Rechercher un coéquipier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-mv-surface border border-mv-border text-mv-ink-soft focus:outline-none cursor-pointer"
          >
            <option value="all">Toutes les charges</option>
            <option value="overloaded">En Surcharge (≥85%)</option>
            <option value="optimal">Charge Optimale (60-84%)</option>
            <option value="available">Capacité Disponible (&lt;60%)</option>
          </select>
        </div>
      </div>

      {/* ── Team Members Workload Cards Grid ── */}
      {filteredWorkloads.length === 0 ? (
        <Card className="p-12 text-center bg-mv-surface border-mv-border rounded-xl space-y-3">
          <UsersRound className="w-8 h-8 text-mv-ink-faint mx-auto" />
          <h3 className="text-sm font-bold text-mv-ink">Aucun collaborateur trouvé</h3>
          <p className="text-xs text-mv-ink-soft max-w-sm mx-auto">
            Aucun membre ne correspond à vos filtres de recherche. Invitez des coéquipiers ou réinitialisez le filtre.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkloads.map((member) => {
            const isOverloaded = member.utilization_pct >= 85;
            const isOptimal = member.utilization_pct >= 60 && member.utilization_pct < 85;

            return (
              <Card
                key={member.member_id}
                className="p-5 bg-mv-surface border-mv-border rounded-xl shadow-xs space-y-4 hover:border-mv-green/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top member header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-mv-ink">{member.full_name}</h3>
                      <p className="text-[11px] text-mv-ink-faint truncate">{member.email || '—'}</p>
                    </div>

                    <Badge
                      variant={isOverloaded ? 'red' : isOptimal ? 'green' : 'blue'}
                      className="text-[10px] shrink-0 font-semibold"
                    >
                      {member.utilization_pct}% Charge
                    </Badge>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-mv-ink-soft" style={MONO}>
                      <span>{member.assigned_hours}h / {member.capacity_hours}h max</span>
                      <span>{member.total_tasks} tâche{member.total_tasks > 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-2 w-full bg-black/[0.06] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          isOverloaded ? 'bg-red-500' : isOptimal ? 'bg-mv-green' : 'bg-blue-500'
                        )}
                        style={{ width: `${member.utilization_pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Task details stats */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-mv-cream-soft border border-mv-border text-center text-xs">
                    <div>
                      <span className="block text-[10px] text-mv-ink-faint uppercase font-bold">À faire</span>
                      <strong className="text-mv-ink" style={MONO}>{member.todo_tasks}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-blue-600 uppercase font-bold">En cours</span>
                      <strong className="text-blue-700" style={MONO}>{member.in_progress_tasks}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-red-600 uppercase font-bold">Retard</span>
                      <strong className={cn(member.overdue_tasks > 0 ? 'text-red-600 font-bold' : 'text-mv-ink-faint')} style={MONO}>
                        {member.overdue_tasks}
                      </strong>
                    </div>
                  </div>

                  {/* Active tasks preview */}
                  <div className="space-y-1.5">
                    <span className="text-[10.5px] font-bold text-mv-ink-faint uppercase tracking-wider block">
                      Tâches Récentes
                    </span>
                    {member.active_deliverables.length === 0 ? (
                      <p className="text-[11px] text-mv-ink-faint italic">Aucune tâche assignée en cours.</p>
                    ) : (
                      <div className="space-y-1">
                        {member.active_deliverables.map((d) => (
                          <div
                            key={d.id}
                            className="p-2 rounded border border-mv-border bg-white text-xs flex items-center justify-between gap-2"
                          >
                            <span className="truncate text-mv-ink font-medium">{d.title}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const found = allTasks.find((t) => t.id === d.id);
                                if (found) {
                                  setSelectedTask(found);
                                  setShowReassignModal(true);
                                }
                              }}
                              className="text-[10.5px] text-mv-green hover:underline shrink-0 font-semibold cursor-pointer"
                            >
                              Réassigner
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
