'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KanbanBoard } from '@/components/crm/KanbanBoard';
import { PageFadeIn } from '@/components/ui/page-transition';
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
} from 'lucide-react';
import { fetchClients, fetchLeads } from '@/lib/services/supabase-data';
import type { Client, Lead, LeadStage } from '@/lib/types';
import { useSupabaseRealtime } from '@/components/providers/SupabaseRealtimeProvider';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

function LeadsCrmContent() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
          </div>

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
      {viewMode === 'kanban' ? (
        <KanbanBoard
          leads={filteredLeads}
          onSelectLead={(lead) => router.push(`/leads/${lead.id}`)}
          onLeadsUpdated={loadData}
        />
      ) : (
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
                <th className="px-2 text-left font-medium">Service</th>
                <th className="px-2 text-left font-medium">Étape Pipeline</th>
                <th className="px-2 text-right font-medium">Valeur ($)</th>
                <th className="px-2 text-left font-medium">Contact & Courriel</th>
                <th className="pr-3.5 pl-2 text-right font-medium">Date</th>
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
                      {lead.company_name || lead.contact_name}
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
                    <td className="pr-3.5 pl-2 py-1 text-right text-[10.5px] text-zinc-400 font-mono whitespace-nowrap" style={MONO}>
                      {new Date(lead.created_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1"
            title="Désélectionner tout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
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
