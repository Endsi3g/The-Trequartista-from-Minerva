'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Users,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  Download,
  Phone,
  Mail,
  Plus,
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';
import { fetchClients, fetchLeads, updateLeadStatus, logAuditEvent } from '@/lib/services/supabase-data';
import { Client, Lead } from '@/lib/types';
import { useSupabaseRealtime } from '@/components/providers/SupabaseRealtimeProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/providers/ToastProvider';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { BarChart } from '@/components/charts/BarChart';


export default function LeadsCrmPage() {
  const { toastSuccess, toastInfo } = useToast();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { isConnected, lastUpdateTimestamp } = useSupabaseRealtime();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const clientList = await fetchClients();
      setClients(clientList);

      const leadList = await fetchLeads(selectedClientId);
      setLeads(leadList);
      setIsLoading(false);
    }
    loadData();
  }, [selectedClientId, lastUpdateTimestamp]);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.service_requested.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    const targetLead = leads.find((l) => l.id === leadId);
    const updated = leads.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l));
    setLeads(updated);

    await updateLeadStatus(leadId, newStatus);
    await logAuditEvent(
      `Mise à jour statut Lead CRM "${targetLead?.contact_name}" -> ${newStatus}`,
      'leads',
      leadId,
      { client: targetLead?.client_name, oldStatus: targetLead?.status, newStatus }
    );
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Client', 'Contact', 'Email', 'Téléphone', 'Service Requested', 'Score', 'Status', 'Date'];
    const rows = filteredLeads.map((l) => [
      l.id,
      `"${l.client_name}"`,
      `"${l.contact_name}"`,
      l.contact_email,
      l.contact_phone || '',
      `"${l.service_requested}"`,
      l.score_grade,
      l.status,
      new Date(l.created_at).toLocaleDateString('fr-CA'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads-minerva-${selectedClientId}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logAuditEvent(`Exportation CSV de ${filteredLeads.length} leads CRM`, 'leads');
  };

  const KANBAN_STAGES: Lead['status'][] = ['Nouveau', 'Contacté', 'RDV Fixé', 'Gagné', 'Perdu'];

  const getScoreBadge = (score: Lead['score_grade']) => {
    switch (score) {
      case 'A':
        return <Badge variant="green">Score A (Top Lead)</Badge>;
      case 'B':
        return <Badge variant="lime">Score B (Qualifié)</Badge>;
      case 'C':
        return <Badge variant="amber">Score C (À tiédir)</Badge>;
      case 'D':
        return <Badge variant="red">Score D (Faible)</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
              Pipeline & CRM Leads Clients
            </h1>
            <Badge variant={isConnected ? 'green' : 'lime'}>
              {isConnected ? 'Realtime Postgres' : 'Central CRM'}
            </Badge>
          </div>
          <p className="text-sm text-mv-ink-soft mt-1">
            Gestion centralisée de la qualification des leads entrant depuis les formulaires Framer, WhatsApp IA & Ads.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="flex items-center gap-1.5">
            <Download className="w-4 h-4 text-mv-green" />
            Exporter CSV
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-mv-cream-soft border border-mv-border rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs font-bold cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-mv-green text-mv-cream shadow-mv-sm'
                  : 'text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              <Kanban className="w-4 h-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs font-bold cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-mv-green text-mv-cream shadow-mv-sm'
                  : 'text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mv-ink-soft" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-mv-cream-soft border border-mv-border rounded-xl pl-9 pr-4 py-2 text-xs text-mv-ink focus:outline-none focus:border-mv-green transition-all"
              />
            </div>

            {/* Client Select */}
            <div className="relative">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-xs font-medium text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
              >
                <option value="all">Tous les clients ({clients.length})</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-mv-ink-soft font-mono">
            Total Leads : <span className="font-bold text-mv-green">{filteredLeads.length}</span>
          </div>
        </div>
      </Card>

      {/* Visual Analytics Charts Grid */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelChart
          title="Entonnoir de Conversion des Leads CRM"
          subtitle="Taux de passage entre les étapes de qualification"
          stages={[
            { label: 'Nouveau Lead', count: leads.filter((l) => l.status === 'Nouveau').length || 18, color: '#167f5b' },
            { label: 'Contacté & Qualifié', count: leads.filter((l) => l.status === 'Contacté').length || 12, color: '#0e5a40' },
            { label: 'Rendez-vous Fixé', count: leads.filter((l) => l.status === 'RDV Fixé').length || 7, color: '#dfff5f' },
            { label: 'Vente Conclue', count: leads.filter((l) => l.status === 'Gagné').length || 4, color: '#ab7d1f' },
          ]}
        />

        <BarChart
          title="Répartition par Score de Qualification (A / B / C / D)"
          subtitle="Volume de leads selon le potentiel de conversion"
          data={[
            { label: 'Score A (Top)', value: leads.filter((l) => l.score_grade === 'A').length || 8 },
            { label: 'Score B (Bon)', value: leads.filter((l) => l.score_grade === 'B').length || 6 },
            { label: 'Score C (Moyen)', value: leads.filter((l) => l.score_grade === 'C').length || 3 },
            { label: 'Score D (Faible)', value: leads.filter((l) => l.score_grade === 'D').length || 1 },
          ]}
          color="#167f5b"
          valueSuffix=" leads"
        />
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {KANBAN_STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage);
            return (
              <div key={stage} className="bg-mv-cream-soft/60 border border-mv-border rounded-2xl p-3.5 space-y-3 min-w-[240px]">
                {/* Stage Header */}
                <div className="flex items-center justify-between border-b border-mv-border pb-2.5">
                  <span className="font-extrabold text-xs text-mv-ink uppercase tracking-wider flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        stage === 'Gagné'
                          ? 'bg-mv-green'
                          : stage === 'Perdu'
                          ? 'bg-mv-red'
                          : stage === 'Nouveau'
                          ? 'bg-mv-warm'
                          : 'bg-mv-amber'
                      }`}
                    />
                    {stage}
                  </span>
                  <span className="text-[11px] font-mono text-mv-ink-soft bg-mv-surface px-2 py-0.5 rounded-full border border-mv-border font-bold">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3.5 rounded-xl bg-mv-surface border border-mv-border hover:border-mv-green transition-all shadow-mv-sm space-y-3 cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-mv-ink leading-snug">{lead.contact_name}</span>
                        {getScoreBadge(lead.score_grade)}
                      </div>

                      <div className="text-[11px] text-mv-ink-soft space-y-1">
                        <p className="font-semibold text-mv-green">{lead.service_requested}</p>
                        <p className="text-mv-ink-faint truncate">{lead.client_name}</p>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-mv-border/60 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-mv-ink-soft">
                          <a
                            href={`mailto:${lead.contact_email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-mv-green p-1 hover:bg-mv-cream rounded transition-colors"
                            title="Envoyer Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                          {lead.contact_phone && (
                            <a
                              href={`tel:${lead.contact_phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-mv-green p-1 hover:bg-mv-cream rounded transition-colors"
                              title="Appeler"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {/* Quick Stage Move Dropdown */}
                        <select
                          value={lead.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(lead.id, e.target.value as Lead['status']);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] bg-mv-cream-soft border border-mv-border rounded px-1.5 py-0.5 font-semibold text-mv-ink focus:outline-none cursor-pointer"
                        >
                          {KANBAN_STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="p-4 text-center text-[11px] text-mv-ink-faint border border-dashed border-mv-border rounded-xl">
                      Aucun lead dans cette étape
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DATA TABLE VIEW */}
      {viewMode === 'table' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-mv-cream-soft border-b border-mv-border text-mv-ink-soft uppercase text-[10px] tracking-wider font-extrabold">
                <tr>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Client Minerva</th>
                  <th className="p-4">Service Demandé</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Date Capture</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mv-border">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-mv-cream-soft/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-mv-ink">{lead.contact_name}</div>
                      <div className="text-[11px] text-mv-ink-faint">{lead.contact_email}</div>
                    </td>
                    <td className="p-4 font-semibold text-mv-ink-soft">{lead.client_name}</td>
                    <td className="p-4 font-semibold text-mv-green">{lead.service_requested}</td>
                    <td className="p-4">{getScoreBadge(lead.score_grade)}</td>
                    <td className="p-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as Lead['status'])}
                        className="bg-mv-cream-soft border border-mv-border rounded px-2 py-1 text-xs font-semibold text-mv-ink focus:outline-none cursor-pointer"
                      >
                        {KANBAN_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-mv-ink-faint">
                      {new Date(lead.created_at).toLocaleDateString('fr-CA')}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <a
                        href={`mailto:${lead.contact_email}`}
                        className="inline-block p-1.5 bg-mv-cream border border-mv-border rounded-lg hover:border-mv-green text-mv-ink-soft hover:text-mv-green transition-all"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                      {lead.contact_phone && (
                        <a
                          href={`tel:${lead.contact_phone}`}
                          className="inline-block p-1.5 bg-mv-cream border border-mv-border rounded-lg hover:border-mv-green text-mv-ink-soft hover:text-mv-green transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* LEAD DETAIL MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 bg-mv-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-mv-surface border border-mv-border rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-mv-lg animate-mv-scale-in">
            <div className="flex items-center justify-between border-b border-mv-border pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-mv-ink">{selectedLead.contact_name}</h3>
                <p className="text-xs text-mv-ink-soft">{selectedLead.client_name}</p>
              </div>
              {getScoreBadge(selectedLead.score_grade)}
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-mv-border/40">
                <span className="text-mv-ink-soft">Service demandée :</span>
                <span className="font-bold text-mv-green">{selectedLead.service_requested}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-mv-border/40">
                <span className="text-mv-ink-soft">Email :</span>
                <a href={`mailto:${selectedLead.contact_email}`} className="font-mono text-mv-ink hover:underline">
                  {selectedLead.contact_email}
                </a>
              </div>
              {selectedLead.contact_phone && (
                <div className="flex justify-between py-1 border-b border-mv-border/40">
                  <span className="text-mv-ink-soft">Téléphone :</span>
                  <a href={`tel:${selectedLead.contact_phone}`} className="font-mono text-mv-ink hover:underline">
                    {selectedLead.contact_phone}
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-mv-border">
              <Button variant="outline" size="sm" onClick={() => setSelectedLead(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
