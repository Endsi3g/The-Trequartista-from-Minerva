'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Trash2,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Clock,
  ArrowRight,
  X,
  FileCode2,
  Calendar,
  Sparkles,
  CheckSquare,
  Square,
  Check,
  Share2,
  Download,
  Pin,
  PinOff,
  Building2,
  FolderKanban,
  FileSpreadsheet,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useToast } from '@/components/providers/ToastProvider';
import {
  fetchDocuments,
  addDocument,
  deleteDocument,
  togglePinDocument,
} from '@/lib/services/supabase-data';
import type { TeamDocument, DocumentBlock } from '@/lib/types';
import { AgencyTemplatesModal } from '@/components/documents/AgencyTemplatesModal';
import { AGENCY_TEMPLATES, AgencyTemplate } from '@/components/documents/templates';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface CategoryTab {
  key: string;
  label: string;
  categoryFilter?: TeamDocument['category'];
}

const CATEGORY_TABS: CategoryTab[] = [
  { key: 'all', label: 'Tous les documents' },
  { key: 'product_brief', label: 'Dossiers Produits', categoryFilter: 'product_brief' },
  { key: 'meeting_notes', label: 'Comptes-rendus', categoryFilter: 'meeting_notes' },
  { key: 'spec', label: 'Cahiers des charges', categoryFilter: 'spec' },
  { key: 'sop', label: 'SOPs & Guides', categoryFilter: 'sop' },
  { key: 'proposal', label: 'Propositions & Devis', categoryFilter: 'proposal' },
];

const QUICK_STARTERS: {
  key: string;
  title: string;
  category: TeamDocument['category'];
  icon: React.ElementType;
  color: string;
  defaultBlocks: DocumentBlock[];
}[] = [
  {
    key: 'spec_framer',
    title: 'Cahier des charges Framer',
    category: 'spec',
    icon: FileCode2,
    color: 'text-amber-600 bg-amber-50',
    defaultBlocks: [
      { id: 'b-1', type: 'heading_1', content: 'Cahier des Charges — Site Framer & Portails' },
      { id: 'b-2', type: 'callout', content: '**Objectif** : Spécifications fonctionnelles, arborescence et charte graphique du nouveau site client.', calloutType: 'info' },
      { id: 'b-3', type: 'heading_2', content: '1. Arborescence & Pages Cibles' },
      { id: 'b-4', type: 'bullet_list', content: 'Page d’accueil avec proposition de valeur claire et CTA d’audit' },
      { id: 'b-5', type: 'bullet_list', content: 'Section Tarifs transparents & simulation de ROI' },
      { id: 'b-6', type: 'heading_2', content: '2. Intégrations & Formulaires Webhooks' },
      { id: 'b-7', type: 'todo_list', content: 'Connexion du webhook Framer vers l’API Minerva Inbound', checked: true },
      { id: 'b-8', type: 'todo_list', content: 'Déclenchement automatique du SMS de relance J+0', checked: false },
    ],
  },
  {
    key: 'meeting_client',
    title: 'Compte-rendu de Réunion Client',
    category: 'meeting_notes',
    icon: Calendar,
    color: 'text-purple-600 bg-purple-50',
    defaultBlocks: [
      { id: 'b-1', type: 'heading_1', content: 'Compte-Rendu — Réunion Stratégique Client' },
      { id: 'b-2', type: 'callout', content: '**Participants** : Équipe Minerva + Direction Client\n**Date** : ' + new Date().toLocaleDateString('fr-CA'), calloutType: 'note' },
      { id: 'b-3', type: 'heading_2', content: '1. Décisions Validées' },
      { id: 'b-4', type: 'bullet_list', content: 'Validation du déploiement de la solution de commande directe' },
      { id: 'b-5', type: 'bullet_list', content: 'Date de lancement fixée sous 14 jours' },
      { id: 'b-6', type: 'heading_2', content: '2. Prochaines Actions & Responsables' },
      { id: 'b-7', type: 'todo_list', content: 'Configurer la passerelle Stripe Connect (Responsable: Dev)', checked: false },
      { id: 'b-8', type: 'todo_list', content: 'Valider le menu et les photos produits (Responsable: Client)', checked: false },
    ],
  },
  {
    key: 'product_spec',
    title: 'Dossier de Spécification Produit',
    category: 'product_brief',
    icon: Sparkles,
    color: 'text-blue-600 bg-blue-50',
    defaultBlocks: [
      { id: 'b-1', type: 'heading_1', content: 'Dossier Produit — Vision & Spécifications V1' },
      { id: 'b-2', type: 'callout', content: '**Proposition de Valeur** : Solution clé en main 0% commission pour maximiser les marges nettes.', calloutType: 'tip' },
      { id: 'b-3', type: 'heading_2', content: '1. Fonctionnalités Clés & Livrables' },
      { id: 'b-4', type: 'todo_list', content: 'Console de commande en ligne multi-appareils', checked: true },
      { id: 'b-5', type: 'todo_list', content: 'Notification sonore et impression automatique des bons en cuisine', checked: false },
    ],
  },
  {
    key: 'proposal_audit',
    title: 'Proposition Commerciale & Audit',
    category: 'proposal',
    icon: FileSpreadsheet,
    color: 'text-rose-600 bg-rose-50',
    defaultBlocks: [
      { id: 'b-1', type: 'heading_1', content: 'Proposition Commerciale & Audit Opérationnel' },
      { id: 'b-2', type: 'callout', content: '**Offre sur-mesure** : Déploiement accéléré et retour sur investissement sous 30 jours.', calloutType: 'warning' },
      { id: 'b-3', type: 'heading_2', content: '1. Diagnostic des Pertes Actuelles' },
      { id: 'b-4', type: 'bullet_list', content: 'Commissions tierces estimées : ~1 800 $/mois' },
      { id: 'b-5', type: 'heading_2', content: '2. Forfait Recommandé & Tarification' },
      { id: 'b-6', type: 'paragraph', content: 'Forfait Clé en main : 3 500 $ CAD + support continu sans commission.' },
    ],
  },
];

const CATEGORY_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  product_brief: { label: 'Dossier Produit', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  meeting_notes: { label: 'Compte-rendu', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  spec: { label: 'Cahier des charges', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  sop: { label: 'SOP & Guide', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  proposal: { label: 'Proposition', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  general: { label: 'Document', bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200' },
};

export default function DocumentsPage() {
  const router = useRouter();
  const { id: userId } = useCurrentUser();
  const confirmDialog = useConfirm();
  const { toastSuccess, toastError, toastInfo } = useToast();

  const [documents, setDocuments] = useState<TeamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

  // Multi-selection state
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Keyboard shortcuts: 'C' or 'N' to create, '/' to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateBlank();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userId]);

  const handleCreateBlank = async () => {
    setCreating(true);
    try {
      const doc = await addDocument('Document sans titre', userId || null, {
        category: 'general',
        contentJson: {
          blocks: [
            { id: 'b-1', type: 'heading_1', content: 'Document sans titre' },
            { id: 'b-2', type: 'paragraph', content: '' },
          ],
        },
      });
      if (doc) {
        toastSuccess('Document créé', 'Ouverture de l’éditeur collaboratif…');
        router.push(`/documents/${doc.id}`);
        return;
      }
      toastError('Erreur', 'Impossible de créer le document.');
    } catch {
      toastError('Erreur', 'Une anomalie est survenue lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateQuickStarter = async (starter: typeof QUICK_STARTERS[0]) => {
    setCreating(true);
    try {
      const cleanTitle = starter.title.replace(/^[^\wÀ-ÿ]+/i, '').trim();
      const doc = await addDocument(cleanTitle, userId || null, {
        category: starter.category,
        contentJson: { blocks: starter.defaultBlocks },
      });
      if (doc) {
        toastSuccess('Modèle instancié', `« ${cleanTitle} » créé avec succès.`);
        router.push(`/documents/${doc.id}`);
        return;
      }
    } catch {
      toastError('Erreur', 'Impossible de créer le document depuis ce modèle.');
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, doc: TeamDocument) => {
    e.preventDefault();
    e.stopPropagation();
    const nextPinned = !doc.is_pinned;
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, is_pinned: nextPinned } : d))
    );
    await togglePinDocument(doc.id, nextPinned);
    toastSuccess(
      nextPinned ? 'Document épinglé' : 'Document désépinglé',
      nextPinned ? 'Affiché en tête de vos documents.' : 'Retiré des favoris épinglés.'
    );
  };

  const handleDelete = async (e: React.MouseEvent, doc: TeamDocument) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirmDialog({
      title: 'Supprimer ce document ?',
      message: `« ${doc.title} » sera retiré définitivement pour toute l'équipe.`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;

    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      next.delete(doc.id);
      return next;
    });
    await deleteDocument(doc.id);
    toastSuccess('Document supprimé', 'Le document a été retiré.');
  };

  const handleBulkDelete = async () => {
    if (selectedDocIds.size === 0) return;
    const count = selectedDocIds.size;
    const ok = await confirmDialog({
      title: `Supprimer ${count} document${count > 1 ? 's' : ''} ?`,
      message: `Ces ${count} documents sélectionnés seront définitivement supprimés pour toute l'équipe.`,
      confirmLabel: `Supprimer (${count})`,
      variant: 'danger',
    });
    if (!ok) return;

    setIsDeletingBulk(true);
    const idsToDelete = Array.from(selectedDocIds);

    // Optimistically update UI
    setDocuments((prev) => prev.filter((d) => !selectedDocIds.has(d.id)));
    setSelectedDocIds(new Set());

    try {
      await Promise.all(idsToDelete.map((id) => deleteDocument(id)));
      toastSuccess('Documents supprimés', `${count} document${count > 1 ? 's ont été retirés' : ' a été retiré'}.`);
    } catch {
      toastError('Erreur', 'Certains documents n’ont pas pu être supprimés.');
      load();
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const toggleSelectDoc = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDocIds.size === filteredDocuments.length && filteredDocuments.length > 0) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(filteredDocuments.map((d) => d.id)));
    }
  };

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return documents.filter((doc) => {
      if (q && !doc.title.toLowerCase().includes(q)) return false;
      if (selectedCategory !== 'all') {
        const catTab = CATEGORY_TABS.find((t) => t.key === selectedCategory);
        if (catTab?.categoryFilter && doc.category !== catTab.categoryFilter) {
          // Fallback title check for legacy documents
          const t = doc.title.toLowerCase();
          if (selectedCategory === 'product_brief' && !t.includes('produit') && !t.includes('brief')) return false;
          if (selectedCategory === 'meeting_notes' && !t.includes('compte') && !t.includes('réunion') && !t.includes('sync')) return false;
          if (selectedCategory === 'spec' && !t.includes('spec') && !t.includes('cahier') && !t.includes('charge')) return false;
          if (selectedCategory === 'sop' && !t.includes('sop') && !t.includes('guide') && !t.includes('proc')) return false;
          if (selectedCategory === 'proposal' && !t.includes('propos') && !t.includes('devis') && !t.includes('offre')) return false;
        }
      }
      return true;
    });
  }, [documents, searchQuery, selectedCategory]);

  return (
    <div className="space-y-4 pb-12">
      
      {/* ── 1. Top Navigation Bar (Toolbar 40px) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="text-xs text-zinc-400 font-mono" style={MONO}>
            Minerva / Espace Partagé / Documents
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-base font-semibold text-zinc-900 tracking-tight font-display">
              Documents &amp; Base de Connaissances
            </h1>
            <span className="text-xs font-mono text-zinc-400" style={MONO}>
              • {documents.length} document{documents.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Actions Right */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTemplatesModalOpen(true)}
            className="h-7 px-2.5 text-xs font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>✦ Modèles d&apos;agence</span>
          </button>

          <button
            type="button"
            onClick={handleCreateBlank}
            disabled={creating}
            className="h-7 px-2.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer font-sans"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{creating ? 'Création…' : '+ Nouveau Document (C)'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Filtres de Catégories & Recherche (Single Row Strip) ── */}
      <div className="bg-white border border-zinc-200 rounded-lg p-1.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Underlined Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.key;
            const count = tab.key === 'all'
              ? documents.length
              : documents.filter((d) => d.category === tab.categoryFilter).length;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all cursor-pointer relative',
                  isSelected
                    ? 'text-zinc-900 font-bold'
                    : 'text-zinc-500 hover:text-zinc-800'
                )}
              >
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      'ml-1.5 px-1 py-0.2 rounded text-[10px] font-mono',
                      isSelected ? 'bg-zinc-100 text-zinc-900 font-bold' : 'text-zinc-400'
                    )}
                    style={MONO}
                  >
                    {count}
                  </span>
                )}

                {/* 2px Emerald Underline */}
                {isSelected && (
                  <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-emerald-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Filtrer... (/)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 w-40 sm:w-48 pl-8 pr-2 text-xs border border-zinc-200 rounded-md bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* View Mode Switcher (24px) */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200/60 h-7 text-xs font-mono" style={MONO}>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1',
                viewMode === 'list' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500 hover:text-zinc-800'
              )}
              title="Vue Liste"
            >
              <TableIcon className="w-3 h-3" />
              <span className="hidden sm:inline">Liste</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1',
                viewMode === 'grid' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500 hover:text-zinc-800'
              )}
              title="Vue Grille"
            >
              <LayoutGrid className="w-3 h-3" />
              <span className="hidden sm:inline">Grille</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Ruban de Modèles d'Amorce Rapide (Quick Starter Templates - 44px) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {QUICK_STARTERS.map((starter) => {
          const Icon = starter.icon;
          return (
            <button
              key={starter.key}
              type="button"
              onClick={() => handleCreateQuickStarter(starter)}
              disabled={creating}
              className="border border-zinc-200 hover:border-emerald-500/60 hover:bg-emerald-50/20 bg-white rounded-lg p-2.5 flex items-center gap-2.5 text-left text-xs font-medium text-zinc-800 transition-all cursor-pointer shadow-2xs group h-11 disabled:opacity-50"
            >
              <div className={cn('w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs', starter.color)}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="truncate group-hover:text-emerald-700 transition-colors">
                {starter.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Bulk Actions Bar ── */}
      {selectedDocIds.size > 0 && (
        <div className="bg-zinc-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {selectedDocIds.size} document{selectedDocIds.size > 1 ? 's sélectionnés' : ' sélectionné'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDocIds(new Set())}
              className="px-2.5 py-1 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              Tout désélectionner
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isDeletingBulk}
              className="px-3 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer ({selectedDocIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 4. DataTable Documentaire Monolithique (Linear Docs Style) ── */}
      {loading ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center text-xs text-zinc-400 font-mono" style={MONO}>
          Chargement des documents…
        </div>
      ) : viewMode === 'list' ? (
        <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/70 text-[10px] uppercase font-bold text-zinc-500 tracking-wider h-8">
                  <th className="pl-3.5 pr-1 w-8 text-left">
                    <input
                      type="checkbox"
                      checked={selectedDocIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                      title="Tout sélectionner"
                    />
                  </th>
                  <th className="py-2 px-3 font-semibold">Titre du Document</th>
                  <th className="py-2 px-3 font-semibold">Catégorie / Tag</th>
                  <th className="py-2 px-3 font-semibold">Auteur</th>
                  <th className="py-2 px-3 font-semibold">Dernière Modification</th>
                  <th className="py-2 px-3 font-semibold">Statut</th>
                  <th className="py-2 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {filteredDocuments.length === 0 ? (
                  /* ── Single Proactive Inline Empty State ── */
                  <tr>
                    <td colSpan={7} className="py-8 px-4 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                        <FileText className="w-6 h-6 text-zinc-300" />
                        <p className="text-xs font-semibold text-zinc-800">Aucun document trouvé</p>
                        <p className="text-[11px] text-zinc-400">
                          {searchQuery
                            ? `Aucun résultat pour « ${searchQuery} ».`
                            : 'Cliquez sur l’un des modèles d’amorce ci-dessus ou appuyez sur « C » pour rédiger.'}
                        </p>
                        <button
                          type="button"
                          onClick={handleCreateBlank}
                          className="mt-1 px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                        >
                          + Créer un document vierge
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => {
                    const isSelected = selectedDocIds.has(doc.id);
                    const catStyle = CATEGORY_STYLES[doc.category || 'general'] || CATEGORY_STYLES.general;
                    const dateStr = doc.updated_at
                      ? new Date(doc.updated_at).toLocaleDateString('fr-CA', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '24 août 2026';

                    return (
                      <tr
                        key={doc.id}
                        onDoubleClick={() => router.push(`/documents/${doc.id}`)}
                        className={cn(
                          'hover:bg-zinc-50/80 transition-colors h-9 cursor-pointer group',
                          isSelected && 'bg-emerald-50/30'
                        )}
                      >
                        {/* 1. Checkbox */}
                        <td className="pl-3.5 pr-1 py-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelectDoc(doc.id, e as unknown as React.MouseEvent)}
                            className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* 2. Titre */}
                        <td className="py-2 px-3 font-medium text-zinc-900 max-w-sm">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleTogglePin(e, doc)}
                              className="text-zinc-300 hover:text-amber-500 transition-colors cursor-pointer"
                              title={doc.is_pinned ? 'Désépingler' : 'Épingler'}
                            >
                              <Pin
                                className={cn(
                                  'w-3 h-3',
                                  doc.is_pinned ? 'text-amber-500 fill-amber-500' : 'opacity-0 group-hover:opacity-100'
                                )}
                              />
                            </button>
                            <span
                              onClick={() => router.push(`/documents/${doc.id}`)}
                              className="font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors truncate"
                            >
                              {doc.title || 'Document sans titre'}
                            </span>
                          </div>
                        </td>

                        {/* 3. Catégorie / Tag */}
                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              'px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border whitespace-nowrap',
                              catStyle.bg,
                              catStyle.text,
                              catStyle.border
                            )}
                            style={MONO}
                          >
                            {catStyle.label}
                          </span>
                        </td>

                        {/* 4. Auteur */}
                        <td className="py-2 px-3 font-mono text-[11px] text-zinc-600 whitespace-nowrap" style={MONO}>
                          Minerva
                        </td>

                        {/* 5. Date */}
                        <td className="py-2 px-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap" style={MONO}>
                          {dateStr}
                        </td>

                        {/* 6. Statut */}
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" style={MONO}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Actif</span>
                          </span>
                        </td>

                        {/* 7. Actions */}
                        <td className="py-2 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(e, doc)}
                              className="p-1 text-zinc-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <Link
                              href={`/documents/${doc.id}`}
                              className="px-2 py-0.5 rounded text-[11px] font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition-colors inline-flex items-center gap-0.5"
                            >
                              <span>Éditer</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
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
      ) : (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDocuments.length === 0 ? (
            <div className="col-span-3 bg-white border border-zinc-200 rounded-lg p-12 text-center space-y-2">
              <FileText className="w-6 h-6 text-zinc-300 mx-auto" />
              <p className="text-xs font-semibold text-zinc-800">Aucun document trouvé</p>
            </div>
          ) : (
            filteredDocuments.map((doc) => {
              const isSelected = selectedDocIds.has(doc.id);
              const catStyle = CATEGORY_STYLES[doc.category || 'general'] || CATEGORY_STYLES.general;

              return (
                <div
                  key={doc.id}
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  className={cn(
                    'bg-white border rounded-lg p-3.5 shadow-2xs transition-all cursor-pointer flex flex-col justify-between group space-y-3 relative',
                    isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-zinc-200 hover:border-zinc-300'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectDoc(doc.id, e as unknown as React.MouseEvent)}
                          className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                        />
                      </div>
                      <span
                        className={cn(
                          'px-1.5 py-0.2 rounded text-[10px] font-mono font-medium border',
                          catStyle.bg,
                          catStyle.text,
                          catStyle.border
                        )}
                        style={MONO}
                      >
                        {catStyle.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, doc)}
                      className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors truncate">
                      {doc.title || 'Document sans titre'}
                    </h3>
                    <div className="text-[10.5px] font-mono text-zinc-400 mt-1 flex items-center gap-1" style={MONO}>
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{new Date(doc.updated_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400 font-mono text-[10px]" style={MONO}>
                      Réf: {doc.id.slice(0, 8)}
                    </span>
                    <span className="text-emerald-700 font-medium group-hover:underline inline-flex items-center gap-0.5">
                      <span>Éditer</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Agency Templates Modal */}
      <AgencyTemplatesModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        onSelect={(template: AgencyTemplate) => {
          setTemplatesModalOpen(false);
          handleCreateQuickStarter({
            key: template.key,
            title: template.title,
            category: template.category,
            icon: FileText,
            color: 'text-emerald-600 bg-emerald-50',
            defaultBlocks: template.defaultBlocks,
          });
        }}
      />

    </div>
  );
}
