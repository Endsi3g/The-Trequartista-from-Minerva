'use client';

import React, { useEffect, useState } from 'react';
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
import type { MinervaRoadmapItem, FeatureRequestStatus, FeatureRequestRepo } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const IMPACT_VARIANT: Record<MinervaRoadmapItem['impact'], 'green' | 'amber' | 'red'> = {
  Low: 'green',
  Medium: 'amber',
  High: 'red',
};

const TYPE_VARIANT: Record<MinervaRoadmapItem['item_type'], 'blue' | 'green' | 'purple'> = {
  Launch: 'green',
  Milestone: 'purple',
  Experiment: 'blue',
};

const STATUS_LABELS: Record<FeatureRequestStatus, string> = {
  submitted: 'Soumise',
  under_review: 'En revue',
  planned: 'Planifié',
  in_progress: 'En développement',
  in_development: 'En développement',
  testing: 'En test & QA',
  in_qa: 'En recette QA',
  delivered: 'Livré',
  declined: 'Refusé',
};

export default function ProduitsMinervaPage() {
  const { role, loading: userLoading } = useCurrentUser();
  const confirmDialog = useConfirm();
  const { toastError, toastSuccess } = useToast();

  const [activeTab, setActiveTab] = useState<'roadmap' | 'feature_requests'>('roadmap');

  // Roadmap State
  const [items, setItems] = useState<MinervaRoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [product, setProduct] = useState('');
  const [itemType, setItemType] = useState<MinervaRoadmapItem['item_type']>('Milestone');
  const [status, setStatus] = useState<MinervaRoadmapItem['status']>('Planned');
  const [impact, setImpact] = useState<MinervaRoadmapItem['impact']>('Medium');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Feature Requests (Client & Product Backlog via Realtime Hook)
  const {
    requests,
    loading: loadingRequests,
    isRealtimeConnected,
    updateStatus: updateFRStatus,
    removeRequest: removeFR,
  } = useFeatureRequests();

  const [frRepoFilter, setFrRepoFilter] = useState<string>('all');
  const [frStatusFilter, setFrStatusFilter] = useState<string>('all');
  const [frSearch, setFrSearch] = useState<string>('');

  const load = async () => {
    setItems(await fetchMinervaRoadmap());
    setLoading(false);
  };

  useEffect(() => {
    if (role === 'admin') load();
    else setLoading(false);
  }, [role]);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !product.trim()) return;
    setSaving(true);
    const created = await addMinervaRoadmapItem({
      title: title.trim(),
      product: product.trim(),
      item_type: itemType,
      status,
      impact,
      start_date: startDate || null,
      end_date: endDate || null,
    });
    setSaving(false);
    if (!created) {
      toastError(
        'Erreur',
        'Impossible de créer cet item. La migration minerva_roadmap_items est peut-être encore en attente de déploiement.'
      );
      return;
    }
    setTitle('');
    setProduct('');
    setStartDate('');
    setEndDate('');
    setShowAddForm(false);
    await load();
  };

  const handleStatusChange = async (item: MinervaRoadmapItem, next: MinervaRoadmapItem['status']) => {
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: next } : x)));
    await updateMinervaRoadmapStatus(item.id, next);
  };

  const handleDelete = async (item: MinervaRoadmapItem) => {
    const ok = await confirmDialog({
      title: 'Supprimer cet item de roadmap ?',
      message: `« ${item.title} » sera retiré définitivement.`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    setItems((prev) => prev.filter((x) => x.id !== item.id));
    const done = await deleteMinervaRoadmapItem(item.id);
    if (done) toastSuccess('Item supprimé');
  };

  const grouped = items.reduce<Record<string, MinervaRoadmapItem[]>>((acc, item) => {
    (acc[item.product] ||= []).push(item);
    return acc;
  }, {});

  // Filtered feature requests
  const filteredFR = requests.filter((r) => {
    if (frRepoFilter !== 'all' && r.repo !== frRepoFilter) return false;
    if (frStatusFilter !== 'all' && r.status !== frStatusFilter) return false;
    if (frSearch.trim()) {
      const q = frSearch.toLowerCase();
      if (!r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
              Produits & Demandes Minerva
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isRealtimeConnected ? 'Realtime Connecté' : 'Supabase'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-mv-ink-soft mt-1">
            Roadmap interne des produits (Reach, Flow, OS) et gestion en direct des demandes de fonctionnalités clients.
          </p>
        </div>

        {activeTab === 'roadmap' && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddForm((v) => !v)}
          >
            {showAddForm ? 'Annuler' : 'Nouvel item'}
          </Button>
        )}
      </div>

      {/* ── Sub Tabs ── */}
      <div className="flex items-center gap-2 border-b border-mv-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('roadmap')}
          className={cn(
            'px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'roadmap'
              ? 'border-mv-green text-mv-ink font-extrabold'
              : 'border-transparent text-mv-ink-soft hover:text-mv-ink'
          )}
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>Roadmap Produits ({items.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('feature_requests')}
          className={cn(
            'px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'feature_requests'
              ? 'border-mv-green text-mv-ink font-extrabold'
              : 'border-transparent text-mv-ink-soft hover:text-mv-ink'
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Demandes Fonctionnalités Clients ({requests.length})</span>
        </button>
      </div>

      {/* ── Tab 1: Roadmap Interne ── */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {showAddForm && (
            <Card>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-mv-ink mb-1.5">Titre</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Lancement Ascend V1"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-mv-ink mb-1.5">Produit</label>
                    <input
                      type="text"
                      required
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      placeholder="Reach, Flow, OS, Ascend…"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-mv-ink mb-1.5">Type</label>
                    <select
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value as MinervaRoadmapItem['item_type'])}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer"
                    >
                      <option value="Milestone">Milestone</option>
                      <option value="Launch">Launch</option>
                      <option value="Experiment">Experiment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-mv-ink mb-1.5">Statut</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as MinervaRoadmapItem['status'])}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer"
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-mv-ink mb-1.5">Impact</label>
                    <select
                      value={impact}
                      onChange={(e) => setImpact(e.target.value as MinervaRoadmapItem['impact'])}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-mv-ink mb-1.5">Début</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? 'Création…' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="py-12 text-center text-xs text-mv-ink-soft">Chargement…</div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Rocket}
              title="Aucun item de roadmap"
              description="Ajoute le premier jalon produit ci-dessus."
            />
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([productName, productItems]) => (
                <Card
                  key={productName}
                  header={
                    <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                      {productName}
                    </h3>
                  }
                >
                  <div className="space-y-2">
                    {productItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-mv-cream-soft border border-mv-border"
                      >
                        <div className="flex-1 min-w-[200px]">
                          <div className="font-semibold text-sm text-mv-ink">{item.title}</div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-mv-ink-faint">
                            {item.start_date && (
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                {new Date(item.start_date).toLocaleDateString('fr-CA', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                                {item.end_date &&
                                  ` → ${new Date(item.end_date).toLocaleDateString('fr-CA', {
                                    day: 'numeric',
                                    month: 'short',
                                  })}`}
                              </span>
                            )}
                            {item.owner_name && (
                              <span className="flex items-center gap-1">
                                <UserIcon className="w-3 h-3" /> {item.owner_name.trim()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge variant={TYPE_VARIANT[item.item_type]}>{item.item_type}</Badge>
                        <Badge variant={IMPACT_VARIANT[item.impact]}>{item.impact}</Badge>
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(item, e.target.value as MinervaRoadmapItem['status'])
                          }
                          className="px-2 py-1 rounded-lg bg-mv-surface border border-mv-border text-[11px] font-bold text-mv-ink cursor-pointer focus:outline-none"
                        >
                          <option value="Planned">Planned</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-mv-ink-faint hover:text-mv-red transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Feature Requests Clients (Realtime Backlog) ── */}
      {activeTab === 'feature_requests' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={frSearch}
                  onChange={(e) => setFrSearch(e.target.value)}
                  placeholder="Rechercher une demande client..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-mv-border bg-mv-cream-soft text-xs text-mv-ink focus:outline-none focus:border-mv-green"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={frRepoFilter}
                  onChange={(e) => setFrRepoFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-mv-border bg-mv-cream-soft text-xs font-semibold text-mv-ink focus:outline-none cursor-pointer"
                >
                  <option value="all">Tous les repos</option>
                  <option value="Minerva-Flow">Minerva-Flow</option>
                  <option value="The-Trequartista">The-Trequartista</option>
                  <option value="Minerva-Voice-AI">Minerva Voice AI</option>
                  <option value="Minerva-OS">Minerva-OS</option>
                  <option value="API & Intégrations">API & Intégrations</option>
                </select>

                <select
                  value={frStatusFilter}
                  onChange={(e) => setFrStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-mv-border bg-mv-cream-soft text-xs font-semibold text-mv-ink focus:outline-none cursor-pointer"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="under_review">En revue</option>
                  <option value="planned">Planifié</option>
                  <option value="in_progress">En développement</option>
                  <option value="testing">En test & QA</option>
                  <option value="delivered">Livré</option>
                  <option value="declined">Refusé</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Requests List */}
          {loadingRequests ? (
            <div className="py-12 text-center text-xs text-mv-ink-soft">Chargement des demandes…</div>
          ) : filteredFR.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Aucune demande trouvée"
              description="Aucune demande ne correspond aux filtres actuels."
            />
          ) : (
            <div className="space-y-3">
              {filteredFR.map((req) => (
                <Card key={req.id} className="p-4 sm:p-5 hover:border-mv-green/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-white font-mono" style={MONO}>
                          {req.repo}
                        </span>
                        {req.client_name && (
                          <span className="text-[11px] font-semibold text-mv-ink">
                            {req.client_name}
                          </span>
                        )}
                        <span className="text-[10px] text-mv-ink-faint">•</span>
                        <span className="text-[11px] text-mv-ink-soft" style={MONO}>
                          {new Date(req.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-mv-ink">{req.title}</h3>
                      <p className="text-xs text-mv-ink-soft leading-relaxed">{req.description}</p>

                      {req.admin_notes && (
                        <div className="mt-2 p-2 rounded-lg bg-mv-cream-soft border border-mv-border text-[11px] text-mv-ink">
                          <span className="font-bold">Note admin : </span>
                          <span>{req.admin_notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Status Changer (Realtime update trigger to client) */}
                    <div className="flex sm:flex-col items-end gap-2 shrink-0">
                      <div className="text-[10px] font-bold text-mv-ink-faint uppercase">
                        Statut Client
                      </div>
                      <select
                        value={req.status}
                        onChange={(e) => updateFRStatus(req.id, e.target.value as FeatureRequestStatus)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer focus:outline-none shadow-2xs',
                          req.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : req.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : req.status === 'planned'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        )}
                      >
                        <option value="under_review">En revue</option>
                        <option value="planned">Planifié</option>
                        <option value="in_progress">En développement</option>
                        <option value="testing">En test & QA</option>
                        <option value="delivered">Livré</option>
                        <option value="declined">Refusé</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => removeFR(req.id)}
                        className="p-1 text-mv-ink-faint hover:text-red-600 transition-colors cursor-pointer"
                        title="Supprimer la demande"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
