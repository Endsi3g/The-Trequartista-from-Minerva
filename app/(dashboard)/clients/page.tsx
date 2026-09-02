'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  TrendingUp,
  DollarSign,
  ExternalLink,
  Download,
  X,
  Search,
} from 'lucide-react';
import { fetchClients } from '@/lib/services/supabase-data';
import { SkeletonRows } from '@/components/ui/skeleton';
import type { Client } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const STATUS_TABS: { key: Client['status'] | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'Active', label: 'Actifs' },
  { key: 'Onboarding', label: 'Onboarding' },
  { key: 'Paused', label: 'En pause' },
  { key: 'Archived', label: 'Archivés' },
];

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<Client['status'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const totalMrr = clients.reduce((acc, c) => acc + (c.mrr || 0), 0);
  const activeClients = clients.filter((c) => c.status === 'Active');
  const avgMrr = activeClients.length > 0 ? Math.round(totalMrr / activeClients.length) : 0;

  const q = searchQuery.toLowerCase().trim();
  const visibleClients = useMemo(() => {
    return clients.filter((c) => {
      const matchStatus = statusTab === 'all' || c.status === statusTab;
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.industry || '').toLowerCase().includes(q) ||
        (c.contact_name || '').toLowerCase().includes(q) ||
        (c.contact_email || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [clients, statusTab, q]);

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

  const toggleOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      `"${c.industry || ''}"`,
      c.mrr || 0,
      c.status,
      c.health_status,
      `"${c.contact_name || ''}"`,
      c.contact_email || '',
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
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ── 1. Compact Header Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">
              Clients & Revenus
            </h1>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              ({clients.length} contrat{clients.length > 1 ? 's' : ''})
            </span>
          </div>
        </div>

        <Link
          href="/clients/new"
          className="h-7 px-3 rounded-[4px] bg-mv-green hover:bg-emerald-700 text-white text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nouveau Client</span>
        </Link>
      </div>

      {/* ── 2. Unified 3-KPI Continuous Ribbon ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-mv-border">
          {/* Cell 1: Clients Actifs */}
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                Clients Actifs
              </span>
              <Users className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                {loading ? '—' : <AnimatedNumber value={activeClients.length} />}
              </div>
              <div className="text-[11px] text-mv-ink-faint truncate ml-2" style={MONO}>
                Capacité : {activeClients.length} sous contrat
              </div>
            </div>
          </div>

          {/* Cell 2: MRR Total Sous Gestion */}
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                MRR Total Sous Gestion
              </span>
              <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                {loading ? '—' : `${totalMrr.toLocaleString('fr-CA')} $`}
              </div>
              <div className="text-[11px] text-mv-green truncate ml-2 font-medium" style={MONO}>
                ARR : {(totalMrr * 12).toLocaleString('fr-CA')} $
              </div>
            </div>
          </div>

          {/* Cell 3: Moyenne MRR / Client */}
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                Moyenne MRR / Client
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                {loading ? '—' : `${avgMrr.toLocaleString('fr-CA')} $`}
              </div>
              <div className="text-[11px] text-mv-ink-faint truncate ml-2" style={MONO}>
                MoM : +0.0%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. High-Density Clients DataTable Container ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2 border-b border-mv-border bg-black/[0.01]">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {STATUS_TABS.map((tab) => {
              const count = tab.key === 'all' ? clients.length : clients.filter((c) => c.status === tab.key).length;
              const isSelected = statusTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusTab(tab.key)}
                  className={cn(
                    'px-2 py-1 rounded-[4px] text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
                    isSelected
                      ? 'bg-white text-zinc-900 shadow-2xs font-semibold border border-mv-border'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.02]'
                  )}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search Input */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer par client, secteur... (/)"
              className="h-7 pl-7 pr-2 text-[11.5px] rounded-[4px] border border-mv-border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-mv-green w-52 sm:w-60 transition-colors"
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
        </div>

        {/* Table Content */}
        {loading ? (
          <SkeletonRows count={6} />
        ) : visibleClients.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-700">Aucun client trouvé</p>
              <p className="text-[11px] text-zinc-400">Modifiez vos critères de recherche ou ajoutez un nouveau client.</p>
            </div>
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mv-green hover:bg-mv-green/90 text-white text-[11.5px] font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un client</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <table className="hidden sm:table w-full text-[12.5px] border-collapse">
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
                  <th className="px-2 text-left font-medium">Entreprise</th>
                  <th className="px-2 text-left font-medium">Secteur</th>
                  <th className="px-2 text-right font-medium">MRR Mensuel</th>
                  <th className="px-2 text-left font-medium">Statut & Santé</th>
                  <th className="px-2 text-left font-medium hidden md:table-cell">Contact</th>
                  <th className="pr-3.5 pl-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleClients.map((client) => {
                  const isSelected = selected.has(client.id);
                  const isAtRisk = client.health_status === 'At Risk';
                  return (
                    <tr
                      key={client.id}
                      onClick={() => router.push(`/clients/${client.id}`)}
                      className={cn(
                        'h-10 border-b border-mv-border last:border-0 transition-colors cursor-pointer',
                        isSelected ? 'bg-emerald-50/40' : 'hover:bg-black/[0.02]'
                      )}
                    >
                      <td className="pl-3.5 pr-2 py-1.5" onClick={(e) => toggleOne(client.id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded border-mv-border text-mv-green focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="px-2 py-1.5 min-w-0 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-[3px] bg-zinc-100 border border-mv-border flex items-center justify-center text-[9.5px] font-semibold text-zinc-900 shrink-0">
                            {getInitials(client.name)}
                          </div>
                          <span className="font-semibold text-zinc-900 truncate" title={`Réf: ${client.id.slice(0, 8)}`}>
                            {client.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-[3px] bg-zinc-100/90 text-zinc-700 text-[10.5px] font-medium border border-zinc-200/50">
                          {client.industry || 'Général'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono font-semibold text-zinc-900 whitespace-nowrap" style={MONO}>
                        {(client.mrr || 0).toLocaleString('fr-CA')} $ <span className="text-[10px] text-zinc-400 font-normal">/ mo</span>
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full shrink-0',
                              client.status === 'Active'
                                ? isAtRisk
                                ? 'bg-amber-500'
                                : 'bg-mv-green'
                                : client.status === 'Paused'
                                ? 'bg-amber-500'
                                : 'bg-zinc-400'
                            )}
                          />
                          <span className="text-[11.5px] font-medium text-zinc-700">
                            {client.status} · {client.health_status || 'On Track'}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-[11.5px] text-zinc-600 truncate max-w-[160px] hidden md:table-cell">
                        <span className="font-medium text-zinc-800">{client.contact_name || '—'}</span>
                      </td>
                      <td className="pr-3.5 pl-2 py-1.5 text-right whitespace-nowrap">
                        <Link
                          href={`/clients/${client.id}/roi-tracker`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-mv-green hover:underline"
                        >
                          <span>Suivi ROI</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Stacked Cards View (< 640px) */}
            <div className="block sm:hidden divide-y divide-mv-border">
              {visibleClients.map((client) => {
                const isSelected = selected.has(client.id);
                const isAtRisk = client.health_status === 'At Risk';
                return (
                  <div
                    key={client.id}
                    onClick={() => router.push(`/clients/${client.id}`)}
                    className={cn(
                      'p-3.5 space-y-2.5 transition-colors cursor-pointer',
                      isSelected ? 'bg-emerald-50/40' : 'active:bg-black/[0.03]'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-xs font-bold text-zinc-900 shrink-0">
                          {getInitials(client.name)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 truncate">{client.name}</h4>
                          <span className="text-[10.5px] text-zinc-500 truncate block">{client.industry || 'Restauration'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-mv-green font-mono block" style={MONO}>
                          {(client.mrr || 0).toLocaleString('fr-CA')} $
                        </span>
                        <span className="text-[10px] text-zinc-400">/ mois</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-mv-border/40 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            client.status === 'Active'
                              ? isAtRisk
                                ? 'bg-amber-500'
                                : 'bg-mv-green'
                              : 'bg-zinc-400'
                          )}
                        />
                        <span className="text-zinc-600 font-medium">
                          {client.status} ({client.health_status || 'Stable'})
                        </span>
                      </div>

                      <Link
                        href={`/clients/${client.id}/roi-tracker`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-mv-green font-semibold inline-flex items-center gap-1 text-[11px]"
                      >
                        <span>Portail ROI</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── 4. Floating Bottom Batch Actions Bar ── */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 text-white rounded-lg shadow-xl px-4 py-2 flex items-center gap-3 border border-zinc-800 animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs font-semibold text-zinc-200">
            {selected.size} client{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
          </span>
          <div className="h-4 w-px bg-zinc-700" />
          <button
            onClick={handleExportSelected}
            className="text-xs font-medium text-white hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>
          <button
            onClick={() => setSelected(new Set())}
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
