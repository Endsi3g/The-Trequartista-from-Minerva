'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Rocket, Plus, Trash2, CalendarDays, User as UserIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useToast } from '@/components/providers/ToastProvider';
import {
  fetchMinervaRoadmap,
  addMinervaRoadmapItem,
  updateMinervaRoadmapStatus,
  deleteMinervaRoadmapItem,
} from '@/lib/services/supabase-data';
import type { MinervaRoadmapItem } from '@/lib/types';

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

export default function ProduitsMinervaPage() {
  const { role, loading: userLoading } = useCurrentUser();
  const confirmDialog = useConfirm();
  const { toastError, toastSuccess } = useToast();

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
        <Link href="/overview" className="text-xs text-mv-green hover:underline">Retour à l&apos;aperçu</Link>
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
      toastError('Erreur', 'Impossible de créer cet item. La migration minerva_roadmap_items est peut-être encore en attente de déploiement.');
      return;
    }
    setTitle(''); setProduct(''); setStartDate(''); setEndDate('');
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">Produits Minerva</h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Roadmap interne des produits de l&apos;agence (Reach, Flow, OS, et les nouveaux : Ascend, Forge, Atlas) — distinct du travail client.
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddForm((v) => !v)}>
          {showAddForm ? 'Annuler' : 'Nouvel item'}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Titre</label>
                <input
                  type="text" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Lancement Ascend V1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Produit</label>
                <input
                  type="text" required value={product} onChange={(e) => setProduct(e.target.value)}
                  placeholder="Reach, Flow, OS, Ascend…"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Type</label>
                <select value={itemType} onChange={(e) => setItemType(e.target.value as MinervaRoadmapItem['item_type'])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer">
                  <option value="Milestone">Milestone</option>
                  <option value="Launch">Launch</option>
                  <option value="Experiment">Experiment</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Statut</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as MinervaRoadmapItem['status'])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer">
                  <option value="Planned">Planned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Impact</label>
                <select value={impact} onChange={(e) => setImpact(e.target.value as MinervaRoadmapItem['impact'])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Début</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Création…' : 'Ajouter'}</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-mv-ink-soft">Chargement…</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Rocket} title="Aucun item de roadmap" description="Ajoute le premier jalon produit ci-dessus." />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([productName, productItems]) => (
            <Card key={productName} header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">{productName}</h3>}>
              <div className="space-y-2">
                {productItems.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-mv-cream-soft border border-mv-border">
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-semibold text-sm text-mv-ink">{item.title}</div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-mv-ink-faint">
                        {item.start_date && (
                          <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />
                            {new Date(item.start_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                            {item.end_date && ` → ${new Date(item.end_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}`}
                          </span>
                        )}
                        {item.owner_name && <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {item.owner_name.trim()}</span>}
                      </div>
                    </div>
                    <Badge variant={TYPE_VARIANT[item.item_type]}>{item.item_type}</Badge>
                    <Badge variant={IMPACT_VARIANT[item.impact]}>{item.impact}</Badge>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item, e.target.value as MinervaRoadmapItem['status'])}
                      className="px-2 py-1 rounded-lg bg-mv-surface border border-mv-border text-[11px] font-bold text-mv-ink cursor-pointer focus:outline-none"
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                    <button onClick={() => handleDelete(item)} className="p-1.5 text-mv-ink-faint hover:text-mv-red transition-colors cursor-pointer" title="Supprimer">
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
  );
}
