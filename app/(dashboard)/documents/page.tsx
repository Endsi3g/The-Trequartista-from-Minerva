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
  FileSpreadsheet,
  FileCode2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { fetchDocuments, addDocument, deleteDocument } from '@/lib/services/supabase-data';
import type { TeamDocument } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const TEMPLATES = [
  {
    key: 'brief',
    label: 'Brief Projet',
    icon: FileText,
    desc: 'Objectifs, livrables & contraintes',
    boilerplateTitle: 'Brief Projet — Refonte & Stratégie',
  },
  {
    key: 'meeting',
    label: 'Compte-rendu de réunion',
    icon: Calendar,
    desc: 'Ordre du jour, décisions & next steps',
    boilerplateTitle: 'Compte-rendu — Sync Hebdomadaire',
  },
  {
    key: 'tech-spec',
    label: 'Spécification technique',
    icon: FileCode2,
    desc: 'Architecture, APIs & recette QA',
    boilerplateTitle: 'Spécification Technique — Architecture Flow',
  },
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
  const [selectedType, setSelectedType] = useState<'all' | 'brief' | 'meeting' | 'spec'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

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

  const handleCreate = async (defaultTitle?: string) => {
    setCreating(true);
    try {
      const doc = await addDocument(defaultTitle || 'Document sans titre', userId || null);
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
      if (q && !doc.title.toLowerCase().includes(q)) return false;
      if (selectedType === 'brief' && !doc.title.toLowerCase().includes('brief')) return false;
      if (selectedType === 'meeting' && !doc.title.toLowerCase().includes('compte') && !doc.title.toLowerCase().includes('réunion') && !doc.title.toLowerCase().includes('sync')) return false;
      if (selectedType === 'spec' && !doc.title.toLowerCase().includes('spec') && !doc.title.toLowerCase().includes('tech') && !doc.title.toLowerCase().includes('archi')) return false;
      return true;
    });
  }, [documents, searchQuery, selectedType]);

  return (
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ── 1. Header & Integrated Controls ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">
              Documents d’équipe
            </h1>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              ({documents.length} doc{documents.length > 1 ? 's' : ''})
            </span>
          </div>
        </div>

        {/* Right Controls */}
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
            onClick={() => handleCreate()}
            disabled={creating}
            className="h-7 px-3 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0 disabled:opacity-50"
            title="Nouveau Document (Touche C)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Document</span>
            <kbd className="hidden sm:inline text-[9px] bg-white/20 px-1 py-0.2 rounded font-mono">C</kbd>
          </button>
        </div>
      </div>

      {/* ── 2. Quick-Start Templates Micro-Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {TEMPLATES.map((tmpl) => {
          const Icon = tmpl.icon;
          return (
            <button
              key={tmpl.key}
              onClick={() => handleCreate(tmpl.boilerplateTitle)}
              disabled={creating}
              className="bg-mv-surface border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 p-2.5 rounded-[6px] text-left transition-all cursor-pointer flex items-center gap-3 shadow-2xs group"
            >
              <div className="w-7 h-7 rounded-[4px] bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-700 group-hover:border-emerald-600 group-hover:text-emerald-700 transition-colors shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors truncate">
                  {tmpl.label}
                </div>
                <div className="text-[10.5px] text-zinc-400 truncate">
                  {tmpl.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 3. Unified Search & Type Filter Toolbar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-2.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Type Segmented Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedType('all')}
            className={cn(
              'px-2.5 py-1 text-xs font-medium transition-all cursor-pointer rounded-[4px]',
              selectedType === 'all'
                ? 'bg-zinc-100 text-zinc-900 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.02]'
            )}
          >
            Tous
          </button>
          <button
            onClick={() => setSelectedType('brief')}
            className={cn(
              'px-2.5 py-1 text-xs font-medium transition-all cursor-pointer rounded-[4px]',
              selectedType === 'brief'
                ? 'bg-zinc-100 text-zinc-900 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.02]'
            )}
          >
            Briefs
          </button>
          <button
            onClick={() => setSelectedType('meeting')}
            className={cn(
              'px-2.5 py-1 text-xs font-medium transition-all cursor-pointer rounded-[4px]',
              selectedType === 'meeting'
                ? 'bg-zinc-100 text-zinc-900 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.02]'
            )}
          >
            Notes de réunion
          </button>
          <button
            onClick={() => setSelectedType('spec')}
            className={cn(
              'px-2.5 py-1 text-xs font-medium transition-all cursor-pointer rounded-[4px]',
              selectedType === 'spec'
                ? 'bg-zinc-100 text-zinc-900 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.02]'
            )}
          >
            Specs techniques
          </button>
        </div>

        {/* Right Search Input */}
        <div className="relative shrink-0 w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrer les documents... (/)"
            className="w-full h-8 pl-8 pr-2.5 text-[11.5px] rounded-[4px] border border-mv-border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-mv-green transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── 4. Main Views: 36px DataTable vs Compact Cards Grid ── */}
      {loading ? (
        <p className="text-xs text-zinc-400 text-center py-12 font-mono">Chargement des documents…</p>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-3">
          <FileText className="w-8 h-8 text-zinc-300 mx-auto" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-700">Aucun document trouvé</p>
            <p className="text-[11px] text-zinc-400">Cliquez sur l’un des modèles d’amorce ci-dessus ou appuyez sur « C » pour rédiger.</p>
          </div>
          <button
            type="button"
            onClick={() => handleCreate()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mv-green hover:bg-mv-green/90 text-white text-[11.5px] font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau document</span>
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* ── 36px DataTable View (Linear Docs Style) ── */
        <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="h-7 bg-black/[0.02] border-b border-mv-border text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                <th className="pl-3.5 pr-2 text-left font-medium">Titre du Document</th>
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

                return (
                  <tr
                    key={doc.id}
                    onClick={() => router.push(`/documents/${doc.id}`)}
                    className="h-9 border-b border-mv-border last:border-0 hover:bg-black/[0.02] transition-colors cursor-pointer group"
                  >
                    <td className="pl-3.5 pr-2 py-1 min-w-0 max-w-[320px]">
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
        /* ── Compact Cards Grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => router.push(`/documents/${doc.id}`)}
              className="bg-mv-surface border border-mv-border hover:border-zinc-300 rounded-[6px] p-3.5 shadow-2xs transition-all cursor-pointer flex flex-col justify-between group space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-7 h-7 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0 group-hover:border-emerald-600 transition-colors">
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
          ))}
        </div>
      )}
    </PageFadeIn>
  );
}
