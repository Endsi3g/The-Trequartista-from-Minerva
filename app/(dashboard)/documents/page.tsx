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
  Download,
  Share2,
  Pin,
  PinOff,
  User,
  Building2,
  FolderKanban,
  CheckSquare,
  Globe,
  Lock,
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
  const { toastSuccess, toastError } = useToast();

  const [documents, setDocuments] = useState<TeamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [zipping, setZipping] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

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
    await deleteDocument(doc.id);
    toastSuccess('Document supprimé', 'Le document a été retiré.');
  };

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return documents.filter((doc) => {
      if (q) {
        const matchTitle = doc.title.toLowerCase().includes(q);
        const matchText = doc.content_text?.toLowerCase().includes(q) || false;
        const matchClient = doc.client_name?.toLowerCase().includes(q) || false;
        const matchProject = doc.project_name?.toLowerCase().includes(q) || false;
        if (!matchTitle && !matchText && !matchClient && !matchProject) return false;
      }
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
        return false;
      }
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
                    ? 'bg-zinc-850 text-white border-zinc-850 shadow-2xs'
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
          </div>
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
