'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { VideoUploadField } from '@/components/media/VideoUploadField';
import { addContentPost, fetchClients } from '@/lib/services/supabase-data';
import type { ContentPost, Client } from '@/lib/types';

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
      script_notes: script,
    });

    setSaving(false);
    if (created) {
      router.push(`/content-planner/${created.id}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/content-planner" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour au planificateur
      </Link>

      <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">Planifier un Nouveau Reel</h1>

      <Card>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-mv-ink">Titre du Reel / Content</label>
            <input
              type="text"
              required
              placeholder="Ex: Reel 60s - Remplacement Toiture Commerciale"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-mv-ink">Client</label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer font-medium"
              >
                <option value="" disabled>
                  {clients.length === 0 ? 'Aucun client' : 'Choisir…'}
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-mv-ink">Plateforme Cible</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as ContentPost['platform'])}
                className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer font-medium"
              >
                <option value="Instagram">Instagram Reels</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube Shorts">YouTube Shorts</option>
                <option value="LinkedIn">LinkedIn Video</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-mv-ink">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ContentPost['format'])}
              className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer font-medium"
            >
              <option value="Reel 60s">Reel 60s</option>
              <option value="Carrousel IG">Carrousel IG</option>
              <option value="Post LinkedIn">Post LinkedIn</option>
              <option value="Story">Story</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-mv-ink">Date planifiée</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <div>
            <label className="font-bold text-mv-ink mb-1 block">Vidéo</label>
            <VideoUploadField value={videoUrl} onChange={setVideoUrl} />
          </div>

          <div>
            <label className="font-bold text-mv-ink">Script & Hook Notes</label>
            <textarea
              rows={3}
              placeholder="Saisissez les notes de hook et d'appel à l'action..."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl p-3 text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-mv-border">
            <Link href="/content-planner">
              <Button variant="outline" size="sm" type="button">
                Annuler
              </Button>
            </Link>
            <Button variant="primary" size="sm" type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer & Planifier'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
