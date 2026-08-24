'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { SkeletonCards } from '@/components/ui/skeleton';
import { useToast } from '@/components/providers/ToastProvider';
import { fetchDocuments, addDocument, deleteDocument, togglePinDocument } from '@/lib/services/supabase-data';
import type { TeamDocument } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { AgencyTemplatesModal } from '@/components/documents/AgencyTemplatesModal';
import { AGENCY_TEMPLATES, AgencyTemplate } from '@/components/documents/templates';
import { blocksToMarkdown } from '@/components/documents/utils';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const CATEGORIES = [
  { key: 'all', label: 'Tous les documents' },
  { key: 'product_brief', label: 'Dossiers Produits' },
  { key: 'meeting_notes', label: 'Comptes-rendus' },
  { key: 'spec', label: 'Cahiers des charges' },
  { key: 'sop', label: 'SOPs & Guides' },
  { key: 'proposal', label: 'Propositions & Devis' },
];

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [zipping, setZipping] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

  // Multi-selection state
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

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

  // Keyboard shortcut: 'C' to create, '/' to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key.toLowerCase() === 'c') {
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

  const handleCreateFromTemplate = async (template: AgencyTemplate) => {
    setCreating(true);
    try {
      const doc = await addDocument(template.title, userId || null, {
        category: template.category,
        contentJson: { blocks: template.defaultBlocks },
      });
      if (doc) {
        setTemplatesModalOpen(false);
        toastSuccess('Modèle instancié', `« ${template.title} » créé avec succès.`);
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
      if (selectedType === 'brief' && !doc.title.toLowerCase().includes('brief')) return false;
      if (
        selectedType === 'meeting' &&
        !doc.title.toLowerCase().includes('compte') &&
        !doc.title.toLowerCase().includes('réunion') &&
        !doc.title.toLowerCase().includes('sync')
      )
        return false;
      if (
        selectedType === 'spec' &&
        !doc.title.toLowerCase().includes('spec') &&
        !doc.title.toLowerCase().includes('tech') &&
        !doc.title.toLowerCase().includes('archi')
      )
        return false;
      return true;
    });
  }, [documents, searchQuery, selectedCategory]);

  const pinnedDocuments = useMemo(() => filteredDocuments.filter((d) => d.is_pinned), [filteredDocuments]);
  const otherDocuments = useMemo(() => filteredDocuments.filter((d) => !d.is_pinned), [filteredDocuments]);

  const allVisibleSelected = filteredDocuments.length > 0 && filteredDocuments.every((d) => selectedIds.has(d.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        filteredDocuments.forEach((d) => next.delete(d.id));
        return next;
      }
      const next = new Set(prev);
      filteredDocuments.forEach((d) => next.add(d.id));
      return next;
    });
  };

  const toggleOne = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sanitizeFilename = (title: string) =>
    (title || 'document-sans-titre').replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'document';

  const handleDownloadZip = async () => {
    const selected = documents.filter((d) => selectedIds.has(d.id));
    if (selected.length === 0) return;
    setZipping(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      for (const doc of selected) {
        let md = '';
        if (doc.content_json?.blocks && doc.content_json.blocks.length > 0) {
          md = blocksToMarkdown(doc.content_json.blocks, doc.title);
        } else {
          const cached = typeof window !== 'undefined' ? localStorage.getItem(`minerva_doc_content_${doc.id}`) : null;
          md = cached || doc.content_text || `# ${doc.title}\n\n*Document d'équipe rédigé sur Minerva*\n`;
        }
        zip.file(`${sanitizeFilename(doc.title)}.md`, md);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `documents-minerva-${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      toastSuccess('Téléchargement ZIP', `${selected.length} document(s) exporté(s).`);
    } catch {
      toastError('Erreur', 'Impossible de générer l’archive ZIP.');
    } finally {
      setZipping(false);
    }
  };

  const handleCopyLinks = async () => {
    const selected = documents.filter((d) => selectedIds.has(d.id));
    if (selected.length === 0) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = selected.map((d) => `${d.title} : ${origin}/documents/${d.id}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toastSuccess('Liens copiés', `${selected.length} lien(s) copié(s) dans le presse-papier.`);
    } catch {
      toastError('Erreur', 'Impossible de copier les liens.');
    }
  };

  return (
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ── 1. Top Ribbon & Actions ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[4px] bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <span>Documents & Wiki d&apos;Équipe</span>
              <span style={MONO} className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-200 text-zinc-700">
                {documents.length}
              </span>
            </h1>
            <p className="text-xs text-zinc-500">
              Espace de rédaction collaboratif, dossiers de spécifications et modèles d&apos;agence.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTemplatesModalOpen(true)}
            className="h-8 px-3 rounded-[4px] border border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Modèles d&apos;agence</span>
          </button>
          <button
            type="button"
            onClick={handleCreateBlank}
            disabled={creating}
            className="h-8 px-3.5 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{creating ? 'Création…' : 'Nouveau document'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Filters, Categories & Search Bar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  'px-2.5 py-1 rounded-[4px] text-[11.5px] font-medium transition-colors cursor-pointer shrink-0 border',
                  isSelected
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search & View Mode Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher (titre, contenu)…"
              className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-zinc-200 rounded-[4px] focus:outline-none focus:border-emerald-500 placeholder:text-zinc-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center rounded-[4px] border border-zinc-200 bg-white p-0.5 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="Vue liste"
              className={cn(
                'p-1.5 rounded-[3px] transition-colors cursor-pointer',
                viewMode === 'list' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
              )}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Vue grille"
              className={cn(
                'p-1.5 rounded-[3px] transition-colors cursor-pointer',
                viewMode === 'grid' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Bulk Selection Floating Bar ── */}
      {selectedIds.size > 0 && (
        <div className="p-2.5 rounded-[6px] bg-zinc-900 text-white shadow-xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 pl-1">
            <span style={MONO} className="font-bold text-emerald-400">
              {selectedIds.size}
            </span>
            <span>document(s) sélectionné(s)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLinks}
              className="h-7 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3 h-3" />
              <span>Copier les liens</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={zipping}
              className="h-7 px-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3 h-3" />
              <span>{zipping ? 'Création ZIP…' : 'Télécharger en ZIP'}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="p-1 text-zinc-400 hover:text-white cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── 3.5 Floating Bulk Selection Action Bar ── */}
      {selectedDocIds.size > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-[6px] px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold text-rose-900">
              {selectedDocIds.size} document{selectedDocIds.size > 1 ? 's' : ''} sélectionné{selectedDocIds.size > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDocIds(new Set())}
              className="px-2.5 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-md transition-colors cursor-pointer"
            >
              Désélectionner tout
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isDeletingBulk}
              className="px-3 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer la sélection ({selectedDocIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 4. Main Views: 36px DataTable vs Compact Cards Grid ── */}
      {loading ? (
        <p className="text-xs text-zinc-400 text-center py-12 font-mono">Chargement des documents…</p>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-2">
          <FileText className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="text-xs font-semibold text-zinc-700">Aucun document trouvé</p>
          <p className="text-[11px] text-zinc-400">Cliquez sur l’un des modèles d’amorce ci-dessus ou appuyez sur « C » pour rédiger.</p>
        </div>
      ) : viewMode === 'list' ? (
        /* ── 36px DataTable View (Linear Docs Style with Checkboxes) ── */
        <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="h-7 bg-black/[0.02] border-b border-mv-border text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                <th className="pl-3.5 pr-1 w-8 text-left">
                  <input
                    type="checkbox"
                    checked={selectedDocIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                    title="Tout sélectionner"
                  />
                </th>
                <th className="px-2 text-left font-medium">Titre du Document</th>
                <th className="px-2 text-left font-medium">Catégorie</th>
                <th className="px-2 text-left font-medium">Auteur</th>
                <th className="px-2 text-right font-medium">Dernière Modification</th>
                <th className="pr-3.5 pl-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => {
                let categoryLabel = 'Doc';
                const lower = doc.title.toLowerCase();
                if (lower.includes('brief')) categoryLabel = 'Brief';
                else if (lower.includes('compte') || lower.includes('réunion') || lower.includes('sync')) categoryLabel = 'Réunion';
                else if (lower.includes('spec') || lower.includes('tech') || lower.includes('archi')) categoryLabel = 'Tech Spec';

                const isSelected = selectedDocIds.has(doc.id);

                return (
                  <tr
                    key={doc.id}
                    onClick={() => router.push(`/documents/${doc.id}`)}
                    className={cn(
                      'h-9 border-b border-mv-border last:border-0 transition-colors cursor-pointer group',
                      isSelected ? 'bg-emerald-50/40' : 'hover:bg-black/[0.02]'
                    )}
                  >
                    <td className="pl-3.5 pr-1 py-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectDoc(doc.id, e as unknown as React.MouseEvent)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-1 min-w-0 max-w-[320px]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="font-semibold text-zinc-900 truncate group-hover:text-emerald-700 transition-colors">
                          {doc.title || 'Document sans titre'}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-medium border border-zinc-200/50">
                        {categoryLabel}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-zinc-600 text-[11px]">
                      Minerva
                    </td>
                    <td className="px-2 py-1 text-right font-mono text-[11px] text-zinc-500 whitespace-nowrap" style={MONO}>
                      {new Date(doc.updated_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="pr-3.5 pl-2 py-1 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={(e) => handleDelete(e, doc)}
                        className="text-zinc-400 hover:text-rose-600 p-1 transition-colors opacity-0 group-hover:opacity-100"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-medium text-emerald-700 group-hover:underline inline-flex items-center gap-0.5">
                        <span>Éditer</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Compact Cards Grid with Checkbox support ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDocuments.map((doc) => {
            const isSelected = selectedDocIds.has(doc.id);
            return (
              <div
                key={doc.id}
                onClick={() => router.push(`/documents/${doc.id}`)}
                className={cn(
                  'bg-mv-surface border rounded-[6px] p-3.5 shadow-2xs transition-all cursor-pointer flex flex-col justify-between group space-y-3 relative',
                  isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-mv-border hover:border-zinc-300'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectDoc(doc.id, e as unknown as React.MouseEvent)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                    </div>
                    <div className="w-7 h-7 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0 group-hover:border-emerald-600 transition-colors">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, doc)}
                    className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Supprimer le document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h3 className="text-[13px] font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors truncate">
                    {doc.title || 'Document sans titre'}
                  </h3>
                  <div className="text-[10.5px] font-mono text-zinc-400 mt-1 flex items-center gap-1" style={MONO}>
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>Modifié le {new Date(doc.updated_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-mv-border/60 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 font-mono text-[10px]" style={MONO}>
                    Réf: {doc.id.slice(0, 8)}
                  </span>
                  <span className="text-emerald-700 font-medium group-hover:underline inline-flex items-center gap-0.5">
                    <span>Éditer</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4. Main Documents Content ── */}
      {loading ? (
        <SkeletonCards count={6} />
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-3">
          <FileText className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="text-sm font-semibold text-zinc-800">Aucun document trouvé</p>
          <p className="text-xs text-zinc-400">
            {searchQuery
              ? `Aucun résultat pour « ${searchQuery} ». Essayez un autre terme.`
              : 'Commencez par créer un nouveau document ou choisissez un modèle d’agence.'}
          </p>
          <button
            type="button"
            onClick={handleCreateBlank}
            className="h-8 px-4 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Créer un document</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pinned Documents Section */}
          {pinnedDocuments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-1">
                <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Documents Épinglés ({pinnedDocuments.length})</span>
              </div>
              <DocumentsList
                documents={pinnedDocuments}
                viewMode={viewMode}
                selectedIds={selectedIds}
                toggleOne={toggleOne}
                handleTogglePin={handleTogglePin}
                handleDelete={handleDelete}
              />
            </div>
          )}

          {/* Other Documents Section */}
          {otherDocuments.length > 0 && (
            <div className="space-y-2">
              {pinnedDocuments.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1 pt-2">
                  <span>Autres Documents ({otherDocuments.length})</span>
                </div>
              )}
              <DocumentsList
                documents={otherDocuments}
                viewMode={viewMode}
                selectedIds={selectedIds}
                toggleOne={toggleOne}
                handleTogglePin={handleTogglePin}
                handleDelete={handleDelete}
              />
            </div>
          )}
        </div>
      )}

      {/* ── 5. Agency Templates Modal ── */}
      <AgencyTemplatesModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        onSelect={handleCreateFromTemplate}
        loading={creating}
      />
    </PageFadeIn>
  );
}

interface DocumentsListProps {
  documents: TeamDocument[];
  viewMode: 'grid' | 'list';
  selectedIds: Set<string>;
  toggleOne: (id: string, e: React.MouseEvent) => void;
  handleTogglePin: (e: React.MouseEvent, doc: TeamDocument) => Promise<void>;
  handleDelete: (e: React.MouseEvent, doc: TeamDocument) => Promise<void>;
}

function DocumentsList({
  documents,
  viewMode,
  selectedIds,
  toggleOne,
  handleTogglePin,
  handleDelete,
}: DocumentsListProps) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-zinc-200 rounded-[6px] overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium text-[11px]">
              <th className="w-8 py-2 px-3"></th>
              <th className="py-2 px-3 font-semibold">Titre du document</th>
              <th className="py-2 px-3 font-semibold hidden md:table-cell">Catégorie</th>
              <th className="py-2 px-3 font-semibold hidden lg:table-cell">Liaison</th>
              <th className="py-2 px-3 font-semibold hidden sm:table-cell">Dernière modif.</th>
              <th className="w-16 py-2 px-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {documents.map((doc) => {
              const isSelected = selectedIds.has(doc.id);
              const dateStr = new Date(doc.updated_at).toLocaleDateString('fr-CA', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <tr
                  key={doc.id}
                  className={cn(
                    'group hover:bg-zinc-50/80 transition-colors cursor-pointer',
                    isSelected && 'bg-emerald-50/40'
                  )}
                >
                  <td className="py-2.5 px-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleOne(doc.id, e as any)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <Link href={`/documents/${doc.id}`} className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors truncate max-w-sm">
                        {doc.title}
                      </span>
                      {doc.is_pinned && (
                        <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                      {doc.is_shared_with_client && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Portail client
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 hidden md:table-cell">
                    <span className="text-[10.5px] px-2 py-0.5 rounded-[4px] bg-zinc-100 text-zinc-600 font-medium">
                      {doc.category || 'Général'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 hidden lg:table-cell text-zinc-500 text-[11px]">
                    {doc.client_name ? (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-zinc-400" />
                        <span>{doc.client_name}</span>
                      </span>
                    ) : doc.project_name ? (
                      <span className="flex items-center gap-1">
                        <FolderKanban className="w-3 h-3 text-zinc-400" />
                        <span>{doc.project_name}</span>
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 hidden sm:table-cell text-zinc-400 font-mono text-[11px]">
                    {dateStr}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(e, doc)}
                        title={doc.is_pinned ? 'Désépingler' : 'Épingler'}
                        className="p-1 rounded text-zinc-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                      >
                        {doc.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, doc)}
                        title="Supprimer"
                        className="p-1 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {documents.map((doc) => {
        const isSelected = selectedIds.has(doc.id);
        const dateStr = new Date(doc.updated_at).toLocaleDateString('fr-CA', {
          month: 'short',
          day: 'numeric',
        });

        return (
          <div
            key={doc.id}
            className={cn(
              'group relative bg-white border rounded-[6px] p-3.5 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between space-y-3',
              isSelected ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/30' : 'border-zinc-200'
            )}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => toggleOne(doc.id, e as any)}
                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer mt-0.5"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => handleTogglePin(e, doc)}
                    title={doc.is_pinned ? 'Désépingler' : 'Épingler'}
                    className={cn(
                      'p-1 rounded transition-colors cursor-pointer',
                      doc.is_pinned ? 'text-amber-500' : 'text-zinc-300 hover:text-zinc-600'
                    )}
                  >
                    <Pin className={cn('w-3.5 h-3.5', doc.is_pinned && 'fill-amber-500')} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, doc)}
                    title="Supprimer"
                    className="p-1 rounded text-zinc-300 hover:text-red-600 hover:bg-red-50 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <Link href={`/documents/${doc.id}`} className="block group-hover:text-emerald-700">
                <h3 className="text-xs font-bold text-zinc-900 line-clamp-2 leading-snug">
                  {doc.title}
                </h3>
              </Link>

              <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed font-mono">
                {doc.content_text || 'Document d\'équipe prêt à être édité.'}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[10.5px] text-zinc-400">
              <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
                {doc.category || 'Général'}
              </span>
              <span style={MONO}>{dateStr}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
