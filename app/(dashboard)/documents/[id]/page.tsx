'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Table,
  Sparkles,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  Info,
  Split,
  Eye,
  Edit3,
} from 'lucide-react';
import { RealtimeMonaco } from '@/components/realtime-monaco';
import { RealtimeAvatarStack } from '@/components/realtime-avatar-stack';
import { fetchDocument, renameDocument } from '@/lib/services/supabase-data';
import type { TeamDocument } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function DocumentEditorPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const [doc, setDoc] = useState<TeamDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(148);
  const [charCount, setCharCount] = useState(920);

  const titleDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!rawId) return;
    (async () => {
      const data = await fetchDocument(rawId);
      setDoc(data);
      setTitle(data?.title || 'Document sans titre');
      setLoading(false);
    })();
  }, [rawId]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (titleDebounce.current) clearTimeout(titleDebounce.current);
    titleDebounce.current = setTimeout(() => {
      if (rawId) renameDocument(rawId, value || 'Document sans titre');
    }, 500);
  };

  const handleExportMarkdown = () => {
    const filename = `${(title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    const content = `# ${title || 'Document'}\n\n*Édité dans Minerva Documents*\n`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-zinc-400 font-mono">Chargement du document…</div>;
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
          <p className="text-xs text-zinc-400">Ce document a peut-être été supprimé ou son identifiant est incorrect.</p>
        </div>
      </PageFadeIn>
    );
  }

  const documentId = rawId || doc.id;

  return (
    <PageFadeIn className={cn('mx-auto space-y-2.5 pb-12 transition-all', isFullscreen ? 'fixed inset-0 z-50 bg-white p-4 max-w-none overflow-y-auto' : 'max-w-7xl')}>
      {/* ── 1. Top Navigation, Title & Live Presence Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] px-3.5 py-2 shadow-2xs flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link
            href="/documents"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Documents</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-[3px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
              <FileText className="w-3 h-3" />
            </div>
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Document sans titre"
              className="text-[13px] font-semibold text-zinc-900 bg-transparent border-none outline-none focus:ring-0 placeholder:text-zinc-400 truncate w-full"
            />
          </div>
        </div>

        {/* Right Tools & Presences */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Word / Char Counters */}
          <div className="hidden md:flex items-center gap-2 text-[10.5px] font-mono text-zinc-400 border-r border-zinc-200 pr-2.5 mr-1" style={MONO}>
            <span>{wordCount} mots</span>
            <span>·</span>
            <span>{charCount} car.</span>
          </div>

          <RealtimeAvatarStack roomName={`document-presence-${documentId}`} />

          {/* Print / Export / Fullscreen buttons */}
          <div className="flex items-center gap-1 border-l border-zinc-200 pl-2">
            <button
              onClick={handleExportMarkdown}
              title="Exporter au format Markdown (.md)"
              className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handlePrint}
              title="Imprimer / Exporter en PDF"
              className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Quitter plein écran' : 'Mode Plein Écran'}
              className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Word-like Rich Formatting Toolbar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] px-3 py-1.5 shadow-2xs flex items-center gap-1 text-zinc-600 text-xs overflow-x-auto no-scrollbar">
        {/* Headings */}
        <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-1.5 mr-1">
          <span className="text-[10px] font-mono text-zinc-400 mr-1 hidden sm:inline" style={MONO}>
            Style :
          </span>
          <button
            onClick={() => {}}
            title="Titre 1 (# )"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 font-semibold cursor-pointer"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {}}
            title="Titre 2 (## )"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 font-semibold cursor-pointer"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {}}
            title="Titre 3 (### )"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 font-semibold cursor-pointer"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Formats (Bold, Italic, Strikethrough, Code) */}
        <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-1.5 mr-1">
          <button
            onClick={() => {}}
            title="Gras (**texte**)"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 font-bold cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {}}
            title="Italique (*texte*)"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 italic cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {}}
            title="Barré (~~texte~~)"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 cursor-pointer"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {}}
            title="Code en ligne (`code`)"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 font-mono cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists & Checklists */}
        <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-1.5 mr-1">
          <button
            onClick={() => {}}
            title="Liste à puces (- )"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {}}
            title="Liste numérotée (1. )"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {}}
            title="Checklist / Tâches (- [ ])"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Structure: Table, Quote, Callout */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => {}}
            title="Citation (> )"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {}}
            title="Tableau Markdown"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 cursor-pointer"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {}}
            title="Encadré d'information (> [!NOTE])"
            className="p-1 rounded hover:bg-zinc-100 text-emerald-700 cursor-pointer flex items-center gap-1 text-[11px] font-medium"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Callout</span>
          </button>
        </div>
      </div>

      {/* ── 3. Monaco Collaborative Editor Container ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        <RealtimeMonaco
          channel={`document-${documentId}`}
          language="markdown"
          height={isFullscreen ? 'calc(100vh - 120px)' : 680}
          persistence
          awareness
        />
      </div>
    </PageFadeIn>
  );
}
