'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, Circle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VideoAssetPlayer } from '@/components/media/VideoAssetPlayer';
import { createClient } from '@/lib/supabase/client';
import {
  fetchAcademySop,
  fetchCompletedSopIds,
  markSopCompleted,
  unmarkSopCompleted,
} from '@/lib/services/supabase-data';
import type { AcademySOP } from '@/lib/types';

export default function SopDetailPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [sop, setSop] = useState<AcademySOP | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!rawId) return;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const [sopData, completedIds] = await Promise.all([
        fetchAcademySop(rawId),
        user ? fetchCompletedSopIds(user.id) : Promise.resolve([]),
      ]);
      setSop(sopData);
      if (user) {
        setUserId(user.id);
        setCompleted(completedIds.includes(rawId));
      }
      setLoading(false);
    })();
  }, [rawId]);

  const toggleCompleted = async () => {
    if (!userId || !rawId) return;
    setSaving(true);
    const ok = completed ? await unmarkSopCompleted(userId, rawId) : await markSopCompleted(userId, rawId);
    setSaving(false);
    if (ok) setCompleted(!completed);
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-mv-ink-soft">Chargement…</div>;
  }

  if (!sop) {
    return (
      <div className="space-y-4">
        <Link href="/academy" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à l'académie
        </Link>
        <Card className="py-16 text-center">
          <p className="text-sm text-mv-ink-soft">Cette SOP est introuvable.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <Link href="/academy" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour à l'académie
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="blue">{sop.category}</Badge>
            <span className="text-[11px] font-mono text-mv-ink-soft flex items-center gap-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-mv-green" /> {sop.read_time_min} min
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-mv-ink font-display">{sop.title}</h1>
          <p className="text-xs text-mv-ink-faint mt-1">Par {sop.author}</p>
        </div>

        <Button
          variant={completed ? 'outline' : 'primary'}
          size="sm"
          disabled={saving}
          icon={completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
          onClick={toggleCompleted}
          className="shrink-0"
        >
          {completed ? 'SOP complétée' : 'Marquer comme complétée'}
        </Button>
      </div>

      {sop.video_url && (
        <VideoAssetPlayer src={sop.video_url} title={sop.title} initialAspectRatio="16:9" showDownloadButton={true} />
      )}

      <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Description & Procédure</h3>}>
        <div className="text-sm text-mv-ink-soft leading-relaxed space-y-3 [&_input]:cursor-default">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h2 className="text-lg font-extrabold text-mv-ink font-display mt-6 first:mt-0">{children}</h2>,
              h2: ({ children }) => <h3 className="text-base font-extrabold text-mv-ink mt-5 first:mt-0">{children}</h3>,
              h3: ({ children }) => <h4 className="text-sm font-extrabold text-mv-ink mt-4 first:mt-0">{children}</h4>,
              p: ({ children }) => <p>{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="pl-0.5">{children}</li>,
              strong: ({ children }) => <strong className="font-bold text-mv-ink">{children}</strong>,
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-mv-green underline hover:text-mv-green-dark">
                  {children}
                </a>
              ),
              code: ({ children }) => (
                <code className="px-1.5 py-0.5 rounded bg-mv-cream-soft border border-mv-border text-[0.85em] font-mono text-mv-ink">
                  {children}
                </code>
              ),
              hr: () => <hr className="border-mv-border my-4" />,
            }}
          >
            {sop.description}
          </ReactMarkdown>
        </div>
      </Card>
    </div>
  );
}
