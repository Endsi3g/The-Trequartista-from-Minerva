'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Kanban,
  Zap,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Calendar,
  Sparkles,
  AlertTriangle,
  FolderGit2,
  ListTodo,
  CheckSquare2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageFadeIn } from '@/components/ui/page-transition';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useToast } from '@/components/providers/ToastProvider';
import { SkeletonKanban, SkeletonRows } from '@/components/ui/skeleton';
import type { PlaneIssue, PlaneCycle, PlaneModule, PlaneSyncLog } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface PlaneStatusResponse {
  configured: boolean;
  ok?: boolean;
  message?: string;
  baseUrl: string;
  workspaceSlug: string;
  projectId: string;
  totalIssues: number;
  syncedTasksCount: number;
  totalTasksCount?: number;
  activeCyclesCount: number;
  activeModulesCount: number;
  latencyMs: number;
  issues?: PlaneIssue[];
  cycles?: PlaneCycle[];
  modules?: PlaneModule[];
  logs?: PlaneSyncLog[];
}

export default function PlaneHubPage() {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const [data, setData] = useState<PlaneStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'issues' | 'cycles' | 'modules' | 'logs'>('issues');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/plane/status');
      const json = await res.json();
      setData(json);
    } catch {
      toastError('Erreur réseau', 'Impossible de récupérer l’état de l’instance Plane.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/plane/sync', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        toastError('Erreur de synchronisation', json.error || 'Une erreur est survenue.');
      } else {
        toastSuccess('Synchronisation terminée', json.message || `${json.synced} tâches synchronisées avec succès.`);
        await loadStatus();
      }
    } catch {
      toastError('Erreur de communication', 'Le serveur n’a pas pu exécuter la synchronisation.');
    } finally {
      setSyncing(false);
    }
  };

  const filteredIssues = useMemo(() => {
    if (!data?.issues) return [];
    return data.issues.filter((issue) => {
      const matchSearch =
        !searchQuery ||
        issue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (issue.sequence_id && String(issue.sequence_id).includes(searchQuery));
      const matchPriority = priorityFilter === 'all' || issue.priority === priorityFilter;
      const stateGroup = issue.state_detail?.group || 'unstarted';
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'done' && stateGroup === 'completed') ||
        (statusFilter === 'in_progress' && stateGroup === 'started') ||
        (statusFilter === 'todo' && (stateGroup === 'unstarted' || stateGroup === 'backlog'));
      return matchSearch && matchPriority && matchStatus;
    });
  }, [data?.issues, searchQuery, priorityFilter, statusFilter]);

  if (loading) {
    return (
      <PageFadeIn className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-black/[0.06] rounded animate-pulse" />
          <div className="h-4 w-96 bg-black/[0.04] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-mv-surface border border-mv-border rounded-xl animate-pulse" />
          <div className="h-28 bg-mv-surface border border-mv-border rounded-xl animate-pulse" />
          <div className="h-28 bg-mv-surface border border-mv-border rounded-xl animate-pulse" />
          <div className="h-28 bg-mv-surface border border-mv-border rounded-xl animate-pulse" />
        </div>
        <SkeletonRows count={6} />
      </PageFadeIn>
    );
  }

  const isConfigured = Boolean(data?.configured && data?.ok);

  return (
    <PageFadeIn className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-mv-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mv-green text-white flex items-center justify-center shadow-mv-sm">
              <Kanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold font-display tracking-tight text-mv-ink">Plane Workspace</h1>
                {isConfigured ? (
                  <Badge variant="green" className="gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connecté ({data?.latencyMs} ms)
                  </Badge>
                ) : (
                  <Badge variant="amber" className="gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Non configuré
                  </Badge>
                )}
              </div>
              <p className="text-xs text-mv-ink-soft">
                Gestionnaire de projet open-source & alternative à Linear/Jira synchronisé avec Minerva Trequartista.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {data?.baseUrl && isConfigured && (
            <a
              href={`${data.baseUrl}/${data.workspaceSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-mv-surface border border-mv-border hover:bg-black/[0.04] transition-colors text-mv-ink cursor-pointer"
            >
              <span>Ouvrir Plane</span>
              <ExternalLink size={13} className="opacity-70" />
            </a>
          )}
          <Button
            onClick={handleSyncAll}
            disabled={syncing || !isConfigured}
            className="gap-2 bg-mv-green hover:bg-mv-green/90 text-white cursor-pointer"
          >
            <RefreshCw size={14} className={cn(syncing && 'animate-spin')} />
            <span>{syncing ? 'Synchronisation...' : 'Synchroniser avec Plane'}</span>
          </Button>
        </div>
      </div>

      {/* ── Unconfigured Alert Banner ── */}
      {!isConfigured && (
        <Card className="p-6 border-amber-200 bg-amber-50/70 space-y-4 rounded-xl shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-2 flex-1">
              <h2 className="text-sm font-bold text-amber-900">Connexion Plane Self-Hosted requise</h2>
              <p className="text-xs text-amber-800 leading-relaxed">
                Pour activer la synchronisation bidirectionnelle des tâches, la gestion des cycles et les outils MCP,
                configurez les variables d&apos;environnement suivantes dans votre fichier{' '}
                <code className="px-1.5 py-0.5 rounded bg-amber-200/60 font-mono text-[11px]">.env.local</code> :
              </p>
              <pre className="p-3 rounded-lg bg-white/80 border border-amber-200 text-xs font-mono text-amber-950 overflow-x-auto">
{`PLANE_BASE_URL=https://plane.minerva.agency
PLANE_API_KEY=votre_cle_api_ou_personal_access_token
PLANE_WORKSPACE_SLUG=minerva
PLANE_PROJECT_ID=identifiant_uuid_du_projet_plane
PLANE_WEBHOOK_SECRET=votre_secret_webhook_long_et_securise`}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>Tickets Plane Totaux</span>
            <ListTodo size={16} className="text-mv-green" />
          </div>
          <div className="text-2xl font-bold text-mv-ink" style={MONO}>
            <AnimatedNumber value={data?.totalIssues || 0} />
          </div>
          <p className="text-[11px] text-mv-ink-soft">Dans le projet maître</p>
        </Card>

        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>Tâches Synchronisées</span>
            <CheckSquare2 size={16} className="text-mv-green" />
          </div>
          <div className="text-2xl font-bold text-mv-ink" style={MONO}>
            <AnimatedNumber value={data?.syncedTasksCount || 0} />
            <span className="text-xs font-normal text-mv-ink-faint ml-1">
              / {data?.totalTasksCount || 0} tâches
            </span>
          </div>
          <p className="text-[11px] text-mv-ink-soft">Liaison bidirectionnelle active</p>
        </Card>

        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>Cycles / Sprints</span>
            <Activity size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-mv-ink" style={MONO}>
            <AnimatedNumber value={data?.activeCyclesCount || 0} />
          </div>
          <p className="text-[11px] text-mv-ink-soft">Itérations d&apos;ingénierie</p>
        </Card>

        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>Modules & Epics</span>
            <Layers size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-mv-ink" style={MONO}>
            <AnimatedNumber value={data?.activeModulesCount || 0} />
          </div>
          <p className="text-[11px] text-mv-ink-soft">Roadmap et fonctionnalités</p>
        </Card>
      </div>

      {/* ── Active Cycles & Sprints Section ── */}
      {data?.cycles && data.cycles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-mv-ink">Cycles & Sprints en cours</h2>
            <span className="text-xs text-mv-ink-faint" style={MONO}>
              {data.cycles.length} cycle{data.cycles.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.cycles.map((cycle) => {
              const total = cycle.total_issues || 0;
              const done = cycle.completed_issues || 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <Card key={cycle.id} className="p-4 bg-mv-surface border-mv-border rounded-xl space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-mv-ink line-clamp-1">{cycle.name}</span>
                      <div className="flex items-center gap-1.5 text-[11px] text-mv-ink-faint">
                        <Calendar size={12} />
                        <span>
                          {cycle.start_date ? new Date(cycle.start_date).toLocaleDateString('fr-CA') : 'N/A'} —{' '}
                          {cycle.end_date ? new Date(cycle.end_date).toLocaleDateString('fr-CA') : 'En continu'}
                        </span>
                      </div>
                    </div>
                    <Badge variant={cycle.status === 'current' ? 'green' : 'neutral'} className="text-[10px]">
                      {cycle.status || 'actif'}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-mv-ink-soft" style={MONO}>
                      <span>{done} / {total} tickets complétés</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-mv-green rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main Tab Navigation & Content ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-mv-border pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('issues')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                activeTab === 'issues'
                  ? 'bg-mv-green text-white shadow-xs'
                  : 'text-mv-ink-soft hover:bg-black/[0.05] hover:text-mv-ink'
              )}
            >
              Tickets & Issues Plane ({filteredIssues.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                activeTab === 'logs'
                  ? 'bg-mv-green text-white shadow-xs'
                  : 'text-mv-ink-soft hover:bg-black/[0.05] hover:text-mv-ink'
              )}
            >
              Journal de Synchronisation ({data?.logs?.length || 0})
            </button>
          </div>

          {activeTab === 'issues' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mv-ink-faint" />
                <input
                  type="text"
                  placeholder="Rechercher ticket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green w-44"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-mv-surface border border-mv-border text-mv-ink-soft focus:outline-none cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="done">Terminé</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-mv-surface border border-mv-border text-mv-ink-soft focus:outline-none cursor-pointer"
              >
                <option value="all">Toutes priorités</option>
                <option value="urgent">Urgente</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
          )}
        </div>

        {activeTab === 'issues' && (
          <div className="space-y-2.5">
            {filteredIssues.length === 0 ? (
              <Card className="p-12 text-center bg-mv-surface border-mv-border rounded-xl space-y-2">
                <Kanban className="w-8 h-8 text-mv-ink-faint mx-auto" />
                <h3 className="text-sm font-bold text-mv-ink">Aucun ticket Plane trouvé</h3>
                <p className="text-xs text-mv-ink-soft max-w-sm mx-auto">
                  {isConfigured
                    ? 'Aucun ticket ne correspond à vos filtres actuels ou le projet Plane est vide.'
                    : 'Configurez Plane dans .env.local pour charger et synchroniser les tickets.'}
                </p>
              </Card>
            ) : (
              <div className="border border-mv-border rounded-xl bg-mv-surface overflow-hidden divide-y divide-mv-border">
                {filteredIssues.map((issue) => {
                  const stateGroup = issue.state_detail?.group || 'unstarted';
                  const priority = issue.priority || 'medium';
                  const isDone = stateGroup === 'completed';
                  const isInProgress = stateGroup === 'started';

                  return (
                    <div
                      key={issue.id}
                      className="p-3.5 flex items-center justify-between gap-4 hover:bg-black/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            isDone ? 'bg-emerald-500' : isInProgress ? 'bg-blue-500' : 'bg-zinc-400'
                          )}
                        />
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            {issue.sequence_id && (
                              <span
                                className="text-[11px] font-bold text-mv-ink-soft bg-black/[0.04] px-1.5 py-0.5 rounded"
                                style={MONO}
                              >
                                OPS-{issue.sequence_id}
                              </span>
                            )}
                            <span className={cn('text-xs font-semibold text-mv-ink truncate', isDone && 'line-through text-mv-ink-faint')}>
                              {issue.name}
                            </span>
                          </div>
                          {issue.target_date && (
                            <div className="text-[10.5px] text-mv-ink-faint flex items-center gap-1">
                              <Clock size={11} />
                              <span>Échéance : {new Date(issue.target_date).toLocaleDateString('fr-CA')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <Badge
                          variant={
                            priority === 'urgent'
                              ? 'red'
                              : priority === 'high'
                              ? 'amber'
                              : priority === 'medium'
                              ? 'blue'
                              : 'neutral'
                          }
                          className="text-[10px]"
                        >
                          {priority}
                        </Badge>
                        <Badge
                          variant={isDone ? 'green' : isInProgress ? 'blue' : 'neutral'}
                          className="text-[10px]"
                        >
                          {issue.state_detail?.name || stateGroup}
                        </Badge>
                        {data?.baseUrl && (
                          <a
                            href={`${data.baseUrl}/${data.workspaceSlug}/projects/${data.projectId}/issues/${issue.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-mv-ink-faint hover:text-mv-ink rounded hover:bg-black/[0.05] transition-colors"
                            title="Ouvrir dans Plane"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2">
            {!data?.logs || data.logs.length === 0 ? (
              <Card className="p-12 text-center bg-mv-surface border-mv-border rounded-xl space-y-2">
                <Clock className="w-8 h-8 text-mv-ink-faint mx-auto" />
                <h3 className="text-sm font-bold text-mv-ink">Aucun événement de synchronisation</h3>
                <p className="text-xs text-mv-ink-soft">
                  Les événements de synchronisation bidirectionnelle, webhooks et appels MCP apparaîtront ici.
                </p>
              </Card>
            ) : (
              <div className="border border-mv-border rounded-xl bg-mv-surface overflow-hidden divide-y divide-mv-border">
                {data.logs.map((log) => (
                  <div key={log.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {log.status === 'success' ? (
                        <CheckCircle2 size={16} className="text-mv-green shrink-0" />
                      ) : log.status === 'skipped' ? (
                        <Clock size={16} className="text-mv-ink-faint shrink-0" />
                      ) : (
                        <AlertCircle size={16} className="text-red-600 shrink-0" />
                      )}
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-mv-ink uppercase tracking-wide text-[10.5px]">
                            {log.action.replace('_', ' ')}
                          </span>
                          {log.error_message && (
                            <span className="text-[11px] text-red-600 truncate">{log.error_message}</span>
                          )}
                        </div>
                        {log.plane_issue_id && (
                          <span className="text-[10px] text-mv-ink-faint font-mono">
                            Issue #{log.plane_issue_id}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-mv-ink-faint shrink-0" style={MONO}>
                      {new Date(log.created_at).toLocaleString('fr-CA')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageFadeIn>
  );
}
