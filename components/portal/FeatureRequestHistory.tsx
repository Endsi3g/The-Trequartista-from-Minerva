'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Layers,
  GitBranch,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  LayoutGrid,
  List,
  Kanban,
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  FeatureRequest,
  FeatureRequestStatus,
  FeatureRequestRepo,
  FeatureRequestCategory,
} from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

type StatusFilter = 'all' | FeatureRequestStatus;
type RepoFilter = 'all' | FeatureRequestRepo;
type DateFilter = 'all' | '7d' | '30d' | '90d' | 'ytd';
type ViewMode = 'cards' | 'table' | 'kanban';

const STATUS_CONFIG: Record<
  FeatureRequestStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  submitted: {
    label: 'Soumise',
    bg: 'bg-zinc-50',
    text: 'text-zinc-700',
    border: 'border-zinc-200',
    dot: 'bg-zinc-400',
  },
  under_review: {
    label: 'En revue',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  planned: {
    label: 'Planifié',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  in_progress: {
    label: 'En développement',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  in_development: {
    label: 'En développement',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  testing: {
    label: 'En test & QA',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  in_qa: {
    label: 'En recette QA',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  delivered: {
    label: 'Livré',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  declined: {
    label: 'Non retenu',
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
    border: 'border-zinc-200',
    dot: 'bg-zinc-400',
  },
};

interface FeatureRequestHistoryProps {
  requests: FeatureRequest[];
  onStatusChange?: (id: string, nextStatus: FeatureRequestStatus) => void;
  className?: string;
}

export function FeatureRequestHistory({
  requests,
  onStatusChange,
  className,
}: FeatureRequestHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [repoFilter, setRepoFilter] = useState<RepoFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [copied, setCopied] = useState(false);

  // Filtered requests computation
  const filteredRequests = useMemo(() => {
    const now = Date.now();
    const daysLimit =
      dateFilter === '7d'
        ? 7
        : dateFilter === '30d'
        ? 30
        : dateFilter === '90d'
        ? 90
        : dateFilter === 'ytd'
        ? 365
        : null;

    return requests.filter((item) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const itemRepo = item.repo || item.target_repo || '';
        const matchRepo = itemRepo.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchRepo) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // 3. Repo Filter
      const itemRepo = item.repo || item.target_repo;
      if (repoFilter !== 'all' && itemRepo !== repoFilter) {
        return false;
      }

      // 4. Date Filter
      if (daysLimit !== null) {
        const itemTime = new Date(item.created_at).getTime();
        if (now - itemTime > daysLimit * 86400000) {
          return false;
        }
      }

      return true;
    });
  }, [requests, searchQuery, statusFilter, repoFilter, dateFilter]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = requests.length;
    const delivered = requests.filter((r) => r.status === 'delivered').length;
    const inProgress = requests.filter((r) => r.status === 'in_progress' || r.status === 'testing').length;
    const planned = requests.filter((r) => r.status === 'planned' || r.status === 'under_review').length;
    const deliveredPct = total > 0 ? Math.round((delivered / total) * 100) : 0;
    return { total, delivered, inProgress, planned, deliveredPct };
  }, [requests]);

  const handleCopySummary = () => {
    const text = filteredRequests
      .map(
        (r) =>
          `• [${STATUS_CONFIG[r.status]?.label || r.status}] (${r.repo}) ${r.title} - ${new Date(
            r.created_at
          ).toLocaleDateString('fr-CA')}`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={cn('overflow-hidden border-zinc-200/80 bg-white shadow-sm', className)}>
      {/* ── 1. Top Header & Stats Strip ── */}
      <div className="p-5 sm:p-6 border-b border-zinc-100 bg-gradient-to-r from-zinc-50 via-white to-zinc-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 font-display">
                Historique des demandes
              </h2>
            </div>
            <p className="text-xs text-zinc-500">
              Retrouvez l&apos;intégralité des demandes soumises avec filtres par statut, date et module.
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-zinc-100 rounded-lg border border-zinc-200/70 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={cn(
                  'px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors',
                  viewMode === 'cards' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500 hover:text-zinc-800'
                )}
                title="Vue Cartes"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cartes</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors',
                  viewMode === 'table' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500 hover:text-zinc-800'
                )}
                title="Vue Tableau"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tableau</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopySummary}
              className="h-8 px-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copier la liste filtrée"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Pill Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          <div className="p-2.5 rounded-lg bg-zinc-100/80 border border-zinc-200/60 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-500">Total Demandes</span>
            <span className="text-sm font-bold text-zinc-900" style={MONO}>{stats.total}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800">Livrées ({stats.deliveredPct}%)</span>
            <span className="text-sm font-bold text-emerald-700" style={MONO}>{stats.delivered}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/60 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-800">En cours / Test</span>
            <span className="text-sm font-bold text-blue-700" style={MONO}>{stats.inProgress}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-800">En revue & Sprint</span>
            <span className="text-sm font-bold text-amber-700" style={MONO}>{stats.planned}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Filters Control Bar ── */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 bg-zinc-50/40 space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par mot-clé, module ou description..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Filter 1: Statut */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:inline">Statut :</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-9 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tous les statuts ({requests.length})</option>
              <option value="under_review">En revue</option>
              <option value="planned">Planifié</option>
              <option value="in_progress">En développement</option>
              <option value="testing">En test & QA</option>
              <option value="delivered">Livré</option>
              <option value="declined">Non retenu</option>
            </select>
          </div>

          {/* Filter 2: Repo / Module */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:inline">Module :</span>
            <select
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value as RepoFilter)}
              className="h-9 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Tous les modules</option>
              <option value="Minerva-Flow">Minerva-Flow</option>
              <option value="The-Trequartista">The-Trequartista</option>
              <option value="Minerva-Voice-AI">Minerva Voice AI</option>
              <option value="Minerva-OS">Minerva-OS</option>
              <option value="API & Intégrations">API & Intégrations</option>
            </select>
          </div>

          {/* Filter 3: Date */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:inline">Date :</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="h-9 px-2.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Toutes dates</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">90 derniers jours</option>
              <option value="ytd">Cette année (YTD)</option>
            </select>
          </div>
        </div>

        {/* Filter chips active indicator */}
        {(statusFilter !== 'all' || repoFilter !== 'all' || dateFilter !== 'all' || searchQuery.trim()) && (
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <span>
              {filteredRequests.length} résultat{filteredRequests.length > 1 ? 's' : ''} correspondant{filteredRequests.length > 1 ? 's' : ''} aux filtres
            </span>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setRepoFilter('all');
                setDateFilter('all');
                setSearchQuery('');
              }}
              className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Results Rendering ── */}
      {filteredRequests.length === 0 ? (
        <div className="p-12 text-center space-y-2">
          <Filter className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="text-sm font-semibold text-zinc-700">Aucune demande trouvée</p>
          <p className="text-xs text-zinc-500">Essayez de modifier vos filtres ou termes de recherche.</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* ── View A: Cards List ── */
        <div className="divide-y divide-zinc-100">
          {filteredRequests.map((req) => {
            const st = STATUS_CONFIG[req.status] || STATUS_CONFIG.under_review;
            return (
              <div key={req.id} className="p-5 sm:p-6 space-y-2.5 hover:bg-zinc-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-zinc-900 text-white font-mono" style={MONO}>
                      {req.repo || req.target_repo || 'Minerva-Flow'}
                    </span>
                    <span className="text-[11px] text-zinc-400">•</span>
                    <span className="text-[11px] text-zinc-500 font-medium" style={MONO}>
                      {new Date(req.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold border self-start sm:self-auto', st.bg, st.text, st.border)}>
                    <span className={cn('w-1.5 h-1.5 rounded-[2px]', st.dot)} />
                    <span>{st.label}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-zinc-900">{req.title}</h3>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{req.description}</p>
                </div>

                {req.admin_notes && (
                  <div className="p-2.5 rounded-lg bg-zinc-100/80 border border-zinc-200/60 text-[11.5px] text-zinc-700 mt-2">
                    <span className="font-semibold text-zinc-900">Note équipe : </span>
                    <span>{req.admin_notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── View B: Table View ── */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/50 text-[10.5px] uppercase font-bold text-zinc-500 tracking-wider">
                <th className="py-3 px-4">Demande</th>
                <th className="py-3 px-4">Module / Repo</th>
                <th className="py-3 px-4">Priorité</th>
                <th className="py-3 px-4">Date soumission</th>
                <th className="py-3 px-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {filteredRequests.map((req) => {
                const st = STATUS_CONFIG[req.status] || STATUS_CONFIG.under_review;
                return (
                  <tr key={req.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-zinc-900 truncate">{req.title}</div>
                      <div className="text-[11px] text-zinc-500 truncate">{req.description}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold" style={MONO}>
                      {req.repo || req.target_repo || 'Minerva-Flow'}
                    </td>
                    <td className="py-3 px-4 capitalize text-zinc-600">
                      {req.priority}
                    </td>
                    <td className="py-3 px-4 text-zinc-500" style={MONO}>
                      {new Date(req.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-bold border', st.bg, st.text, st.border)}>
                        <span className={cn('w-1.5 h-1.5 rounded-[2px]', st.dot)} />
                        <span>{st.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
