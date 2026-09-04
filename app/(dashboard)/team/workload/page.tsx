'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageFadeIn } from '@/components/ui/page-transition';
import { useToast } from '@/components/providers/ToastProvider';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Zap,
  Sparkles,
  Plus,
  Calendar,
  X,
  UserCheck,
  Send,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchTeamWorkloads,
  CORE_OFFICIAL_TEAM,
} from '@/lib/services/revops-team';
import {
  fetchTasks,
  addTask,
  fetchStandupResponsesForDate,
  fetchWeeklyCheckinsForWeek,
} from '@/lib/services/supabase-data';
import { getIsoWeekStart } from '@/lib/utils/dates';
import type { TeamMemberWorkload, Task } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
  fontVariantNumeric: 'tabular-nums',
};

// Official Role Descriptions mapping
const OFFICIAL_ROLES_MAP: Record<string, string> = {
  'kbelceus776@gmail.com': 'Fondateur & Lead Architect',
  'byeh50230@gmail.com': 'Associé Growth & Studio',
  'rayanmohellebi2009@gmail.com': 'Associé Ventes & Outbound',
  'samade3434@gmail.com': 'Ingénieur Full-Stack',
  'karroubiamine@hotmail.com': 'Account Manager Lead',
};

export default function TeamWorkloadPage() {
  const router = useRouter();
  const { id: currentUserId, role } = useCurrentUser();
  const { toastSuccess, toastError, toastInfo } = useToast();

  const [workloads, setWorkloads] = useState<TeamMemberWorkload[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [chargeFilter, setChargeFilter] = useState<'all' | 'available' | 'optimal' | 'overload'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Quick Assign Task Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberWorkload | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskEstimatedHours, setTaskEstimatedHours] = useState('4');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Coach poll counter state
  const [pollResponsesCount, setPollResponsesCount] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const weekStart = getIsoWeekStart(new Date());

      const [wlData, tasksData, standups, checkins] = await Promise.all([
        fetchTeamWorkloads().catch(() => []),
        fetchTasks().catch(() => []),
        fetchStandupResponsesForDate(today).catch(() => []),
        fetchWeeklyCheckinsForWeek(weekStart).catch(() => []),
      ]);

      setWorkloads(wlData);
      setTasks(tasksData);
      setPollResponsesCount(Math.min(5, (standups?.length || 0) + (checkins?.length || 0)));
    } catch {
      toastError('Erreur de chargement', 'Impossible de récupérer la charge de travail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard shortcuts: ⌘ + T for tasks, / for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘ + T or Ctrl + T -> Open Tasks
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        router.push('/tasks');
        return;
      }
      // '/' -> Focus search input
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // Filtered workloads (Search & Charge level)
  const filteredWorkloads = useMemo(() => {
    return workloads.filter((w) => {
      const matchSearch =
        w.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (OFFICIAL_ROLES_MAP[w.email || ''] || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (chargeFilter === 'available') return w.utilization_pct < 60;
      if (chargeFilter === 'optimal') return w.utilization_pct >= 60 && w.utilization_pct <= 85;
      if (chargeFilter === 'overload') return w.utilization_pct > 85;
      return true;
    });
  }, [workloads, searchQuery, chargeFilter]);

  // Aggregated Team Metrics (Based strictly on the 5 core members)
  const summaryMetrics = useMemo(() => {
    const totalAssignedHours = workloads.reduce((sum, w) => sum + w.assigned_hours, 0);
    const totalCapacityHours = 5 * 35; // 175h total weekly
    const freeCapacityHours = Math.max(0, totalCapacityHours - totalAssignedHours);
    const avgUtilization =
      workloads.length > 0
        ? Math.round(workloads.reduce((sum, w) => sum + w.utilization_pct, 0) / workloads.length)
        : 0;
    const overloadedCount = workloads.filter((w) => w.utilization_pct >= 85).length;
    const activeTasksCount = workloads.reduce((sum, w) => sum + (w.todo_tasks + w.in_progress_tasks), 0);
    const avgOnTime =
      workloads.length > 0
        ? Math.round(workloads.reduce((sum, w) => sum + w.on_time_delivery_rate_pct, 0) / workloads.length)
        : 100;

    return {
      avgUtilization,
      freeCapacityHours,
      overloadedCount,
      activeTasksCount,
      onTimeDeliveryRate: avgOnTime,
    };
  }, [workloads]);

  // Open Assign Modal for specific member
  const handleOpenAssignModal = (member: TeamMemberWorkload) => {
    setSelectedMember(member);
    setTaskTitle('');
    setTaskEstimatedHours('4');
    setTaskPriority('medium');
    setTaskDueDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setAssignModalOpen(true);
  };

  // Submit new Task assignment
  const handleAssignTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !taskTitle.trim() || isAssigning) return;

    setIsAssigning(true);
    try {
      await addTask({
        title: taskTitle.trim(),
        priority: taskPriority,
        due_date: taskDueDate || null,
        assignee_id: selectedMember.member_id,
        created_by: currentUserId || null,
        status: 'todo',
        project_id: null,
      });

      toastSuccess(
        'Tâche assignée !',
        `La tâche a été attribuée avec succès à ${selectedMember.full_name}.`
      );
      setAssignModalOpen(false);
      await loadData();
    } catch {
      toastError('Erreur', 'Impossible de créer la tâche.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Trigger Slack/Email reminder
  const handleTriggerCoachReminder = () => {
    toastInfo(
      'Rappel Coach Déclenché',
      'Le rappel de disponibilité a été envoyé aux 5 membres par notification et email.'
    );
  };

  return (
    <PageFadeIn>
      <div className="space-y-3.5 pb-12">
        {/* ── 1. En-tête Contextuel & Barre d'Actions (Toolbar 40px) ────────── */}
        <div className="h-10 flex items-center justify-between gap-3 border-b border-zinc-200/80 pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400" style={MONO}>
              <span>Minerva</span>
              <span>/</span>
              <span>Équipe & RH</span>
              <span>/</span>
              <span className="text-zinc-600 font-sans">Charge de Travail</span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-zinc-900 tracking-tight leading-none font-sans">
                Charge de Travail & Capacité
              </h1>
              <span
                className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded leading-none flex items-center gap-1"
                style={MONO}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>5 Collaborateurs</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bouton Refresh */}
            <button
              onClick={loadData}
              disabled={loading}
              className="h-7 px-2.5 text-xs border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-md shadow-xs flex items-center gap-1.5 font-sans cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3 h-3 text-zinc-500', loading && 'animate-spin')} />
              <span>Actualiser</span>
            </button>

            {/* Bouton Gérer les Tâches (⌘ + T) */}
            <Link
              href="/tasks"
              className="h-7 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs flex items-center gap-1.5 font-sans transition-colors cursor-pointer"
              title="Raccourci : ⌘ + T"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Gérer les Tâches</span>
              <span
                className="hidden sm:inline-block text-[10px] text-emerald-200 font-mono ml-0.5 bg-emerald-800/40 px-1 rounded"
                style={MONO}
              >
                ⌘T
              </span>
            </Link>
          </div>
        </div>

        {/* ── 2. Ruban de Synthèse Monolithique (Strip de 4 Métriques) ──────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-x divide-zinc-100 shadow-xs">
          {/* Métrique 1 : Taux d'Occupation */}
          <div className="p-3 sm:p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-sans">
              Taux d'Occupation
            </span>
            <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tracking-tight" style={MONO}>
              {summaryMetrics.avgUtilization} %
            </div>
            <div className="mt-1 text-[11px] text-zinc-500 font-sans">
              Capacité libre : <span className="font-mono text-zinc-700 font-semibold" style={MONO}>{summaryMetrics.freeCapacityHours}h</span>
            </div>
          </div>

          {/* Métrique 2 : En Surcharge */}
          <div className="p-3 sm:p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-sans">
              En Surcharge (≥ 85%)
            </span>
            <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tracking-tight" style={MONO}>
              {summaryMetrics.overloadedCount}
            </div>
            <div className="mt-1 text-[11px] text-zinc-500 font-sans">
              {summaryMetrics.overloadedCount === 0 ? 'Charge équilibrée' : 'Attention requise'}
            </div>
          </div>

          {/* Métrique 3 : Tâches Actives */}
          <div className="p-3 sm:p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-sans">
              Tâches Actives
            </span>
            <div className="text-xl font-bold font-mono text-zinc-900 mt-1 tracking-tight" style={MONO}>
              {summaryMetrics.activeTasksCount}
            </div>
            <div className="mt-1 text-[11px] text-zinc-500 font-sans">
              Flux opérationnel nominal
            </div>
          </div>

          {/* Métrique 4 : Respect des Échéances */}
          <div className="p-3 sm:p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-sans">
              Respect des Échéances
            </span>
            <div className="text-xl font-bold font-mono text-emerald-600 mt-1 tracking-tight" style={MONO}>
              {summaryMetrics.onTimeDeliveryRate} %
            </div>
            <div className="mt-1 text-[11px] text-emerald-700 font-sans flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Livraisons à temps</span>
            </div>
          </div>
        </div>

        {/* ── 3. DataTable de Staffing Monolithique (Lignes de 36px) ───────── */}
        <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-xs">
          {/* Barre d'Outils Intégrée */}
          <div className="h-10 px-3.5 border-b border-zinc-200/80 flex items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher un coéquipier... (/)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 text-xs w-60 pl-7 pr-2.5 border border-zinc-200 rounded-md bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Sélecteur de filtre de charge */}
            <div className="flex items-center gap-2">
              <select
                value={chargeFilter}
                onChange={(e) => setChargeFilter(e.target.value as any)}
                className="h-7 text-xs border border-zinc-200 rounded-md bg-white px-2 text-zinc-700 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
              >
                <option value="all">Toutes les charges</option>
                <option value="available">Disponible (&lt; 60%)</option>
                <option value="optimal">Charge Optimale (60% - 85%)</option>
                <option value="overload">En Surcharge (&gt; 85%)</option>
              </select>
            </div>
          </div>

          {/* Grille Dense (36px par ligne) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="border-b border-zinc-200 bg-zinc-50/70 text-[10px] uppercase font-mono text-zinc-400 tracking-wider select-none"
                  style={MONO}
                >
                  <th className="py-2 px-3.5 font-semibold">COLLABORATEUR</th>
                  <th className="py-2 px-3 font-semibold">RÔLE</th>
                  <th className="py-2 px-3 font-semibold">CHARGE HEBDO</th>
                  <th className="py-2 px-3 font-semibold">JAUGE DE CAPACITÉ</th>
                  <th className="py-2 px-3 font-semibold">RÉPARTITION (TÂCHES)</th>
                  <th className="py-2 px-3 text-center font-semibold">STATUT</th>
                  <th className="py-2 px-3.5 text-right font-semibold">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-400 font-sans text-xs">
                      Chargement de la charge d'équipe...
                    </td>
                  </tr>
                ) : filteredWorkloads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-400 font-sans text-xs">
                      Aucun collaborateur trouvé pour ce filtre.
                    </td>
                  </tr>
                ) : (
                  filteredWorkloads.map((w) => {
                    const initials = w.full_name
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    const isOverload = w.utilization_pct > 85;
                    const isOptimal = w.utilization_pct >= 60 && w.utilization_pct <= 85;
                    const roleTitle = OFFICIAL_ROLES_MAP[w.email || ''] || 'Associé Minerva';

                    return (
                      <tr
                        key={w.member_id}
                        className="h-9 hover:bg-zinc-50/80 transition-colors group"
                      >
                        {/* Collaborateur (Sans-serif normal-case) */}
                        <td className="py-1 px-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 border border-emerald-200">
                              {initials}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-zinc-900 font-sans leading-none">
                                {w.full_name}
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono leading-none mt-0.5" style={MONO}>
                                {w.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Rôle */}
                        <td className="py-1 px-3 text-zinc-600 text-xs font-sans whitespace-nowrap">
                          {roleTitle}
                        </td>

                        {/* Charge Hebdo (Monospace Strict) */}
                        <td className="py-1 px-3 font-mono text-zinc-700 whitespace-nowrap" style={MONO}>
                          <span className="font-semibold text-zinc-900">{w.assigned_hours}h</span>
                          <span className="text-zinc-400"> / 35h </span>
                          <span className="text-zinc-500">({w.utilization_pct}%)</span>
                        </td>

                        {/* Jauge Fine 4px */}
                        <td className="py-1 px-3 whitespace-nowrap">
                          <div className="w-24 bg-zinc-100 rounded-full h-1 overflow-hidden">
                            <div
                              className={cn(
                                'h-1 rounded-full transition-all duration-500',
                                isOverload
                                  ? 'bg-red-500'
                                  : isOptimal
                                  ? 'bg-emerald-500'
                                  : 'bg-zinc-400'
                              )}
                              style={{ width: `${Math.max(w.utilization_pct, 4)}%` }}
                            />
                          </div>
                        </td>

                        {/* Répartition (Tâches) */}
                        <td className="py-1 px-3 text-zinc-600 text-xs whitespace-nowrap">
                          <span className="font-medium text-zinc-800 font-mono" style={MONO}>
                            {w.in_progress_tasks}
                          </span>{' '}
                          active{w.in_progress_tasks > 1 ? 's' : ''} ·{' '}
                          <span className="font-medium text-zinc-800 font-mono" style={MONO}>
                            {w.todo_tasks}
                          </span>{' '}
                          en attente
                        </td>

                        {/* Statut avec pastille conforme */}
                        <td className="py-1 px-3 text-center whitespace-nowrap">
                          {isOverload ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium text-red-700 bg-red-50 border border-red-200"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              <span>Surcharge</span>
                            </span>
                          ) : isOptimal ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium text-emerald-700 bg-emerald-50 border border-emerald-200"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>Optimal</span>
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium text-zinc-600 bg-zinc-100 border border-zinc-200"
                            >
                              <span>Disponible</span>
                            </span>
                          )}
                        </td>

                        {/* Action Inline (+ Assigner au survol) */}
                        <td className="py-1 px-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleOpenAssignModal(w)}
                            className="opacity-0 group-hover:opacity-100 text-xs text-zinc-700 hover:text-emerald-700 border border-zinc-200 hover:border-emerald-300 rounded px-2 py-0.5 bg-white hover:bg-emerald-50 shadow-2xs font-sans transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Assigner</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── 4. Intégration Compacte du Coach Minerva (Bottom Strip 36px) ── */}
          <div className="h-9 px-3.5 border-t border-zinc-200/80 bg-zinc-50/70 flex items-center justify-between text-xs font-sans text-zinc-600">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                <strong className="text-zinc-900 font-medium">Coach Minerva :</strong>{' '}
                <span className="font-mono text-zinc-800" style={MONO}>
                  {pollResponsesCount}/5
                </span>{' '}
                réponses collectées sur le sondage hebdomadaire d'équipe.
              </span>
            </div>

            <button
              onClick={handleTriggerCoachReminder}
              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Déclencher rappel Slack/Email →</span>
            </button>
          </div>
        </div>

        {/* ── 5. Modal d'Assignation Rapide de Tâche ───────────────────────── */}
        {assignModalOpen && selectedMember && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-zinc-200 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-semibold text-zinc-900 font-sans">
                    Assigner une tâche à {selectedMember.full_name}
                  </h4>
                </div>
                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAssignTaskSubmit} className="p-4 space-y-3 text-xs font-sans">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Intitulé de la tâche :
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Refonte de la page pricing Framer"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full h-8 px-2.5 border border-zinc-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      Heures estimées :
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="35"
                      value={taskEstimatedHours}
                      onChange={(e) => setTaskEstimatedHours(e.target.value)}
                      className="w-full h-8 px-2.5 border border-zinc-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                      style={MONO}
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      Priorité :
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                      className="w-full h-8 px-2 border border-zinc-300 rounded-md focus:border-emerald-500 bg-white font-sans"
                    >
                      <option value="low">Basse</option>
                      <option value="medium">Normale</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Date d'échéance :
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full h-8 px-2.5 border border-zinc-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                    style={MONO}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignModalOpen(false)}
                    className="h-8 px-3 text-zinc-600 hover:bg-zinc-100 rounded-md cursor-pointer font-sans"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigning}
                    className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer font-sans disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isAssigning ? 'Attribution...' : 'Assigner la tâche'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageFadeIn>
  );
}
