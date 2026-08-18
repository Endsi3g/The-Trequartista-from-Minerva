'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { RealtimeMonaco } from '@/components/realtime-monaco';
import { RealtimeAvatarStack } from '@/components/realtime-avatar-stack';
import { fetchDocument, renameDocument } from '@/lib/services/supabase-data';
import type { TeamDocument } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function DocumentEditorPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  const [doc, setDoc] = useState<TeamDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
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

  if (loading) {
    return <div className="py-16 text-center text-xs text-zinc-400 font-mono">Chargement du document…</div>;
  }

  if (!doc) {
    return (
      <PageFadeIn className="space-y-4 max-w-5xl mx-auto py-8">
        <Link href="/documents" className="text-xs font-medium text-mv-green hover:underline flex items-center gap-1.5 w-fit">
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

  return (
    <PageFadeIn className="max-w-6xl mx-auto space-y-3 pb-12">
      {/* ── Compact Navigation & Presence Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] px-3.5 py-2 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
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

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline" style={MONO}>
            Réf: {(rawId || doc.id).slice(0, 8)}
          </span>
          <RealtimeAvatarStack roomName={`document-presence-${rawId || doc.id}`} />
        </div>
      </div>

      {/* ── Monaco Collaborative Editor Container ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        <RealtimeMonaco channel={`document-${rawId}`} language="markdown" height={680} persistence awareness />
      </div>
    </PageFadeIn>
  );
}
