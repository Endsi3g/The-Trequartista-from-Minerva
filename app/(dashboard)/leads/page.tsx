'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KanbanBoard } from '@/components/crm/KanbanBoard';
import { PageFadeIn } from '@/components/ui/page-transition';
import { TabTransition } from '@/components/ui/tab-transition';
import {
  Search,
  Kanban,
  Table as TableIcon,
  Download,
  Plus,
  DollarSign,
  TrendingUp,
  Target,
  Users,
  CheckCircle2,
  X,
  RefreshCw,
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
  PhoneCall,
  AlertTriangle,
  Flame,
  Trash2,
} from 'lucide-react';
import { fetchClients, fetchLeads, deleteLead, deleteMultipleLeads } from '@/lib/services/supabase-data';
import type { Client, Lead, LeadStage } from '@/lib/types';
import { useSupabaseRealtime } from '@/components/providers/SupabaseRealtimeProvider';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { ReachSyncModal } from '@/components/crm/ReachSyncModal';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

function LeadsCrmContent() {
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'triage'>('kanban');
  const [triageFilter, setTriageFilter] = useState<'all' | 'A' | 'B' | 'C' | 'booked'>('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isReachModalOpen, setIsReachModalOpen] = useState(false);
  const [isBatchQualifying, setIsBatchQualifying] = useState(false);

  const { lastUpdateTimestamp } = useSupabaseRealtime();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clientList, leadList] = await Promise.all([
        fetchClients(),
        fetchLeads(selectedClientId),
      ]);
      setClients(clientList);
      setLeads(leadList);
    } catch (err) {
      console.warn('[Leads] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClientId, lastUpdateTimestamp]);

  const filteredLeads = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return leads.filter((lead) => {
      if (!query) return true;
      return (
        (lead.company_name || '').toLowerCase().includes(query) ||
        lead.contact_name.toLowerCase().includes(query) ||
        lead.contact_email.toLowerCase().includes(query) ||
        lead.service_requested.toLowerCase().includes(query) ||
        lead.client_name.toLowerCase().includes(query)
      );
    });
  }, [leads, searchQuery]);

  const triageLeads = useMemo(() => {
    return filteredLeads.filter((l) => {
      if (triageFilter === 'all') return true;
      if (triageFilter === 'A')
        return (
          l.qualification_tier === 'A' ||
          (l.qualification_score !== null && l.qualification_score !== undefined && l.qualification_score >= 70)
        );
      if (triageFilter === 'B')
        return (
          l.qualification_tier === 'B' ||
          (l.qualification_score !== null &&
            l.qualification_score !== undefined &&
            l.qualification_score >= 45 &&
            l.qualification_score < 70)
        );
      if (triageFilter === 'C')
        return (
          l.qualification_tier === 'C' ||
          (l.qualification_score !== null && l.qualification_score !== undefined && l.qualification_score < 45)
        );
      if (triageFilter === 'booked') return Boolean(l.call_at);
      return true;
    });
  }, [filteredLeads, triageFilter]);

  // Calculate Pipeline Financial Metrics
  const totalPipelineMrr = filteredLeads.reduce((acc, l) => acc + (l.mrr_value || 0), 0);
  const totalPipelineOneTime = filteredLeads.reduce((acc, l) => acc + (l.one_time_value || 0), 0);
  const totalGrossPipeline = totalPipelineMrr * 12 + totalPipelineOneTime;

  const weightedForecastValue = filteredLeads.reduce((acc, l) => {
    const prob = (l.probability_pct || 10) / 100;
    const dealVal = (l.mrr_value || 0) * 12 + (l.one_time_value || 0);
    return acc + dealVal * prob;
  }, 0);

  const wonLeadsCount = filteredLeads.filter((l) => l.status === 'Gagné' || l.stage === 'gagne').length;
  const winRatePct = filteredLeads.length > 0 ? Math.round((wonLeadsCount / filteredLeads.length) * 100) : 0;

  const handleExportCsv = () => {
    const listToExport = selectedIds.size > 0 ? filteredLeads.filter((l) => selectedIds.has(l.id)) : filteredLeads;
    const headers = ['Nom / Entreprise', 'Contact', 'Email', 'Téléphone', 'Service', 'Étape', 'Statut', 'MRR ($)', 'Ponctuel ($)', 'Probabilité (%)', 'Date'];
    const rows = listToExport.map((l) => [
      `"${l.company_name || l.contact_name}"`,
      `"${l.contact_name}"`,
      l.contact_email,
      `"${l.contact_phone || ''}"`,
      `"${l.service_requested}"`,
      l.stage || l.status,
      l.status,
      l.mrr_value || 0,
      l.one_time_value || 0,
      l.probability_pct || 10,
      `"${l.created_at}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `leads-crm-minerva-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchQualify = async () => {
    setIsBatchQualifying(true);
    try {
      const res = await fetch('/api/leads/batch-qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: selectedIds.size > 0 ? Array.from(selectedIds) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toastSuccess(
          'Qualification IA terminée',
          `${data.total_qualified} lead(s) scoré(s), ${data.total_promoted} promu(s) en étape Qualification.`
        );
        loadData();
      } else {
        toastError('Erreur de qualification', data.error || 'Impossible de lancer la qualification.');
      }
    } catch (err: any) {
      toastError('Erreur', err.message);
    } finally {
      setIsBatchQualifying(false);
    }
  };

  const allVisibleSelected = filteredLeads.length > 0 && filteredLeads.every((l) => selectedIds.has(l.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        filteredLeads.forEach((l) => next.delete(l.id));
        return next;
      }
      const next = new Set(prev);
      filteredLeads.forEach((l) => next.add(l.id));
      return next;
    });
  };

  const toggleOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteLead = async (leadId: string, leadName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Supprimer définitivement le lead « ${leadName} » ? Cette action est irréversible.`)) return;
    const ok = await deleteLead(leadId);
    if (ok) {
      toastSuccess('Lead supprimé', `Le lead ${leadName} a été supprimé.`);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(leadId);
        return next;
      });
      loadData();
    } else {
      toastError('Erreur', 'Impossible de supprimer ce lead.');
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (!confirm(`Supprimer définitivement ces ${ids.length} leads sélectionnés ? Cette action est irréversible.`)) return;
    try {
      const ok = await deleteMultipleLeads(ids);
      if (ok) {
        toastSuccess('Leads supprimés', `${ids.length} leads ont été supprimés.`);
        setSelectedIds(new Set());
        loadData();
      } else {
        toastError('Erreur', 'Impossible de supprimer les leads sélectionnés.');
      }
    } catch {
      toastError('Erreur', 'Une erreur est survenue lors de la suppression.');
    }
  };

  return (
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ── 1. Compact Header Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">
              Pipeline Leads
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-emerald-50/60 border border-emerald-200/60 text-[10.5px] font-medium text-emerald-800" style={MONO}>
              <span className="w-1.5 h-1.5 rounded-full bg-mv-green animate-pulse" />
              Sync live
            </span>
          </div>
        </div>

        {/* Right Controls: View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {/* Segmented Control [ Kanban | Table ] */}
          <div className="flex items-center bg-zinc-100/80 border border-mv-border rounded-[5px] p-0.5 text-[11px] font-medium">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'kanban'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <Kanban className="w-3 h-3" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'table'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <TableIcon className="w-3 h-3" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('triage')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'triage'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Triage &amp; Pipeline</span>
              {leads.filter((l) => l.qualification_tier === 'A').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsReachModalOpen(true)}
            className="h-7 px-2.5 rounded-[4px] bg-blue-50/80 border border-blue-200/80 text-[11.5px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Synchroniser les fiches depuis Minerva Reach"
          >
            <RefreshCw className="w-3 h-3 text-blue-600" />
            <span>Sync Reach</span>
          </button>

          <button
            type="button"
            onClick={handleBatchQualify}
            disabled={isBatchQualifying}
            className="h-7 px-2.5 rounded-[4px] bg-mv-cream-soft border border-mv-border text-[11.5px] font-semibold text-mv-ink hover:bg-mv-border/40 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Calculer le score IA et signaux d'achat sur les leads"
          >
            <Sparkles className={`w-3 h-3 text-mv-green ${isBatchQualifying ? 'animate-spin' : ''}`} />
            <span>{isBatchQualifying ? 'Scoring IA…' : 'Qualifier IA'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="h-7 px-2.5 rounded-[4px] bg-white border border-mv-border text-[11.5px] font-medium text-mv-ink hover:bg-zinc-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3 h-3 text-zinc-500" />
            <span>Exporter CSV</span>
          </button>

          <Link
            href="/leads/new"
            className="h-7 px-3 rounded-[4px] bg-mv-green hover:bg-emerald-700 text-white text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Lead</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Unified 4-KPI Continuous Telemetry Ribbon ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-mv-border">
          {/* Cell 1: Valeur Brute Pipeline */}
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                Valeur Brute Pipeline
              </span>
              <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                {isLoading ? '—' : `${totalGrossPipeline.toLocaleString('fr-CA')} $`}
              </div>
              <div className="text-[11px] text-mv-ink-faint truncate ml-2" style={MONO}>
                {totalPipelineMrr > 0 ? `${totalPipelineMrr} $/mo MRR` : 'MRR potentiel'}
              </div>
            </div>
          </div>

          {/* Cell 2: Prévisionnel Pondéré */}
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                Prévisionnel Pondéré
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                {isLoading ? '—' : `${Math.round(weightedForecastValue).toLocaleString('fr-CA')} $`}
              </div>
              <div className="text-[11px] text-mv-ink-faint truncate ml-2" style={MONO}>
                Selon probabilités
              </div>
            </div>
          </div>

          {/* Cell 3: Taux de Conversion */}
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                Taux de Conversion
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                {isLoading ? '—' : `${winRatePct}.0%`}
              </div>
              <div className="text-[11px] text-mv-green truncate ml-2 font-medium" style={MONO}>
                {wonLeadsCount} deal{wonLeadsCount > 1 ? 's' : ''} gagné{wonLeadsCount > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Cell 4: Leads Actifs */}
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                Leads Actifs
              </span>
              <Users className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                {isLoading ? '—' : <AnimatedNumber value={filteredLeads.length} />}
              </div>
              <div className="text-[11px] text-mv-ink-faint truncate ml-2" style={MONO}>
                {filteredLeads.filter((l) => l.status === 'Nouveau').length} nouveaux
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Unified Search & Filter Toolbar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un prospect, restaurant, email... (/)"
              className="w-full h-7 pl-7 pr-2 text-[11.5px] rounded-[4px] border border-mv-border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-mv-green transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1.5 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="h-7 px-2 text-[11.5px] rounded-[4px] border border-mv-border bg-white text-zinc-700 focus:outline-none focus:border-mv-green cursor-pointer"
          >
            <option value="all">Tous les clients rattachés</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-[11px] font-mono text-zinc-400 shrink-0" style={MONO}>
          {filteredLeads.length} prospect{filteredLeads.length > 1 ? 's' : ''} total
        </span>
      </div>

      {/* ── 4. Main CRM Board / Table View ── */}
      <TabTransition tabKey={viewMode}>
      {viewMode === 'kanban' ? (
        <KanbanBoard
          leads={filteredLeads}
          onSelectLead={(lead) => router.push(`/leads/${lead.id}`)}
          onLeadsUpdated={loadData}
        />
      ) : viewMode === 'table' ? (
        /* Commutable 36px DataTable View */
        <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr className="h-7 bg-black/[0.02] border-b border-mv-border text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                <th className="pl-3.5 pr-2 w-8 text-left">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-mv-border text-mv-green focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-2 text-left font-medium">Prospect / Entreprise</th>
                <th className="px-2 text-left font-medium">Score IA</th>
                <th className="px-2 text-left font-medium">Service</th>
                <th className="px-2 text-left font-medium">Étape Pipeline</th>
                <th className="px-2 text-right font-medium">Valeur ($)</th>
                <th className="px-2 text-left font-medium">Contact & Courriel</th>
                <th className="px-2 text-right font-medium">Date</th>
                <th className="pr-3.5 pl-2 text-right font-medium w-10">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const isSelected = selectedIds.has(lead.id);
                const dealVal = (lead.mrr_value ? `${lead.mrr_value} $/mo` : null) || (lead.one_time_value ? `${lead.one_time_value} $` : '—');
                return (
                  <tr
                    key={lead.id}
                    onClick={() => router.push(`/leads/${lead.id}`)}
                    className={cn(
                      'h-9 border-b border-mv-border last:border-0 transition-colors cursor-pointer',
                      isSelected ? 'bg-emerald-50/40' : 'hover:bg-black/[0.02]'
                    )}
                  >
                    <td className="pl-3.5 pr-2 py-1" onClick={(e) => toggleOne(lead.id, e)}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded border-mv-border text-mv-green focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-1 font-semibold text-zinc-900 truncate max-w-[200px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">{lead.company_name || lead.contact_name}</span>
                        {lead.reach_id && (
                          <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            Reach
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      {lead.ai_score !== undefined && lead.ai_score !== null ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-mono font-bold',
                            lead.ai_score >= 80
                              ? 'bg-mv-green/15 text-mv-green border border-mv-green/30'
                              : lead.ai_score >= 60
                              ? 'bg-mv-amber/15 text-mv-amber border border-mv-amber/30'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                          )}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{lead.ai_score}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="px-2 py-1 text-[11.5px] text-zinc-600 truncate max-w-[140px]">
                      {lead.service_requested || 'Général'}
                    </td>
                    <td className="px-2 py-1 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-zinc-100 text-zinc-800 text-[11px] font-medium border border-zinc-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-mv-green" />
                        {lead.stage || lead.status}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-right font-mono font-semibold text-zinc-900 whitespace-nowrap" style={MONO}>
                      {dealVal}
                    </td>
                    <td className="px-2 py-1 text-[11.5px] text-zinc-500 font-mono truncate max-w-[180px]" style={MONO}>
                      {lead.contact_email || lead.contact_phone || '—'}
                    </td>
                    <td className="px-2 py-1 text-right text-[10.5px] text-zinc-400 font-mono whitespace-nowrap" style={MONO}>
                      {new Date(lead.created_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="pr-3.5 pl-2 py-1 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDeleteLead(lead.id, lead.company_name || lead.contact_name, e)}
                        className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Supprimer ce lead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Triage Inbound & Qualification Dashboard ── */
        <div className="space-y-4">
          {/* Triage Filter Ribbon */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setTriageFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 shrink-0',
                triageFilter === 'all'
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs dark:bg-white dark:text-zinc-900'
                  : 'bg-white dark:bg-zinc-900 border-mv-border text-zinc-600 hover:text-zinc-900'
              )}
            >
              <span>Tous les leads</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200/60 dark:bg-zinc-800" style={MONO}>
                {filteredLeads.length}
              </span>
            </button>

            <button
              onClick={() => setTriageFilter('A')}
              className={cn(
                'px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 shrink-0',
                triageFilter === 'A'
                  ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                  : 'bg-white dark:bg-zinc-900 border-mv-border text-zinc-600 hover:text-red-600'
              )}
            >
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <span>Tier A • Appel &lt;10m</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  triageFilter === 'A' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-700'
                )}
                style={MONO}
              >
                {leads.filter((l) => l.qualification_tier === 'A' || (l.qualification_score !== null && l.qualification_score !== undefined && l.qualification_score >= 70)).length}
              </span>
            </button>

            <button
              onClick={() => setTriageFilter('B')}
              className={cn(
                'px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 shrink-0',
                triageFilter === 'B'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-white dark:bg-zinc-900 border-mv-border text-zinc-600 hover:text-amber-600'
              )}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Tier B • Appel &lt;1h</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  triageFilter === 'B' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-700'
                )}
                style={MONO}
              >
                {leads.filter((l) => l.qualification_tier === 'B' || (l.qualification_score !== null && l.qualification_score !== undefined && l.qualification_score >= 45 && l.qualification_score < 70)).length}
              </span>
            </button>

            <button
              onClick={() => setTriageFilter('C')}
              className={cn(
                'px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 shrink-0',
                triageFilter === 'C'
                  ? 'bg-zinc-700 text-white border-zinc-700 shadow-2xs'
                  : 'bg-white dark:bg-zinc-900 border-mv-border text-zinc-600 hover:text-zinc-900'
              )}
            >
              <span>Tier C • Email / Validation</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-100 dark:bg-zinc-800" style={MONO}>
                {leads.filter((l) => l.qualification_tier === 'C' || (l.qualification_score !== null && l.qualification_score !== undefined && l.qualification_score < 45)).length}
              </span>
            </button>

            <button
              onClick={() => setTriageFilter('booked')}
              className={cn(
                'px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 shrink-0',
                triageFilter === 'booked'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white dark:bg-zinc-900 border-mv-border text-zinc-600 hover:text-emerald-600'
              )}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>RDV d&apos;Installation Fixés</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  triageFilter === 'booked' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'
                )}
                style={MONO}
              >
                {leads.filter((l) => Boolean(l.call_at)).length}
              </span>
            </button>
          </div>

          {/* Triage DataTable */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr className="h-8 bg-black/[0.02] border-b border-mv-border text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                  <th className="pl-3.5 pr-2 text-left font-medium">Établissement / Contact</th>
                  <th className="px-2 text-left font-medium">Score &amp; Tier</th>
                  <th className="px-2 text-left font-medium">Source / Canal</th>
                  <th className="px-2 text-left font-medium">Prochaine Action</th>
                  <th className="px-2 text-left font-medium">Date Prochain RDV</th>
                  <th className="px-2 text-left font-medium">Checklist (45-60m)</th>
                  <th className="pr-3.5 pl-2 text-right font-medium">Action Directe</th>
                </tr>
              </thead>
              <tbody>
                {triageLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400 text-xs font-mono">
                      Aucun lead ne correspond aux filtres de triage sélectionnés.
                    </td>
                  </tr>
                ) : (
                  triageLeads.map((lead) => {
                    const tier = lead.qualification_tier || (lead.qualification_score !== null && lead.qualification_score !== undefined ? (lead.qualification_score >= 70 ? 'A' : lead.qualification_score >= 45 ? 'B' : 'C') : null);
                    const score = lead.qualification_score ?? lead.ai_score ?? 0;
                    const checklistItems = Array.isArray(lead.intervention_checklist) ? lead.intervention_checklist : [];
                    const completedSteps = checklistItems.filter((i) => i.completed).length;

                    return (
                      <tr
                        key={lead.id}
                        onClick={() => router.push(`/leads/${lead.id}`)}
                        className="h-11 border-b border-mv-border last:border-0 hover:bg-black/[0.015] transition-colors cursor-pointer"
                      >
                        <td className="pl-3.5 pr-2 py-1.5">
                          <div className="font-semibold text-zinc-900 truncate max-w-[190px]">
                            {lead.company_name || lead.contact_name}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate max-w-[190px]">
                            {lead.contact_name} {lead.city ? `• ${lead.city}` : ''} {lead.pos_system ? `(${lead.pos_system})` : ''}
                          </div>
                        </td>

                        <td className="px-2 py-1.5 whitespace-nowrap">
                          {tier ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded text-[11px] font-bold font-mono',
                                  tier === 'A'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : tier === 'B'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                                )}
                              >
                                Tier {tier}
                              </span>
                              <span className="text-[11px] font-mono text-zinc-500" style={MONO}>
                                {score}/100
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-zinc-400 font-mono">Non scoré</span>
                          )}
                        </td>

                        <td className="px-2 py-1.5 whitespace-nowrap text-xs text-zinc-600">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[110px] capitalize font-mono text-[11px]">
                              {lead.utm_source || lead.source || 'Direct'}
                            </span>
                            {lead.gclid && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Ads
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                          {tier === 'A' ? (
                            <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-[11.5px]">
                              <Flame className="w-3 h-3 text-red-500 animate-pulse" />
                              Appel d&apos;urgence &lt;10m
                            </span>
                          ) : tier === 'B' ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-[11.5px]">
                              <Clock className="w-3 h-3 text-amber-500" />
                              Appel sous 1 heure
                            </span>
                          ) : (
                            <span className="text-zinc-500 text-[11.5px]">Email / Validation</span>
                          )}
                        </td>

                        <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                          {lead.call_at ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium font-mono text-[11px] border border-emerald-200"
                              style={MONO}
                            >
                              <Calendar className="w-3 h-3 text-emerald-600" />
                              {new Date(lead.call_at).toLocaleDateString('fr-CA', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-[11px] font-mono italic">À planifier</span>
                          )}
                        </td>

                        <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${checklistItems.length > 0 ? (completedSteps / checklistItems.length) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono text-zinc-500" style={MONO}>
                              {checklistItems.length > 0 ? `${completedSteps}/${checklistItems.length}` : '0/6'}
                            </span>
                          </div>
                        </td>

                        <td className="pr-3.5 pl-2 py-1.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {lead.contact_phone && (
                              <a
                                href={`tel:${lead.contact_phone}`}
                                className="p-1 rounded bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-700 transition-colors"
                                title={`Appeler ${lead.contact_name}`}
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => router.push(`/leads/${lead.id}`)}
                              className="px-2 py-0.5 rounded bg-mv-green/10 hover:bg-mv-green/20 text-mv-green font-semibold text-[11px] transition-colors"
                            >
                              Ouvrir
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
        </div>
      )}
      </TabTransition>

      {/* ── 5. Floating Bottom Batch Actions Bar ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 text-white rounded-lg shadow-xl px-4 py-2 flex items-center gap-3 border border-zinc-800 animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs font-semibold text-zinc-200">
            {selectedIds.size} prospect{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="h-4 w-px bg-zinc-700" />
          <button
            onClick={handleExportCsv}
            className="text-xs font-medium text-white hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter sélection CSV</span>
          </button>
          <div className="h-4 w-px bg-zinc-700" />
          <button
            onClick={handleBulkDelete}
            className="text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer la sélection</span>
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1"
            title="Désélectionner tout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <ReachSyncModal
        isOpen={isReachModalOpen}
        onClose={() => setIsReachModalOpen(false)}
        onSyncComplete={loadData}
      />
    </PageFadeIn>
  );
}

export default function LeadsCrmPage() {
  return (
    <Suspense fallback={<p className="text-xs text-zinc-400 text-center py-12 font-mono">Chargement du CRM…</p>}>
      <LeadsCrmContent />
    </Suspense>
  );
}
