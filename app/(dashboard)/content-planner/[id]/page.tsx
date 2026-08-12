'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Eye,
  Heart,
  Hash,
  Clock,
  Smartphone,
  Save,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VideoAssetPlayer } from '@/components/media/VideoAssetPlayer';
import { VideoUploadField } from '@/components/media/VideoUploadField';
import { fetchContentPost, updateContentPost } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import type { ContentPost } from '@/lib/types';

const STAGES: ContentPost['status'][] = ['Idéation', 'Rédigé', 'Enregistré', 'Publié'];

export default function ReelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [post, setPost] = useState<ContentPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toastSuccess, toastError } = useToast();

  // Editable fields
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [nativeUrl, setNativeUrl] = useState('');

  useEffect(() => {
    if (!rawId) return;
    (async () => {
      const data = await fetchContentPost(rawId);
      setPost(data);
      if (data) {
        setVideoUrl(data.video_url || '');
        setCaption(data.caption || '');
        setHashtagsInput((data.hashtags || []).join(' '));
        setInternalNotes(data.internal_notes || '');
        setNativeUrl(data.native_url || '');
      }
      setLoading(false);
    })();
  }, [rawId]);

  const handleStatusChange = async (status: ContentPost['status']) => {
    if (!post) return;
    setPost({ ...post, status });
    await updateContentPost(post.id, { status });
  };

  const handleSave = async () => {
    if (!post) return;
    setSaving(true);
    const hashtags = hashtagsInput
      .split(/\s+/)
      .map((h) => h.trim())
      .filter(Boolean)
      .map((h) => (h.startsWith('#') ? h : `#${h}`));

    const ok = await updateContentPost(post.id, {
      video_url: videoUrl,
      caption,
      hashtags,
      internal_notes: internalNotes,
      native_url: nativeUrl,
    });
    setSaving(false);
    if (ok) {
      toastSuccess('Enregistré', 'Les informations du reel ont été mises à jour.');
      setPost({ ...post, video_url: videoUrl, caption, hashtags, internal_notes: internalNotes, native_url: nativeUrl });
    } else {
      toastError('Erreur', "Impossible d'enregistrer.");
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-sm text-mv-ink-soft">Chargement…</div>;
  }

  if (!post) {
    return (
      <div className="space-y-4">
        <Link href="/content-planner" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour au planificateur
        </Link>
        <Card className="py-16 text-center">
          <p className="text-sm text-mv-ink-soft">Ce contenu est introuvable.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <Link href="/content-planner" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour au planificateur
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="green">{post.client_name}</Badge>
            {post.platform && <Badge variant="lime">{post.platform}</Badge>}
          </div>
          <h1 className="text-xl lg:text-2xl font-extrabold text-mv-ink font-display mt-2">{post.title}</h1>
        </div>

        <select
          value={post.status}
          onChange={(e) => handleStatusChange(e.target.value as ContentPost['status'])}
          className="bg-mv-cream border border-mv-border rounded-xl px-3 py-2 text-xs font-bold text-mv-ink focus:outline-none cursor-pointer shrink-0"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: video + caption + hashtags */}
        <div className="lg:col-span-2 space-y-6">
          <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider flex items-center gap-2"><Smartphone className="w-4 h-4 text-mv-green" /> Aperçu</h3>}>
            {videoUrl ? (
              <VideoAssetPlayer src={videoUrl} poster={post.thumbnail_url} title={post.title} initialAspectRatio="9:16" showDownloadButton={true} />
            ) : (
              <div className="p-8 text-center border border-dashed border-mv-border rounded-2xl bg-mv-cream-soft text-xs text-mv-ink-soft">
                Aucune vidéo associée pour le moment.
              </div>
            )}
            <div className="mt-4">
              <label className="text-xs font-bold text-mv-ink uppercase tracking-wider mb-2 block">Remplacer la vidéo</label>
              <VideoUploadField value={videoUrl} onChange={setVideoUrl} />
            </div>
          </Card>

          <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Légende</h3>}>
            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Légende de publication…"
              className="w-full bg-mv-cream-soft border border-mv-border rounded-xl p-3 text-xs text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </Card>

          <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider flex items-center gap-2"><Hash className="w-4 h-4 text-mv-green" /> Hashtags</h3>}>
            <input
              type="text"
              value={hashtagsInput}
              onChange={(e) => setHashtagsInput(e.target.value)}
              placeholder="#toiture #quebec #renovation"
              className="w-full bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2.5 text-xs text-mv-ink font-mono focus:outline-none focus:border-mv-green"
            />
            {(post.hashtags?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {post.hashtags!.map((h) => (
                  <span key={h} className="text-[11px] font-semibold text-mv-green bg-mv-green-tint px-2 py-0.5 rounded-full">
                    {h}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Notes internes d'équipe</h3>}>
            <textarea
              rows={4}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Hook, CTA, consignes de tournage, retours de révision…"
              className="w-full bg-mv-cream-soft border border-mv-border rounded-xl p-3 text-xs text-mv-ink focus:outline-none focus:border-mv-green font-mono"
            />
          </Card>
        </div>

        {/* Right: metadata */}
        <div className="space-y-6">
          <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Détails</h3>}>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-mv-ink-soft flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date planifiée</span>
                <span className="font-bold text-mv-ink">
                  {new Date(post.scheduled_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-mv-ink-soft">Client</span>
                <span className="font-bold text-mv-ink">{post.client_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-mv-ink-soft">Format</span>
                <span className="font-bold text-mv-ink">{post.format}</span>
              </div>
              <div>
                <label className="text-mv-ink-soft block mb-1">Lien natif (une fois publié)</label>
                <input
                  type="url"
                  value={nativeUrl}
                  onChange={(e) => setNativeUrl(e.target.value)}
                  placeholder="https://instagram.com/reel/…"
                  className="w-full bg-mv-cream-soft border border-mv-border rounded-lg px-2.5 py-2 text-[11px] font-mono focus:outline-none focus:border-mv-green"
                />
                {post.native_url && (
                  <a
                    href={post.native_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center gap-1.5 text-mv-green font-semibold hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Voir dans l'app native
                  </a>
                )}
              </div>
            </div>
          </Card>

          {(post.metrics_views ?? 0) > 0 || (post.metrics_likes ?? 0) > 0 ? (
            <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Métriques</h3>}>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-mv-green-tint border border-mv-green/30">
                  <span className="text-[10px] text-mv-ink-soft uppercase font-bold flex items-center gap-1"><Eye className="w-3 h-3" /> Vues</span>
                  <p className="font-extrabold text-sm text-mv-green">{(post.metrics_views || 0).toLocaleString('fr-CA')}</p>
                </div>
                <div className="p-3 rounded-xl bg-mv-green-tint border border-mv-green/30">
                  <span className="text-[10px] text-mv-ink-soft uppercase font-bold flex items-center gap-1"><Heart className="w-3 h-3" /> J'aime</span>
                  <p className="font-extrabold text-sm text-mv-green">{(post.metrics_likes || 0).toLocaleString('fr-CA')}</p>
                </div>
              </div>
            </Card>
          ) : null}

          <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider flex items-center gap-2"><Clock className="w-4 h-4 text-mv-green" /> Historique du statut</h3>}>
            {(post.status_history?.length ?? 0) === 0 ? (
              <p className="text-xs text-mv-ink-faint">Aucun historique.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {[...(post.status_history || [])].reverse().map((ev, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="font-semibold text-mv-ink">{ev.status}</span>
                    <span className="text-mv-ink-faint font-mono text-[11px]">
                      {new Date(ev.changed_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Button variant="primary" className="w-full" disabled={saving} icon={<Save className="w-4 h-4" />} onClick={handleSave}>
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </div>
    </div>
  );
}
