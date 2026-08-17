'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { RealtimeMonaco } from '@/components/realtime-monaco';
import { RealtimeAvatarStack } from '@/components/realtime-avatar-stack';
import { fetchDocument, renameDocument } from '@/lib/services/supabase-data';
import type { TeamDocument } from '@/lib/types';

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
      setTitle(data?.title || '');
      setLoading(false);
    })();
  }, [rawId]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (titleDebounce.current) clearTimeout(titleDebounce.current);
    titleDebounce.current = setTimeout(() => {
      if (rawId) renameDocument(rawId, value || 'Document sans titre');
    }, 600);
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-mv-ink-soft">Chargement…</div>;
  }

  if (!doc) {
    return (
      <div className="space-y-4">
        <Link href="/documents" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux documents
        </Link>
        <Card className="py-16 text-center">
          <p className="text-sm text-mv-ink-soft">Ce document est introuvable.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-12">
      <div className="flex items-center justify-between gap-4">
        <Link href="/documents" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux documents
        </Link>
        <RealtimeAvatarStack roomName={`document-presence-${rawId}`} />
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-mv-green-tint text-mv-green flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Document sans titre"
          className="flex-1 text-xl font-extrabold text-mv-ink font-display bg-transparent border-none outline-none focus:ring-0 placeholder-mv-ink-faint"
        />
      </div>

      <div className="rounded-2xl overflow-hidden border border-mv-border shadow-mv-sm">
        <RealtimeMonaco channel={`document-${rawId}`} language="markdown" height={640} persistence awareness />
      </div>
    </div>
  );
}
