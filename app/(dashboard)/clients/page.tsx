'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { Users, Plus, TrendingUp, DollarSign, ExternalLink, Download, X } from 'lucide-react';
import { fetchClients } from '@/lib/services/supabase-data';
import { Client } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { StatusDot } from '@/components/ui/status-dot';

const STATUS_TABS: { key: Client['status'] | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'Active', label: 'Actifs' },
  { key: 'Onboarding', label: 'Onboarding' },
  { key: 'Paused', label: 'En pause' },
  { key: 'Archived', label: 'Archivés' },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<Client['status'] | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchClients();
        setClients(data);
      } catch (err) {
        console.warn('[Clients] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalMrr = clients.reduce((acc, c) => acc + c.mrr, 0);

  const visibleClients = useMemo(
    () => (statusTab === 'all' ? clients : clients.filter((c) => c.status === statusTab)),
    [clients, statusTab]
  );

  const allVisibleSelected = visibleClients.length > 0 && visibleClients.every((c) => selected.has(c.id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        visibleClients.forEach((c) => next.delete(c.id));
        return next;
      }
      const next = new Set(prev);
      visibleClients.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportSelected = () => {
    const rows = clients.filter((c) => selected.has(c.id));
    const headers = ['Entreprise', 'Secteur', 'MRR ($)', 'Statut', 'Santé', 'Contact', 'Courriel'];
    const csvRows = rows.map((c) => [
      `"${c.name}"`,
      `"${c.industry}"`,
      c.mrr,
      c.status,
      c.health_status,
      `"${c.contact_name}"`,
      c.contact_email,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `clients-minerva-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageFadeIn className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Répertoire Clients & Suivi MRR
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Cliquez sur un client pour voir sa fiche complète ; utilisez « Suivi ROI » pour consulter ses performances ou l'inviter sur son portail.
          </p>
        </div>

        <Link href="/clients/new">
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
            Nouveau Client
          </Button>
        </Link>
      </div>

      {/* 3 Summary StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Clients Actifs"
          value={loading ? '...' : clients.length}
          subtitle="Abonnements actifs"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="MRR Total Sous Gestion"
          value={loading ? '...' : `${totalMrr.toLocaleString('fr-CA')} $`}
          subtitle="Revenu récurrent mensuel"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Moyenne MRR / Client"
          value={loading || clients.length === 0 ? '...' : `${Math.round(totalMrr / clients.length).toLocaleString('fr-CA')} $`}
          subtitle="Valeur moyenne de contrat"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Client List Table */}
      <Card
        header={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
              Portefeuille Clients Minerva
            </h3>
            <div className="flex items-center gap-1 bg-mv-cream-soft border border-mv-border rounded-xl p-1 overflow-x-auto">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all text-xs font-bold cursor-pointer ${
                    statusTab === tab.key ? 'bg-mv-surface text-mv-ink shadow-mv-sm border border-mv-border' : 'text-mv-ink-soft hover:text-mv-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        }
      >
        {/* Bulk selection bar */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between gap-3 -mx-6 -mt-2 mb-3 px-6 py-2.5 bg-mv-green-tint border-y border-mv-green/20">
            <span className="text-xs font-bold text-mv-green">
              {selected.size} client{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportSelected} className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Exporter CSV
              </Button>
              <button
                onClick={() => setSelected(new Set())}
                className="p-1.5 rounded-lg text-mv-ink-faint hover:bg-mv-surface hover:text-mv-ink transition-colors cursor-pointer"
                title="Désélectionner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="h-4 shimmer-bg rounded w-3/4 mx-auto animate-mv-shimmer" />
            <div className="h-4 shimmer-bg rounded w-1/2 mx-auto animate-mv-shimmer" />
          </div>
        ) : visibleClients.length === 0 ? (
          <div className="p-8 text-center text-xs text-mv-ink-soft">
            {clients.length === 0
              ? 'Aucun client enregistré. Cliquez sur "Nouveau Client" pour ajouter votre premier contrat.'
              : 'Aucun client dans cette catégorie.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-mv-border text-mv-ink-soft uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      className="w-3.5 h-3.5 rounded border-mv-border text-mv-green focus:ring-mv-green/30 cursor-pointer"
                    />
                  </th>
                  <th className="pb-3 font-semibold">Entreprise</th>
                  <th className="pb-3 font-semibold">Secteur d'Activité</th>
                  <th className="pb-3 font-semibold">MRR Mensuel</th>
                  <th className="pb-3 font-semibold">Statut & Santé</th>
                  <th className="pb-3 font-semibold">Contact Principal</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mv-border/40">
                {visibleClients.map((client) => (
                  <tr key={client.id} className={`transition-colors ${selected.has(client.id) ? 'bg-mv-green-tint/40' : 'hover:bg-mv-cream-soft/40'}`}>
                    <td className="py-4 pr-2">
                      <input
                        type="checkbox"
                        checked={selected.has(client.id)}
                        onChange={() => toggleOne(client.id)}
                        className="w-3.5 h-3.5 rounded border-mv-border text-mv-green focus:ring-mv-green/30 cursor-pointer"
                      />
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={client.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(client.name)}&backgroundColor=1c9a6f&fontColor=ffffff`}
                          alt={client.name}
                          className="w-9 h-9 rounded-lg object-cover border border-mv-border shrink-0"
                        />
                        <div>
                          <Link href={`/clients/${client.id}`} className="font-bold text-mv-ink text-sm hover:text-mv-green transition-colors">
                            {client.name}
                          </Link>
                          <div className="text-[11px] text-mv-ink-soft">Réf: {client.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="font-semibold text-mv-ink">{client.industry}</span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="font-mono font-bold text-mv-green text-sm">{client.mrr.toLocaleString('fr-CA')} $</span>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-mv-ink">
                          <StatusDot active={client.status === 'Active'} />
                          {client.status}
                        </span>
                        <span className="text-[10px] text-mv-ink-soft pl-3.5">{client.health_status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-mv-ink font-semibold">{client.contact_name}</div>
                      <div className="text-[11px] text-mv-ink-soft">{client.contact_email}</div>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <Link href={`/clients/${client.id}/roi-tracker`}>
                        <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                          Suivi ROI
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageFadeIn>
  );
}
