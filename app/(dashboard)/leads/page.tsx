'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { KanbanBoard } from '@/components/crm/KanbanBoard';
import { LeadDetailDrawer } from '@/components/crm/LeadDetailDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonCards } from '@/components/ui/skeleton-rows';
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
  CheckCircle2,
  X,
} from 'lucide-react';
import { fetchClients, fetchLeads } from '@/lib/services/supabase-data';
import type { Client, Lead } from '@/lib/types';
import { useSupabaseRealtime } from '@/components/providers/SupabaseRealtimeProvider';
import { StatusDot } from '@/components/ui/status-dot';

function LeadsCrmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { isConnected, lastUpdateTimestamp } = useSupabaseRealtime();

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

  // Deep-link support: /leads?leadId=... (e.g. from a client's detail page)
  // opens that lead's drawer directly once it's loaded.
  useEffect(() => {
    const targetId = searchParams.get('leadId');
    if (!targetId || leads.length === 0) return;
    const target = leads.find((l) => l.id === targetId);
    if (target) {
      setSelectedLead(target);
      router.replace(pathname);
    }
  }, [searchParams, leads, router, pathname]);

  const filteredLeads = leads.filter((lead) => {
    const query = searchQuery.toLowerCase();
    return (
      (lead.company_name || '').toLowerCase().includes(query) ||
      lead.contact_name.toLowerCase().includes(query) ||
      lead.contact_email.toLowerCase().includes(query) ||
      lead.service_requested.toLowerCase().includes(query) ||
      lead.client_name.toLowerCase().includes(query)
    );
  });

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
  const activeLeadsCount = filteredLeads.filter(
    (l) => l.status !== 'Gagné' && l.status !== 'Perdu' && l.stage !== 'gagne' && l.stage !== 'perdu'
  ).length;

  const allVisibleSelected = filteredLeads.length > 0 && filteredLeads.every((l) => selectedIds.has(l.id));

  const toggleAllSelected = () => {
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

  const toggleOneSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportCsv = (subset?: Lead[]) => {
    const headers = ['ID', 'Société', 'Contact', 'Email', 'Téléphone', 'Service', 'Étape', 'MRR ($)', 'Setup ($)', 'Date'];
    const rows = (subset || filteredLeads).map((l) => [
      l.id,
      `"${l.company_name || l.client_name}"`,
      `"${l.contact_name}"`,
      l.contact_email,
      l.contact_phone || '',
      `"${l.service_requested}"`,
      l.stage || l.status,
      l.mrr_value || 0,
      l.one_time_value || 0,
      new Date(l.created_at).toLocaleDateString('fr-CA'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads-minerva-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageFadeIn className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
              Pipeline & CRM Leads
            </h1>
            <Badge variant={isConnected ? 'green' : 'lime'}>
              {isConnected ? 'Synchronisé en direct' : 'CRM central'}
            </Badge>
          </div>
          <p className="text-xs text-mv-ink-soft mt-1">
            Glissez une carte d'une colonne à l'autre pour faire avancer un lead ; cliquez dessus pour voir ses détails et le convertir en client.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-3">
          <Link
            href="/leads/new"
            className="px-4 py-2 bg-mv-green hover:bg-mv-green-dark text-white text-xs font-bold rounded-xl shadow-mv-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nouveau Lead</span>
          </Link>

          <Button variant="outline" size="sm" onClick={() => handleExportCsv()} className="flex items-center gap-1.5">
            <Download className="w-4 h-4 text-mv-green" />
            Exporter CSV
          </Button>

          {/* View Toggle */}
          <div className="flex items-center bg-mv-surface border border-mv-border rounded-xl p-1 shadow-mv-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-mv-green text-white shadow-mv-sm'
                  : 'text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-mv-green text-white shadow-mv-sm'
                  : 'text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Financial Analytics Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 shadow-mv-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-mv-ink-soft uppercase tracking-wider">Valeur Brute Pipeline</p>
            <p className="text-2xl font-extrabold text-mv-ink font-display mt-0.5">{Math.round(totalGrossPipeline).toLocaleString('fr-CA')} $</p>
            <span className="text-[10px] font-semibold text-mv-green">{totalPipelineMrr.toLocaleString('fr-CA')} $/mois MRR</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-mv-green-tint text-mv-green flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 shadow-mv-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-mv-ink-soft uppercase tracking-wider">Prévisionnel Pondéré</p>
            <p className="text-2xl font-extrabold text-mv-ink font-display mt-0.5">{Math.round(weightedForecastValue).toLocaleString('fr-CA')} $</p>
            <span className="text-[10px] font-semibold text-mv-ink-soft">Basé sur % de fermeture</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-mv-amber-bg text-mv-amber border border-mv-amber/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 shadow-mv-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-mv-ink-soft uppercase tracking-wider">Taux de Conversion</p>
            <p className="text-2xl font-extrabold text-mv-ink font-display mt-0.5">{winRatePct}%</p>
            <span className="text-[10px] font-semibold text-mv-green">{wonLeadsCount} deals gagnés</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-mv-green-tint text-mv-green border border-mv-green/30 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 shadow-mv-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-mv-ink-soft uppercase tracking-wider">Leads Actifs</p>
            <p className="text-2xl font-extrabold text-mv-ink font-display mt-0.5">{activeLeadsCount}</p>
            <span className="text-[10px] font-semibold text-mv-ink-soft">En cours d&apos;échange</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Toolbar Search & Filters ── */}
      <div className="bg-mv-surface border border-mv-border rounded-2xl p-4 shadow-mv-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-mv-ink-soft" />
          <input
            type="text"
            placeholder="Rechercher société, contact, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-mv-surface border border-mv-border rounded-xl pl-9 pr-4 py-2 text-xs text-mv-ink placeholder-mv-ink-mute focus:ring-2 focus:ring-mv-green/30 focus:border-mv-green"
          />
        </div>

        <div className="text-xs text-mv-ink-soft font-semibold">
          Affichage de <span className="font-bold text-mv-ink">{filteredLeads.length}</span> prospect(s)
        </div>
      </div>

      {/* ── Main View (Kanban vs Table) ── */}
      {isLoading ? (
        <SkeletonCards count={6} />
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          leads={filteredLeads}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onLeadsUpdated={loadData}
        />
      ) : (
        <div className="bg-mv-surface border border-mv-border rounded-2xl overflow-hidden shadow-mv-sm">
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-mv-green-tint border-b border-mv-green/20">
              <span className="text-xs font-bold text-mv-green">
                {selectedIds.size} lead{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCsv(filteredLeads.filter((l) => selectedIds.has(l.id)))}
                  className="flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Exporter la sélection
                </Button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="p-1.5 rounded-lg text-mv-ink-faint hover:bg-mv-surface hover:text-mv-ink transition-colors cursor-pointer"
                  title="Désélectionner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-mv-surface border-b border-mv-border text-mv-ink-soft uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-3.5 pl-4 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllSelected}
                      className="w-3.5 h-3.5 rounded border-mv-border text-mv-green focus:ring-mv-green/30 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Société / Contact</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Étape</th>
                  <th className="py-3.5 px-4">MRR ($)</th>
                  <th className="py-3.5 px-4">Frais Setup ($)</th>
                  <th className="py-3.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mv-border">
                {filteredLeads.map((lead) => {
                  const won = lead.status === 'Gagné' || lead.stage === 'gagne';
                  return (
                    <tr
                      key={lead.id}
                      className={`transition-colors ${selectedIds.has(lead.id) ? 'bg-mv-green-tint/40' : 'hover:bg-mv-surface/60'}`}
                    >
                      <td className="py-3.5 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(lead.id)}
                          onChange={() => toggleOneSelected(lead.id)}
                          className="w-3.5 h-3.5 rounded border-mv-border text-mv-green focus:ring-mv-green/30 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                        <p className="font-bold text-mv-ink">{lead.company_name || lead.client_name || lead.contact_name}</p>
                        <p className="text-[11px] text-mv-ink-soft">{lead.contact_email}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-mv-green cursor-pointer" onClick={() => setSelectedLead(lead)}>
                        {lead.service_requested}
                      </td>
                      <td className="py-3.5 px-4 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                        <span className="inline-flex items-center gap-1.5 font-bold capitalize text-mv-ink">
                          <StatusDot active={won} />
                          {lead.stage || lead.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-mv-ink cursor-pointer" onClick={() => setSelectedLead(lead)}>
                        {(lead.mrr_value || 0).toLocaleString('fr-CA')} $
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-mv-ink-soft cursor-pointer" onClick={() => setSelectedLead(lead)}>
                        {(lead.one_time_value || 0).toLocaleString('fr-CA')} $
                      </td>
                      <td className="py-3.5 px-4 text-mv-ink-faint cursor-pointer" onClick={() => setSelectedLead(lead)}>
                        {new Date(lead.created_at).toLocaleDateString('fr-CA')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Slide-Out Lead Detail Drawer ── */}
      <LeadDetailDrawer
        key={selectedLead?.id}
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onLeadUpdated={loadData}
      />

    </PageFadeIn>
  );
}

export default function LeadsCrmPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-mv-ink-soft">Chargement…</div>}>
      <LeadsCrmContent />
    </Suspense>
  );
}
