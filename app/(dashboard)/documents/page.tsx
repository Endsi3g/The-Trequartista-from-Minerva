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
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { fetchDocuments, addDocument, deleteDocument } from '@/lib/services/supabase-data';
import type { TeamDocument } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function DocumentsPage() {
  const router = useRouter();
  const { id: userId } = useCurrentUser();
  const confirmDialog = useConfirm();
  const { toastSuccess, toastError } = useToast();

  const [documents, setDocuments] = useState<TeamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
        handleCreate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userId]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const doc = await addDocument('Document sans titre', userId || null);
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
      if (!q) return true;
      return doc.title.toLowerCase().includes(q);
    });
  }, [documents, searchQuery]);

  return (
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ── 1. Compact Header Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">
              Documents & Wiki d’Équipe
            </h1>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              ({documents.length} note{documents.length > 1 ? 's' : ''})
            </span>
          </div>
        </div>

        {/* Right Controls: View Switcher & Action Button */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* Segmented Control [ Grille | Liste ] */}
          <div className="flex items-center bg-zinc-100/80 border border-mv-border rounded-[5px] p-0.5 text-[11px] font-medium">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'grid'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Grille</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'list'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <TableIcon className="w-3 h-3" />
              <span>Liste</span>
            </button>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="h-7 px-3 rounded-[4px] bg-mv-green hover:bg-emerald-700 text-white text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0 disabled:opacity-50"
            title="Nouveau Document (Touche C)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{creating ? 'Création…' : 'Nouveau Document'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Unified Search Toolbar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-2.5 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un document, brief... (/)"
            className="w-full h-7 pl-7 pr-2 text-[11.5px] rounded-[4px] border border-mv-border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-mv-green transition-colors"
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

        <span className="text-[11px] font-mono text-zinc-400 shrink-0" style={MONO}>
          {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* ── 3. Main Views: Grid vs 36px DataTable ── */}
      {loading ? (
        <p className="text-xs text-zinc-400 text-center py-12 font-mono">Chargement des documents…</p>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-2">
          <FileText className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="text-xs font-semibold text-zinc-700">Aucun document pour le moment</p>
          <p className="text-[11px] text-zinc-400">Cliquez sur « Nouveau Document » ou appuyez sur C pour créer un brief partagé.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Compact Cards Grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => router.push(`/documents/${doc.id}`)}
              className="bg-mv-surface border border-mv-border hover:border-zinc-300 rounded-[6px] p-3.5 shadow-2xs transition-all cursor-pointer flex flex-col justify-between group space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-7 h-7 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0 group-hover:border-mv-green transition-colors">
                  <FileText className="w-3.5 h-3.5" />
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
                <h3 className="text-[13px] font-semibold text-zinc-900 group-hover:text-mv-green transition-colors truncate">
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
                <span className="text-mv-green font-medium group-hover:underline inline-flex items-center gap-0.5">
                  <span>Éditer</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── 36px DataTable View (Linear Docs Style) ── */
        <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr className="h-7 bg-black/[0.02] border-b border-mv-border text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                <th className="pl-3.5 pr-2 text-left font-medium">Titre du Document</th>
                <th className="px-2 text-left font-medium">Identifiant</th>
                <th className="px-2 text-right font-medium">Dernière Modification</th>
                <th className="pr-3.5 pl-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  className="h-9 border-b border-mv-border last:border-0 hover:bg-black/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="pl-3.5 pr-2 py-1.5 min-w-0 max-w-[320px]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-semibold text-zinc-900 truncate group-hover:text-mv-green transition-colors">
                        {doc.title || 'Document sans titre'}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-[10.5px] font-mono text-zinc-400" style={MONO}>
                    {doc.id.slice(0, 8)}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-[11px] text-zinc-500 whitespace-nowrap" style={MONO}>
                    {new Date(doc.updated_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="pr-3.5 pl-2 py-1.5 text-right whitespace-nowrap space-x-2">
                    <button
                      onClick={(e) => handleDelete(e, doc)}
                      className="text-zinc-400 hover:text-rose-600 p-1 transition-colors opacity-0 group-hover:opacity-100"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-medium text-mv-green group-hover:underline inline-flex items-center gap-0.5">
                      <span>Éditer</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageFadeIn>
  );
}
