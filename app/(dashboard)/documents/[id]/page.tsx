'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  Check,
  Copy,
  History,
  Pin,
  PinOff,
  Globe,
  Lock,
  Eye,
  Edit3,
  Layers,
  Share2,
  Building2,
  FolderKanban,
  Save,
} from 'lucide-react';
import { RealtimeAvatarStack } from '@/components/realtime-avatar-stack';
import {
  fetchDocument,
  renameDocument,
  saveDocumentContent,
  updateDocumentMeta,
  togglePinDocument,
  fetchDocumentVersions,
  createDocumentVersion,
  restoreDocumentVersion,
  fetchClients,
  fetchProjects,
} from '@/lib/services/supabase-data';
import type { TeamDocument, DocumentBlock, DocumentVersion, Client, Project } from '@/lib/types';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/components/providers/ToastProvider';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { BlockEditor } from '@/components/documents/BlockEditor';
import { AiPageToolbar } from '@/components/documents/AiPageToolbar';
import { DocumentVersionHistory } from '@/components/documents/DocumentVersionHistory';
import { blocksToMarkdown, markdownToBlocks, blocksToPlainText, generateBlockId } from '@/components/documents/utils';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const CATEGORIES = [
  { key: 'general', label: 'Général' },
  { key: 'product_brief', label: 'Dossier Produit' },
  { key: 'meeting_notes', label: 'Compte-rendu' },
  { key: 'spec', label: 'Cahier des charges' },
  { key: 'sop', label: 'SOP & Process' },
  { key: 'proposal', label: 'Proposition' },
];

export default function DocumentEditorPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { id: userId, fullName, avatarUrl } = useCurrentUser();
  const { toastSuccess, toastError } = useToast();

  const [doc, setDoc] = useState<TeamDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<DocumentBlock[]>([]);
  const [viewMode, setViewMode] = useState<'blocks' | 'preview'>('blocks');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedStatus, setSavedStatus] = useState<'saved' | 'saving'>('saved');
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const titleDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!rawId) return;
    (async () => {
      setLoading(true);
      try {
        const [docData, versionsData, clientsData, projectsData] = await Promise.all([
          fetchDocument(rawId),
          fetchDocumentVersions(rawId),
          fetchClients().catch(() => []),
          fetchProjects().catch(() => []),
        ]);

        setDoc(docData);
        setTitle(docData?.title || 'Document sans titre');
        setVersions(versionsData);
        setClients(clientsData);
        setProjects(projectsData);

        // Populate blocks: check doc.content_json first, then fallback to markdown cache
        if (docData?.content_json?.blocks && docData.content_json.blocks.length > 0) {
          setBlocks(docData.content_json.blocks);
        } else {
          const cacheKey = `minerva_doc_content_${rawId}`;
          const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
          const initialText = cached || docData?.content_text || '';
          if (initialText) {
            setBlocks(markdownToBlocks(initialText));
          } else {
            setBlocks([
              { id: generateBlockId(), type: 'heading_1', content: docData?.title || 'Document' },
              { id: generateBlockId(), type: 'paragraph', content: '' },
            ]);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [rawId]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setSavedStatus('saving');
    if (titleDebounce.current) clearTimeout(titleDebounce.current);
    titleDebounce.current = setTimeout(async () => {
      if (rawId) {
        await renameDocument(rawId, newTitle || 'Document sans titre');
        setSavedStatus('saved');
      }
    }, 500);
  };

  const handleBlocksChange = (newBlocks: DocumentBlock[]) => {
    setBlocks(newBlocks);
    setSavedStatus('saving');

    if (contentDebounce.current) clearTimeout(contentDebounce.current);
    contentDebounce.current = setTimeout(async () => {
      if (!rawId) return;
      const plainText = blocksToPlainText(newBlocks);
      const markdown = blocksToMarkdown(newBlocks, title);

      if (typeof window !== 'undefined') {
        localStorage.setItem(`minerva_doc_content_${rawId}`, markdown);
      }

      await saveDocumentContent(rawId, { blocks: newBlocks }, plainText, title);
      setSavedStatus('saved');
    }, 600);
  };

  const handleTogglePin = async () => {
    if (!doc || !rawId) return;
    const nextPin = !doc.is_pinned;
    setDoc((prev) => (prev ? { ...prev, is_pinned: nextPin } : null));
    await togglePinDocument(rawId, nextPin);
    toastSuccess(
      nextPin ? 'Document épinglé' : 'Document désépinglé',
      nextPin ? 'Affiché en favori en tête de liste.' : 'Retiré des favoris épinglés.'
    );
  };

  const handleToggleClientShare = async () => {
    if (!doc || !rawId) return;
    const nextShare = !doc.is_shared_with_client;
    setDoc((prev) => (prev ? { ...prev, is_shared_with_client: nextShare } : null));
    await updateDocumentMeta(rawId, { is_shared_with_client: nextShare });
    toastSuccess(
      nextShare ? 'Partage activé' : 'Partage désactivé',
      nextShare
        ? 'Le document est visible sur le portail client sécurisé.'
        : 'Le document est réservé à l’équipe interne.'
    );
  };

  const handleCategoryChange = async (category: string) => {
    if (!doc || !rawId) return;
    setDoc((prev) => (prev ? { ...prev, category } : null));
    await updateDocumentMeta(rawId, { category });
    toastSuccess('Catégorie mise à jour', `Classé dans « ${category} »`);
  };

  const handleClientLinkChange = async (clientId: string | null) => {
    if (!doc || !rawId) return;
    setDoc((prev) => (prev ? { ...prev, client_id: clientId } : null));
    await updateDocumentMeta(rawId, { client_id: clientId });
    toastSuccess('Liaison client', clientId ? 'Document associé au client.' : 'Liaison client retirée.');
  };

  const handleProjectLinkChange = async (projectId: string | null) => {
    if (!doc || !rawId) return;
    setDoc((prev) => (prev ? { ...prev, project_id: projectId } : null));
    await updateDocumentMeta(rawId, { project_id: projectId });
    toastSuccess('Liaison projet', projectId ? 'Document associé au projet.' : 'Liaison projet retirée.');
  };

  const handleCreateSnapshot = async () => {
    if (!rawId) return;
    const plainText = blocksToPlainText(blocks);
    const version = await createDocumentVersion(
      rawId,
      title,
      { blocks },
      plainText,
      userId || null
    );
    if (version) {
      setVersions((prev) => [version, ...prev]);
      toastSuccess('Snapshot créé', `Version ${version.version_number} enregistrée.`);
    }
  };

  const handleRestoreVersion = async (version: DocumentVersion) => {
    if (!rawId) return;
    await restoreDocumentVersion(rawId, version);
    setTitle(version.title);
    setBlocks(version.content_json?.blocks || []);
    toastSuccess('Version restaurée', `Version ${version.version_number} rechargée avec succès.`);
  };

  const handleExportMarkdown = () => {
    const md = blocksToMarkdown(blocks, title);
    const filename = `${(title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toastSuccess('Export Markdown', `« ${filename} » téléchargé.`);
  };

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      toastSuccess('Lien copié', 'Lien d\'accès au document copié dans le presse-papier.');
    } catch {
      toastError('Erreur', 'Impossible de copier le lien.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const wordCount = useMemo(() => {
    const text = blocksToPlainText(blocks).trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }, [blocks]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-6">
        <SkeletonText className="w-1/3 h-6" />
        <div className="space-y-2 pt-2">
          <SkeletonText className="w-full" />
          <SkeletonText className="w-full" />
          <SkeletonText className="w-4/5" />
        </div>
        <Skeleton className="w-full h-80 rounded-[6px]" />
      </div>
    );
  }

  if (!doc) {
    return (
      <PageFadeIn className="space-y-4 max-w-5xl mx-auto py-8">
        <Link href="/documents" className="text-xs font-medium text-emerald-700 hover:underline flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux documents
        </Link>
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-2">
          <FileText className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="text-sm font-semibold text-zinc-800">Document introuvable</p>
          <p className="text-xs text-zinc-400">Ce document a été retiré ou son identifiant est incorrect.</p>
        </div>
      </PageFadeIn>
    );
  }

  return (
    <PageFadeIn
      className={cn(
        'mx-auto space-y-3 pb-16 transition-all',
        isFullscreen ? 'fixed inset-0 z-50 bg-white p-4 max-w-none overflow-y-auto' : 'max-w-5xl'
      )}
    >
      {/* ── 1. Top Ribbon & Live Status Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] px-3.5 py-2 shadow-2xs flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap print:hidden">
        {/* Navigation & Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link
            href="/documents"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Documents</span>
          </Link>
          <span className="text-zinc-300">/</span>

          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Document sans titre"
            className="font-bold text-xs text-zinc-900 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-1.5 py-0.5 min-w-[140px] flex-1 truncate"
          />

          {/* Auto-save badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-zinc-100 text-[10.5px] font-mono text-zinc-500 shrink-0 select-none">
            {savedStatus === 'saving' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                <span>Sauvegarde…</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">Enregistré</span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Realtime Collaboration Avatars */}
          <RealtimeAvatarStack roomName={`doc-presence:${rawId || doc.id}`} />

          {/* Version History Button */}
          <button
            type="button"
            onClick={() => setVersionDrawerOpen(true)}
            title="Historique des versions"
            className="h-7 px-2 rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
          >
            <History className="w-3 h-3 text-zinc-500" />
            <span style={MONO} className="font-bold">v{versions.length > 0 ? Math.max(...versions.map(v => v.version_number)) : 1}</span>
          </button>

          {/* Pin Button */}
          <button
            type="button"
            onClick={handleTogglePin}
            title={doc.is_pinned ? 'Désépingler' : 'Épingler'}
            className={cn(
              'p-1.5 rounded border transition-colors cursor-pointer',
              doc.is_pinned ? 'border-amber-300 bg-amber-50 text-amber-600' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-100'
            )}
          >
            <Pin className={cn('w-3.5 h-3.5', doc.is_pinned && 'fill-amber-500')} />
          </button>

          {/* Client Share Toggle */}
          <button
            type="button"
            onClick={handleToggleClientShare}
            title={doc.is_shared_with_client ? 'Visible sur portail client' : 'Interne équipe'}
            className={cn(
              'p-1.5 rounded border transition-colors cursor-pointer',
              doc.is_shared_with_client
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-zinc-200 text-zinc-500 hover:bg-zinc-100'
            )}
          >
            {doc.is_shared_with_client ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded border border-zinc-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('blocks')}
              title="Édition en blocs"
              className={cn(
                'px-2 py-0.5 rounded-[3px] text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1',
                viewMode === 'blocks' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <Edit3 className="w-3 h-3" />
              <span>Éditer</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              title="Aperçu document"
              className={cn(
                'px-2 py-0.5 rounded-[3px] text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1',
                viewMode === 'preview' ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <Eye className="w-3 h-3" />
              <span>Aperçu</span>
            </button>
          </div>

          {/* Export Actions */}
          <button
            type="button"
            onClick={handleExportMarkdown}
            title="Exporter en Markdown"
            className="p-1.5 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handlePrint}
            title="Imprimer ou exporter en PDF"
            className="p-1.5 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
            className="p-1.5 rounded border border-zinc-200 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── 2. Metadata Bar (Category, Client, Project) ── */}
      <div className="bg-white border border-zinc-200 rounded-[6px] px-3.5 py-1.5 shadow-2xs flex items-center justify-between gap-3 text-xs text-zinc-600 flex-wrap print:hidden">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] text-zinc-400 font-semibold uppercase tracking-wider">Catégorie :</span>
            <select
              value={doc.category || 'general'}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="h-6 px-1.5 rounded bg-zinc-50 border border-zinc-200 text-[11px] font-medium text-zinc-800 focus:outline-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Client Link */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3 h-3 text-zinc-400" />
            <select
              value={doc.client_id || ''}
              onChange={(e) => handleClientLinkChange(e.target.value || null)}
              className="h-6 px-1.5 rounded bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-800 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="">Aucun client lié</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Project Link */}
          <div className="flex items-center gap-1.5">
            <FolderKanban className="w-3 h-3 text-zinc-400" />
            <select
              value={doc.project_id || ''}
              onChange={(e) => handleProjectLinkChange(e.target.value || null)}
              className="h-6 px-1.5 rounded bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-800 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="">Aucun projet lié</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Telemetry (Words, Blocks) */}
        <div className="flex items-center gap-3 text-[10.5px] text-zinc-400 font-mono">
          <span>{blocks.length} blocs</span>
          <span>•</span>
          <span>{wordCount} mots</span>
        </div>
      </div>

      {/* ── 2.5 Notion AI Document-Level Actions ── */}
      <div className="bg-gradient-to-r from-emerald-50/60 via-zinc-50/60 to-transparent dark:from-emerald-950/20 dark:via-zinc-900/40 p-3 rounded-[6px] border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-between gap-4">
        <AiPageToolbar
          blocks={blocks}
          documentTitle={title}
          onApplyBlocks={(newBlocks, mode) => {
            if (mode === 'prepend') {
              handleBlocksChange([...newBlocks, ...blocks]);
              toastSuccess('Contenu IA inséré en tête de page');
            } else if (mode === 'append') {
              handleBlocksChange([...blocks, ...newBlocks]);
              toastSuccess('Contenu IA inséré en fin de page');
            } else {
              handleBlocksChange(newBlocks);
              toastSuccess('Document remplacé par le contenu IA');
            }
          }}
        />
      </div>

      {/* ── 3. Main Document Canvas ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[6px] shadow-2xs p-6 md:p-10 min-h-[600px] text-zinc-900 dark:text-zinc-100 print:border-0 print:p-0 print:shadow-none">
        {viewMode === 'blocks' ? (
          <BlockEditor blocks={blocks} onChange={handleBlocksChange} workspaceContext="documents" />
        ) : (
          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-4">
            <h1 className="text-2xl font-bold font-display tracking-tight text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              {title}
            </h1>
            <BlockEditor blocks={blocks} onChange={() => {}} readOnly={true} workspaceContext="documents" />
          </div>
        )}
      </div>

      {/* ── 4. Version History Drawer ── */}
      <DocumentVersionHistory
        isOpen={versionDrawerOpen}
        onClose={() => setVersionDrawerOpen(false)}
        versions={versions}
        currentVersionNumber={versions.length > 0 ? Math.max(...versions.map(v => v.version_number)) : 1}
        onRestore={handleRestoreVersion}
        onCreateSnapshot={handleCreateSnapshot}
      />
    </PageFadeIn>
  );
}
