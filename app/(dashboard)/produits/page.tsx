'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Rocket,
  Plus,
  Trash2,
  CalendarDays,
  User as UserIcon,
  Sparkles,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Zap,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  Tag,
  Building2,
  MessageSquare,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useFeatureRequests } from '@/hooks/use-feature-requests';
import {
  fetchMinervaRoadmap,
  addMinervaRoadmapItem,
  updateMinervaRoadmapStatus,
  deleteMinervaRoadmapItem,
} from '@/lib/services/supabase-data';
import type { MinervaRoadmapItem, FeatureRequest, FeatureRequestStatus, FeatureRequestRepo } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const PRODUCT_GROUPS: { key: string; label: string; products: string[] }[] = [
  { key: 'reach', label: 'REACH', products: ['Reach', 'Prospection', 'Acquisition'] },
  { key: 'ops', label: 'OPS', products: ['Operations', 'Ops', 'Partenariats'] },
  { key: 'marketing', label: 'MARKETING', products: ['Marketing', 'YouTube', 'Content'] },
  { key: 'flow_trequartista', label: 'FLOW & TREQUARTISTA', products: ['Minerva-Flow', 'Minerva Trequartista', 'Flow', 'Trequartista'] },
  { key: 'labs', label: 'LABS & RECHERCHE', products: ['Atlas', 'Forge', 'Ascend', 'Recherche', 'IA'] },
];

const STATUS_CONFIG_MAP: Record<
  MinervaRoadmapItem['status'],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  completed: { label: 'Terminé', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  in_progress: { label: 'En cours', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  planned: { label: 'Planifié', bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200', dot: 'bg-zinc-400' },
  blocked: { label: 'Bloqué', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

const CLIENT_STATUS_OPTIONS: { status: FeatureRequestStatus; label: string; bg: string; text: string; border: string }[] = [
  { status: 'delivered', label: '✓ Livré', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { status: 'in_progress', label: '⚙️ En dév.', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  { status: 'planned', label: '⏱ Planifié', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  { status: 'under_review', label: '👁 En revue', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { status: 'declined', label: '✕ Refusé', bg: 'bg-zinc-100', text: 'text-zinc-500', border: 'border-zinc-200' },
];

export default function ProduitsMinervaPage() {
  const { role, loading: userLoading } = useCurrentUser();
  const confirmDialog = useConfirm();
  const { toastError, toastSuccess, toastInfo } = useToast();

  const [activeTab, setActiveTab] = useState<'roadmap' | 'feature_requests'>('roadmap');

  // Roadmap State
  const [items, setItems] = useState<MinervaRoadmapItem[]>([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [inlineInputs, setInlineInputs] = useState<Record<string, string>>({});

  // Feature Requests (Client & Product Backlog via Realtime Hook)
  const {
    requests,
    loading: loadingRequests,
    isRealtimeConnected,
    updateStatus: updateFRStatus,
    removeRequest: removeFR,
    submitRequest: createFR,
  } = useFeatureRequests();

  const [frRepoFilter, setFrRepoFilter] = useState<string>('all');
  const [frStatusFilter, setFrStatusFilter] = useState<string>('all');
  const [frSearch, setFrSearch] = useState<string>('');
  const [inlineClientRequest, setInlineClientRequest] = useState<string>('');

  const searchRef = useRef<HTMLInputElement>(null);

  const loadRoadmap = async () => {
    setLoadingRoadmap(true);
    try {
      const data = await fetchMinervaRoadmap();
      setItems(data);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  useEffect(() => {
    loadRoadmap();
  }, []);

  // Keyboard shortcut '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  const handleStatusChange = async (itemId: string, newStatus: MinervaRoadmapItem['status']) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item)));
    const ok = await updateMinervaRoadmapStatus(itemId, newStatus);
    if (!ok) {
      toastError('Erreur', 'Impossible de mettre à jour le statut.');
      loadRoadmap();
    } else {
      toastSuccess('Statut mis à jour', `Initiative passée à « ${newStatus} ».`);
    }
  };

  const handleInlineAdd = async (groupKey: string, defaultProduct: string) => {
    const text = (inlineInputs[groupKey] || '').trim();
    if (!text) return;

    try {
      const newItem = await addMinervaRoadmapItem({
        title: text,
        product: defaultProduct,
        item_type: 'Milestone',
        status: 'planned',
      });

      if (newItem) {
        setItems((prev) => [newItem, ...prev]);
        setInlineInputs((prev) => ({ ...prev, [groupKey]: '' }));
        toastSuccess('Élément ajouté', `« ${newItem.title} » a été ajouté à la roadmap.`);
      }
    } catch {
      toastError('Erreur', "Impossible d'ajouter l'élément.");
    }
  };

  const handleInlineAddClientRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineClientRequest.trim()) return;

    try {
      const created = await createFR({
        client_id: 'c1b2c3d4-0000-0000-0000-000000000001',
        client_name: 'Toitures Beauchemin Inc.',
        author_name: 'Client Portail',
        title: inlineClientRequest.trim(),
        description: 'Requête soumise via console produit.',
        target_repo: 'minerva-flow',
        category: 'feature',
        priority: 'medium',
        status: 'under_review',
      });

      if (created) {
        setInlineClientRequest('');
        toastSuccess('Demande enregistrée', `La demande « ${created.title} » a été consignée.`);
      }
    } catch {
      toastError('Erreur', "Impossible d'enregistrer la demande.");
    }
  };

  // Group items for Tab 1
  const groupedItems = useMemo(() => {
    const map: Record<string, MinervaRoadmapItem[]> = {
      reach: [],
      ops: [],
      marketing: [],
      flow_os: [],
      labs: [],
    };

    items.forEach((item) => {
      const p = (item.product || '').toLowerCase();
      if (p.includes('reach') || p.includes('prospect') || p.includes('acquis')) map.reach.push(item);
      else if (p.includes('op') || p.includes('parten')) map.ops.push(item);
      else if (p.includes('market') || p.includes('youtub') || p.includes('content')) map.marketing.push(item);
      else if (p.includes('flow') || p.includes('os')) map.flow_os.push(item);
      else map.labs.push(item);
    });

    return map;
  }, [items]);

  // Ribbon Stats
  const totalItems = items.length;
  const doneCount = items.filter((i) => i.status === 'completed').length;
  const inProgressCount = items.filter((i) => i.status === 'in_progress').length;
  const plannedCount = items.filter((i) => i.status === 'planned').length;

  const donePct = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;
  const inProgressPct = totalItems > 0 ? Math.round((inProgressCount / totalItems) * 100) : 0;
  const plannedPct = totalItems > 0 ? Math.round((plannedCount / totalItems) * 100) : 0;

  // Filter Client Requests (Tab 2)
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (frRepoFilter !== 'all' && (r.repo || r.target_repo) !== frRepoFilter) return false;
      if (frStatusFilter !== 'all' && r.status !== frStatusFilter) return false;
      if (frSearch.trim()) {
        const q = frSearch.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchClient = (r.client_name || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchClient) return false;
      }
      return true;
    });
  }, [requests, frRepoFilter, frStatusFilter, frSearch]);

  if (!userLoading && role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé aux administrateurs.</p>
        <Link href="/overview" className="text-xs text-mv-green hover:underline">
          Retour à l&apos;aperçu
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      
      {/* ── 1. En-tête Contextuel (Hauteur 40px) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-zinc-900 tracking-tight font-display">
            Roadmap Produits &amp; Demandes
          </h1>

          {/* Sync status tag */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200/80 text-[10.5px] font-mono text-emerald-700" style={MONO}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Synchronisé</span>
          </div>
        </div>

        {/* Controls Right */}
        <div className="flex items-center gap-2.5">
          {/* Tabs Switcher (Segmented Control 28px) */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200/60 h-7 text-xs font-mono" style={MONO}>
            <button
              type="button"
              onClick={() => setActiveTab('roadmap')}
              className={cn(
                'px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'roadmap'
                  ? 'bg-white text-zinc-900 font-bold shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              )}
            >
              <Zap className="w-3.5 h-3.5 text-mv-green" />
              <span>Roadmap Produits</span>
              <span className="px-1 py-0.2 rounded bg-zinc-200 text-[10px] text-zinc-700">{items.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('feature_requests')}
              className={cn(
                'px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5',
                activeTab === 'feature_requests'
                  ? 'bg-white text-zinc-900 font-bold shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Demandes Clients</span>
              <span className="px-1 py-0.2 rounded bg-emerald-100 text-[10px] text-emerald-800 font-bold">{requests.length}</span>
            </button>
          </div>

          {/* New Initiative Button */}
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'roadmap') {
                const title = prompt('Titre de la nouvelle initiative produit :');
                if (title && title.trim()) {
                  addMinervaRoadmapItem({
                    title: title.trim(),
                    product: 'Minerva-Flow',
                    item_type: 'Launch',
                    status: 'planned',
                  }).then((item) => {
                    if (item) {
                      setItems((prev) => [item, ...prev]);
                      toastSuccess('Initiative créée', `« ${item.title} » ajoutée.`);
                    }
                  });
                }
              } else {
                const title = prompt('Demande de fonctionnalité client :');
                if (title && title.trim()) {
                  createFR({
                    client_id: 'c1b2c3d4-0000-0000-0000-000000000001',
                    client_name: 'Toitures Beauchemin Inc.',
                    author_name: 'Client Portail',
                    title: title.trim(),
                    description: 'Nouvelle demande consigné en console.',
                    target_repo: 'minerva-flow',
                    category: 'feature',
                    priority: 'high',
                    status: 'under_review',
                  });
                }
              }
            }}
            className="h-7 px-2.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{activeTab === 'roadmap' ? 'Nouvelle Initiative (C)' : 'Nouvelle Requête (C)'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Ruban de Synthèse d'Avancement (Strip 4 Métriques + Micro-Jauge) ── */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-100 p-2.5">
          <div className="px-3 py-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Total Items</div>
            <div className="text-sm font-bold text-zinc-900 font-mono" style={MONO}>{totalItems}</div>
          </div>
          <div className="px-3 py-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">En cours</div>
            <div className="text-sm font-bold text-blue-700 font-mono" style={MONO}>{inProgressCount} <span className="text-xs font-normal text-zinc-400">({inProgressPct}%)</span></div>
          </div>
          <div className="px-3 py-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Terminés</div>
            <div className="text-sm font-bold text-emerald-700 font-mono" style={MONO}>{doneCount} <span className="text-xs font-normal text-zinc-400">({donePct}%)</span></div>
          </div>
          <div className="px-3 py-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Planifiés</div>
            <div className="text-sm font-bold text-zinc-700 font-mono" style={MONO}>{plannedCount} <span className="text-xs font-normal text-zinc-400">({plannedPct}%)</span></div>
          </div>
        </div>

        {/* Micro Multi-color Gauge (3px height) */}
        <div className="h-1 bg-zinc-100 flex w-full overflow-hidden">
          <div style={{ width: `${donePct}%` }} className="bg-emerald-500 transition-all duration-500" />
          <div style={{ width: `${inProgressPct}%` }} className="bg-blue-500 transition-all duration-500" />
          <div style={{ width: `${plannedPct}%` }} className="bg-zinc-300 transition-all duration-500" />
        </div>
      </div>

      {/* ── 3. CONTENU ONGLET 1 : Roadmap Produits Monolithique (Collapsible Groups) ── */}
      {activeTab === 'roadmap' && (
        <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-xs divide-y divide-zinc-200">
          
          {/* Table Header Column Bar */}
          <div className="bg-zinc-50/70 border-b border-zinc-200 px-4 py-2 flex items-center justify-between text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
            <div className="grid grid-cols-12 gap-3 w-full">
              <span className="col-span-5 sm:col-span-7">Produit / Initiative</span>
              <span className="col-span-3 sm:col-span-2">Trimestre</span>
              <span className="hidden sm:inline sm:col-span-1">Type</span>
              <span className="col-span-4 sm:col-span-2 text-right">Statut</span>
            </div>
          </div>

          {/* Product Groups */}
          {PRODUCT_GROUPS.map((group) => {
            const groupItems = groupedItems[group.key] || [];
            const isCollapsed = collapsedGroups.has(group.key);
            const defaultProd = group.products[0];

            return (
              <div key={group.key} className="divide-y divide-zinc-100">
                {/* Product Header (28px height) */}
                <div
                  onClick={() => toggleGroupCollapse(group.key)}
                  className="bg-zinc-50/60 hover:bg-zinc-100/70 border-y border-zinc-100/80 px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-zinc-700 tracking-wider" style={MONO}>
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
                    <span>▼ {group.label}</span>
                    <span className="text-[10px] font-normal text-zinc-400 font-mono">({groupItems.length} item{groupItems.length > 1 ? 's' : ''})</span>
                  </div>

                  <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
                    {groupItems.filter((i) => i.status === 'completed').length}/{groupItems.length} Done
                  </span>
                </div>

                {/* Group Rows (34px height) */}
                {!isCollapsed && (
                  <>
                    {groupItems.length === 0 ? (
                      <div className="px-6 py-3 text-xs text-zinc-400 italic">
                        Aucune initiative active pour ce pôle.
                      </div>
                    ) : (
                      groupItems.map((item) => {
                        const statusConf = STATUS_CONFIG_MAP[item.status] || STATUS_CONFIG_MAP.planned;

                        return (
                          <div
                            key={item.id}
                            className="px-4 py-2 hover:bg-zinc-50/70 transition-colors flex items-center justify-between text-xs group h-9"
                          >
                            <div className="grid grid-cols-12 gap-3 w-full items-center">
                              {/* 1. Titre */}
                              <div className="col-span-5 sm:col-span-7 font-medium text-zinc-900 truncate hover:text-emerald-700 cursor-pointer flex items-center gap-2">
                                <span className="truncate">{item.title}</span>
                                {item.product && item.product !== group.label && (
                                  <span className="hidden md:inline px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-zinc-100 text-zinc-500 border border-zinc-200/60 shrink-0">
                                    {item.product}
                                  </span>
                                )}
                              </div>

                              {/* 2. Trimestre */}
                              <div className="col-span-3 sm:col-span-2 text-[11px] text-zinc-400 font-mono truncate" style={MONO}>
                                {item.target_quarter || 'Non planifié'}
                              </div>

                              {/* 3. Type */}
                              <div className="hidden sm:inline sm:col-span-1">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                                  {item.item_type}
                                </span>
                              </div>

                              {/* 4. Statut & Actions */}
                              <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-2">
                                <select
                                  value={item.status}
                                  onChange={(e) => handleStatusChange(item.id, e.target.value as MinervaRoadmapItem['status'])}
                                  className={cn(
                                    'h-5 px-2 rounded text-[10.5px] font-semibold border cursor-pointer appearance-none transition-colors text-center font-mono',
                                    statusConf.bg,
                                    statusConf.text,
                                    statusConf.border
                                  )}
                                  style={MONO}
                                >
                                  <option value="planned">○ Planifié</option>
                                  <option value="in_progress">◐ En cours</option>
                                  <option value="completed">● Terminé</option>
                                  <option value="blocked">✕ Bloqué</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    const confirmed = await confirmDialog({
                                      title: 'Supprimer l’élément',
                                      message: `Confirmez-vous la suppression de « ${item.title} » ?`,
                                      confirmLabel: 'Supprimer',
                                      variant: 'danger',
                                    });
                                    if (confirmed) {
                                      setItems((prev) => prev.filter((i) => i.id !== item.id));
                                      await deleteMinervaRoadmapItem(item.id);
                                      toastSuccess('Supprimé', 'Initiative retirée.');
                                    }
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-600 transition-opacity cursor-pointer"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Inline Add Row */}
                    <div className="px-4 py-1.5 bg-zinc-50/40 flex items-center gap-2">
                      <span className="text-zinc-400 text-xs font-mono">+</span>
                      <input
                        type="text"
                        placeholder={`Ajouter un élément à [${group.label}]... (Appuyer sur Entrée)`}
                        value={inlineInputs[group.key] || ''}
                        onChange={(e) => setInlineInputs((prev) => ({ ...prev, [group.key]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleInlineAdd(group.key, defaultProd);
                          }
                        }}
                        className="flex-1 bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none py-0.5"
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}

        </div>
      )}

      {/* ── 4. CONTENU ONGLET 2 : Demandes Fonctionnalités Clients Monolithique ── */}
      {activeTab === 'feature_requests' && (
        <div className="space-y-3">
          
          {/* Quick Filter Toolbar (36px) */}
          <div className="p-2 bg-white border border-zinc-200 rounded-lg shadow-xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Rechercher une demande, un tag... (/)"
                  value={frSearch}
                  onChange={(e) => setFrSearch(e.target.value)}
                  className="h-7 w-56 sm:w-64 pl-8 pr-2 text-xs border border-zinc-200 rounded-md bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Repo filter */}
              <select
                value={frRepoFilter}
                onChange={(e) => setFrRepoFilter(e.target.value)}
                className="h-7 px-2 text-xs border border-zinc-200 rounded-md bg-white text-zinc-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="all">Tous les modules</option>
                <option value="minerva-flow">Minerva-Flow</option>
                <option value="trequartista-app">The-Trequartista</option>
                <option value="framer-site">Framer Site</option>
                <option value="meta-ads-engine">Ads Engine</option>
              </select>

              {/* Status filter */}
              <select
                value={frStatusFilter}
                onChange={(e) => setFrStatusFilter(e.target.value)}
                className="h-7 px-2 text-xs border border-zinc-200 rounded-md bg-white text-zinc-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="under_review">En revue</option>
                <option value="planned">Planifié</option>
                <option value="in_progress">En développement</option>
                <option value="delivered">Livré</option>
                <option value="declined">Refusé</option>
              </select>
            </div>

            <div className="text-[11px] font-mono text-zinc-400" style={MONO}>
              {filteredRequests.length} demande{filteredRequests.length > 1 ? 's' : ''} filtrée{filteredRequests.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* DataTable Monolithique des Demandes Clients */}
          <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/70 text-[10px] uppercase font-bold text-zinc-500 tracking-wider h-8">
                    <th className="py-2 px-3 font-semibold">Produit / Tag</th>
                    <th className="py-2 px-3 font-semibold">Demande Client / Description</th>
                    <th className="py-2 px-3 font-semibold">Client Demandeur</th>
                    <th className="py-2 px-3 font-semibold">Date</th>
                    <th className="py-2 px-3 font-semibold">Note Interne / Admin</th>
                    <th className="py-2 px-3 font-semibold text-center">Statut Client</th>
                    <th className="py-2 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 text-zinc-800">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 px-4 text-center text-zinc-400">
                        Aucune demande client correspondant aux filtres.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const repoName = req.repo || req.target_repo || 'Minerva-Flow';
                      const clientName = req.client_name || 'Toitures Beauchemin Inc.';
                      const dateStr = req.created_at
                        ? new Date(req.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
                        : '21 Août';

                      return (
                        <tr key={req.id} className="hover:bg-zinc-50/80 transition-colors h-10 group">
                          {/* 1. Produit / Tag */}
                          <td className="py-2.5 px-3">
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-900 text-white whitespace-nowrap"
                              style={MONO}
                            >
                              {repoName}
                            </span>
                          </td>

                          {/* 2. Demande & Description */}
                          <td className="py-2.5 px-3 max-w-sm">
                            <div className="font-semibold text-zinc-900 truncate">{req.title}</div>
                            <div className="text-[10.5px] text-zinc-400 truncate">{req.description}</div>
                          </td>

                          {/* 3. Client Demandeur */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-600 hover:text-emerald-700 whitespace-nowrap cursor-pointer" style={MONO}>
                            {clientName}
                          </td>

                          {/* 4. Date */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap" style={MONO}>
                            {dateStr}
                          </td>

                          {/* 5. Note Interne */}
                          <td className="py-2.5 px-3 max-w-[180px]">
                            {req.admin_notes ? (
                              <span className="text-[11px] font-mono text-zinc-500 italic truncate block" style={MONO} title={req.admin_notes}>
                                {req.admin_notes}
                              </span>
                            ) : (
                              <span className="text-[10.5px] text-zinc-300 italic">—</span>
                            )}
                          </td>

                          {/* 6. Statut Client (Inline Selectable) */}
                          <td className="py-2.5 px-3 text-center">
                            <select
                              value={req.status}
                              onChange={(e) => updateFRStatus(req.id, e.target.value as FeatureRequestStatus)}
                              className="h-5 px-1.5 rounded text-[10.5px] font-semibold border cursor-pointer appearance-none text-center transition-colors font-mono"
                              style={MONO}
                            >
                              {CLIENT_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.status} value={opt.status}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* 7. Actions */}
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                const confirmed = await confirmDialog({
                                  title: 'Supprimer la demande',
                                  message: `Confirmez-vous la suppression de « ${req.title} » ?`,
                                  confirmLabel: 'Supprimer',
                                  variant: 'danger',
                                });
                                if (confirmed) {
                                  await removeFR(req.id);
                                  toastSuccess('Supprimé', 'Demande client supprimée.');
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-600 transition-opacity cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Inline Add Quick Request */}
            <form onSubmit={handleInlineAddClientRequest} className="border-t border-zinc-100 bg-zinc-50/40 p-2 flex items-center gap-2">
              <span className="text-zinc-400 pl-2">
                <Plus className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Consigner une nouvelle demande client... [Appuyer sur Entrée]"
                value={inlineClientRequest}
                onChange={(e) => setInlineClientRequest(e.target.value)}
                className="flex-1 bg-transparent text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none py-1"
              />
              <button
                type="submit"
                disabled={!inlineClientRequest.trim()}
                className="px-2.5 py-1 text-[11px] font-semibold bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white rounded transition-colors cursor-pointer"
              >
                Ajouter la requête
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
