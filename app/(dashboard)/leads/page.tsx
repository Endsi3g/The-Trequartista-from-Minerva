'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { KanbanBoard } from '@/components/crm/KanbanBoard';
import { LeadDetailDrawer } from '@/components/crm/LeadDetailDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { fetchClients, fetchLeads, addLead } from '@/lib/services/supabase-data';
import type { Client, Lead, LeadStage } from '@/lib/types';
import { useSupabaseRealtime } from '@/components/providers/SupabaseRealtimeProvider';

export default function LeadsCrmPage() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // New Lead Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(searchParams.get('new') === '1');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newService, setNewService] = useState('Gestion Réseaux & Reels');
  const [newMrr, setNewMrr] = useState<number>(1500);
  const [newOneTime, setNewOneTime] = useState<number>(500);

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

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactEmail.trim()) return;

    await addLead({
      client_name: newCompanyName || newContactName,
      company_name: newCompanyName,
      contact_name: newContactName || newContactEmail.split('@')[0],
      contact_email: newContactEmail.trim(),
      contact_phone: newContactPhone,
      service_requested: newService,
      score_grade: 'A',
      status: 'Nouveau',
      stage: 'nouveau',
      mrr_value: newMrr,
      one_time_value: newOneTime,
      probability_pct: 10,
      notes: [],
    });

    setIsAddModalOpen(false);
    setNewCompanyName('');
    setNewContactName('');
    setNewContactEmail('');
    setNewContactPhone('');
    loadData();
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Société', 'Contact', 'Email', 'Téléphone', 'Service', 'Étape', 'MRR ($)', 'Setup ($)', 'Date'];
    const rows = filteredLeads.map((l) => [
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
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
              Pipeline & CRM Leads
            </h1>
            <Badge variant={isConnected ? 'green' : 'lime'}>
              {isConnected ? 'Realtime Postgres' : 'Central CRM'}
            </Badge>
          </div>
          <p className="text-xs text-mv-ink-soft mt-1">
            Gestion Kanban interactif du pipeline de ventes avec calcul automatisé du MRR et conversion client.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#00a800] hover:bg-[#009000] text-white text-xs font-bold rounded-xl shadow-mv-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nouveau Lead</span>
          </button>

          <Button variant="outline" size="sm" onClick={handleExportCsv} className="flex items-center gap-1.5">
            <Download className="w-4 h-4 text-mv-green" />
            Exporter CSV
          </Button>

          {/* View Toggle */}
          <div className="flex items-center bg-white border border-mv-border rounded-xl p-1 shadow-mv-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-[#00a800] text-white shadow-mv-sm'
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
                  ? 'bg-[#00a800] text-white shadow-mv-sm'
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
        <div className="bg-white border border-mv-border rounded-2xl p-5 shadow-mv-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-mv-ink-soft uppercase tracking-wider">Valeur Brute Pipeline</p>
            <p className="text-2xl font-extrabold text-mv-ink font-display mt-0.5">${Math.round(totalGrossPipeline).toLocaleString()}</p>
            <span className="text-[10px] font-semibold text-mv-green">${totalPipelineMrr.toLocaleString()}/mo MRR</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-mv-green-tint text-mv-green flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-mv-border rounded-2xl p-5 shadow-mv-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-mv-ink-soft uppercase tracking-wider">Prévisionnel Pondéré</p>
            <p className="text-2xl font-extrabold text-mv-ink font-display mt-0.5">${Math.round(weightedForecastValue).toLocaleString()}</p>
            <span className="text-[10px] font-semibold text-mv-ink-soft">Basé sur % de fermeture</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-mv-border rounded-2xl p-5 shadow-mv-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-mv-ink-soft uppercase tracking-wider">Taux de Conversion</p>
            <p className="text-2xl font-extrabold text-mv-ink font-display mt-0.5">{winRatePct}%</p>
            <span className="text-[10px] font-semibold text-mv-green">{wonLeadsCount} deals gagnés</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-mv-border rounded-2xl p-5 shadow-mv-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-mv-ink-soft uppercase tracking-wider">Leads Actifs</p>
            <p className="text-2xl font-extrabold text-mv-ink font-display mt-0.5">{filteredLeads.length}</p>
            <span className="text-[10px] font-semibold text-mv-ink-soft">En cours d&apos;échange</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Toolbar Search & Filters ── */}
      <div className="bg-white border border-mv-border rounded-2xl p-4 shadow-mv-sm flex flex-col sm:flex-row items-center justify-between gap-4">
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
      {viewMode === 'kanban' ? (
        <KanbanBoard
          leads={filteredLeads}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onLeadsUpdated={loadData}
        />
      ) : (
        <div className="bg-white border border-mv-border rounded-2xl overflow-hidden shadow-mv-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-mv-surface border-b border-mv-border text-mv-ink-soft uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-3.5 px-4">Société / Contact</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Étape</th>
                  <th className="py-3.5 px-4">MRR ($)</th>
                  <th className="py-3.5 px-4">Frais Setup ($)</th>
                  <th className="py-3.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mv-border">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-mv-surface/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-mv-ink">{lead.company_name || lead.client_name || lead.contact_name}</p>
                      <p className="text-[11px] text-mv-ink-soft">{lead.contact_email}</p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-mv-green">{lead.service_requested}</td>
                    <td className="py-3.5 px-4 font-bold capitalize text-mv-ink">{lead.stage || lead.status}</td>
                    <td className="py-3.5 px-4 font-extrabold text-mv-ink">${(lead.mrr_value || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-semibold text-mv-ink-soft">${(lead.one_time_value || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-mv-ink-faint">{new Date(lead.created_at).toLocaleDateString('fr-CA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Slide-Out Lead Detail Drawer ── */}
      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onLeadUpdated={loadData}
      />

      {/* ── New Lead Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-mv-ink/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-mv-border rounded-2xl p-6 max-w-md w-full shadow-mv-lg animate-mv-scale-in relative space-y-5">
            <div className="flex items-center justify-between border-b border-mv-border pb-3">
              <h3 className="text-lg font-extrabold text-mv-ink font-display">Nouveau Lead CRM</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-mv-ink-soft hover:text-mv-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-mv-ink">Nom de l&apos;entreprise</label>
                <input
                  type="text"
                  placeholder="ex: Apex Roofing Studio"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-mv-border rounded-xl text-xs text-mv-ink focus:ring-2 focus:ring-mv-green/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-mv-ink">Nom Contact</label>
                  <input
                    type="text"
                    placeholder="Jean Dupont"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-mv-border rounded-xl text-xs text-mv-ink focus:ring-2 focus:ring-mv-green/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-mv-ink">Email Contact</label>
                  <input
                    type="email"
                    required
                    placeholder="jean@apex.com"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-mv-border rounded-xl text-xs text-mv-ink focus:ring-2 focus:ring-mv-green/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-mv-ink">MRR Estimé ($)</label>
                  <input
                    type="number"
                    value={newMrr}
                    onChange={(e) => setNewMrr(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-mv-border rounded-xl text-xs text-mv-ink focus:ring-2 focus:ring-mv-green/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-mv-ink">Setup Fee ($)</label>
                  <input
                    type="number"
                    value={newOneTime}
                    onChange={(e) => setNewOneTime(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-mv-border rounded-xl text-xs text-mv-ink focus:ring-2 focus:ring-mv-green/30"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-mv-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-mv-surface border border-mv-border text-xs font-bold rounded-xl text-mv-ink"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00a800] hover:bg-[#009000] text-white text-xs font-bold rounded-xl shadow-mv-sm transition-all"
                >
                  Créer Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
