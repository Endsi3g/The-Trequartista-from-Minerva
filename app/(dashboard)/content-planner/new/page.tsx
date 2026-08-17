'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ArrowLeft, Clapperboard, CalendarDays, Building2 } from 'lucide-react';
import { VideoUploadField } from '@/components/media/VideoUploadField';
import { addContentPost, fetchClients } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import type { ContentPost, Client } from '@/lib/types';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest mb-3">{children}</h2>;
}

export default function NewReelPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [format, setFormat] = useState<ContentPost['format']>('Reel 60s');
  const [platform, setPlatform] = useState<ContentPost['platform']>('Instagram');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [videoUrl, setVideoUrl] = useState('');
  const [script, setScript] = useState('');
  const { toastError } = useToast();

  useEffect(() => {
    (async () => setClients(await fetchClients()))();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientId) return;
    setSaving(true);

    const created = await addContentPost({
      client_id: clientId,
      title,
      format,
      platform,
      scheduled_date: date,
      status: 'Idéation',
      thumbnail_url: '',
      video_url: videoUrl || undefined,
      caption: script,
    });

    setSaving(false);
    if (created) {
      router.push(`/content-planner/${created.id}`);
    } else {
      toastError('Erreur', 'Impossible de planifier ce reel. Réessayez.');
    }
  };

  const client = clients.find((c) => c.id === clientId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/content-planner" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour au planificateur
      </Link>

      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">Nouveau Reel</h1>
        <p className="text-sm text-mv-ink-soft mt-1">Planifie une publication dans le calendrier éditorial.</p>
      </div>

      <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Identité</SectionLabel>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Titre du reel / contenu</label>
              <div className="relative">
                <Clapperboard className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Reel 60s — Remplacement toiture commerciale"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Client</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer appearance-none"
                >
                  <option value="" disabled>
                    {clients.length === 0 ? 'Aucun client' : 'Choisir…'}
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Format & diffusion</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Plateforme cible</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as ContentPost['platform'])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer"
                >
                  <option value="Instagram">Instagram Reels</option>
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube Shorts">YouTube Shorts</option>
                  <option value="LinkedIn">LinkedIn Video</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ContentPost['format'])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer"
                >
                  <option value="Reel 60s">Reel 60s</option>
                  <option value="Carrousel IG">Carrousel IG</option>
                  <option value="Post LinkedIn">Post LinkedIn</option>
                  <option value="Story">Story</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Date planifiée</label>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Vidéo</SectionLabel>
            <VideoUploadField value={videoUrl} onChange={setVideoUrl} />
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-3">
            <SectionLabel>Script &amp; notes de hook</SectionLabel>
            <textarea
              rows={4}
              placeholder="Saisissez les notes de hook et d'appel à l'action…"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full rounded-xl bg-mv-cream-soft border border-mv-border p-3.5 text-sm text-mv-ink leading-relaxed focus:outline-none focus:border-mv-green transition-colors resize-y"
            />
          </div>

          <div className="flex gap-3">
            <Link href="/content-planner" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">Annuler</Button>
            </Link>
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Planifier le reel'}
            </Button>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="lg:sticky lg:top-6 bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
          <SectionLabel>Aperçu</SectionLabel>
          <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={client?.name || 'Client'} src={client?.logo_url} size="lg" shape="rounded" />
              <div className="min-w-0">
                <div className="font-bold text-sm text-mv-ink truncate">{title || 'Titre du reel'}</div>
                <div className="text-[11px] text-mv-ink-soft truncate">{client?.name || 'Client'}</div>
              </div>
            </div>
            <div className="pt-3 border-t border-mv-border flex items-center justify-between">
              <span className="text-[11px] text-mv-ink-soft">Plateforme</span>
              <span className="text-xs font-semibold text-mv-ink">{platform}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-mv-ink-soft">Date</span>
              <span className="text-xs font-semibold text-mv-ink">
                {new Date(date + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <Badge variant="neutral">Idéation</Badge>
          </div>
          <p className="text-[11px] text-mv-ink-faint leading-relaxed">
            Voici comment ce reel apparaîtra dans le calendrier éditorial une fois planifié.
          </p>
        </div>
      </form>
    </div>
  );
}
