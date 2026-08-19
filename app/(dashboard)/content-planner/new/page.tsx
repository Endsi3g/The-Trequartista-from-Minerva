'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clapperboard, Building2, Play, Check, Film } from 'lucide-react';
import { addContentPost, fetchClients } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import type { ContentPost, Client } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VideoUploadField } from '@/components/media/VideoUploadField';
import { ReelDistributionFields } from '@/components/content/ReelDistributionFields';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function NewReelPage() {
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [format, setFormat] = useState<string>('Reel 60s');
  const [platform, setPlatform] = useState<string>('Instagram');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [videoUrl, setVideoUrl] = useState('');
  const [script, setScript] = useState('');

  useEffect(() => {
    (async () => {
      const data = await fetchClients();
      setClients(data);
      if (data.length > 0 && !clientId) {
        setClientId(data[0].id);
      }
    })();
  }, []);

  // Keyboard shortcut: ⌘+Enter / Ctrl+Enter to submit, Esc to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        router.push('/content-planner');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, clientId, format, platform, date, videoUrl, script]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      toastError('Titre requis', 'Veuillez saisir un titre de contenu.');
      return;
    }
    if (!clientId) {
      toastError('Client requis', 'Veuillez sélectionner un client.');
      return;
    }

    setSaving(true);
    try {
      const created = await addContentPost({
        client_id: clientId,
        title: title.trim(),
        format: format as ContentPost['format'],
        platform: platform as ContentPost['platform'],
        scheduled_date: date,
        status: 'Idéation',
        thumbnail_url: '',
        video_url: videoUrl.trim() || undefined,
        caption: script.trim(),
      });

      if (created) {
        toastSuccess('Réel planifié', 'Le contenu a été ajouté au calendrier éditorial.');
        router.push(`/content-planner`);
      } else {
        toastError('Erreur', 'Impossible d’enregistrer le reel.');
      }
    } catch {
      toastError('Erreur', 'Une anomalie est survenue lors de la création.');
    } finally {
      setSaving(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === clientId);

  return (
    <PageFadeIn className="max-w-5xl mx-auto space-y-4 pb-16">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/content-planner"
            className="text-xs font-semibold text-mv-ink-soft hover:text-mv-ink transition-colors flex items-center gap-1 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Réels</span>
          </Link>
          <span className="text-mv-border">/</span>
          <h1 className="text-lg font-extrabold text-mv-ink font-display truncate">Planifier un Réel</h1>
        </div>
        <span className="text-[11px] font-mono text-mv-ink-faint hidden sm:inline" style={MONO}>
          ⌘ + Entrée pour valider
        </span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
        {/* Left Column */}
        <Card contentClassName="p-5 space-y-5">
          <div className="space-y-3">
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft mb-1">
                Titre du Réel / Contenu <span className="text-mv-red">*</span>
              </label>
              <div className="relative">
                <Clapperboard className="w-3.5 h-3.5 text-mv-ink-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reel 60s — Remplacement toiture commerciale & avant/après"
                  className="w-full h-9 pl-9 pr-3 text-xs bg-mv-cream-soft border border-mv-border rounded-lg text-mv-ink focus:outline-none focus:border-mv-green placeholder:text-mv-ink-faint"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft mb-1">
                Client Assigné <span className="text-mv-red">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-mv-ink-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-xs bg-mv-cream-soft border border-mv-border rounded-lg text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft">
              Format & Diffusion
            </label>
            <ReelDistributionFields
              platform={platform}
              format={format}
              onPlatformChange={setPlatform}
              onFormatChange={setFormat}
            />
            <div className="space-y-1">
              <span className="block text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft">Date prévue</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full sm:w-1/2 h-9 px-2.5 text-xs bg-mv-cream-soft border border-mv-border rounded-lg text-mv-ink focus:outline-none focus:border-mv-green font-mono"
                style={MONO}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft block">
              Fichier Vidéo / Ressource Média
            </label>
            <VideoUploadField value={videoUrl} onChange={setVideoUrl} />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft">
              Notes de Script & Accroche (Hook)
            </label>
            <textarea
              rows={3}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Accroche des 3 premières secondes, texte de description et appel à l'action (CTA)..."
              className="w-full p-3 text-xs bg-mv-cream-soft border border-mv-border rounded-lg text-mv-ink focus:outline-none focus:border-mv-green leading-relaxed placeholder:text-mv-ink-faint"
            />
          </div>

          <div className="pt-1 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/content-planner')}>
              Annuler (Échap)
            </Button>
            <Button type="submit" size="sm" disabled={saving || !title.trim()} icon={<Check className="w-3.5 h-3.5" />}>
              {saving ? 'Planification…' : 'Planifier le Réel (⌘ + Entrée)'}
            </Button>
          </div>
        </Card>

        {/* Right Column: Live Preview */}
        <div className="sticky top-4">
          <Card contentClassName="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft">Aperçu Direct</span>
              <span className="text-[10px] bg-mv-cream-soft text-mv-ink-soft px-1.5 py-0.5 rounded-full font-bold border border-mv-border">
                ● Idéation
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-mv-green-tint border border-mv-green/30 flex items-center justify-center text-mv-green text-[10px] font-extrabold shrink-0">
                {selectedClient?.name ? selectedClient.name.slice(0, 2).toUpperCase() : 'MV'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-mv-ink truncate">{title || 'Titre du reel en cours…'}</h4>
                <p className="text-[11px] text-mv-ink-faint truncate">{selectedClient?.name || 'Client sélectionné'}</p>
              </div>
            </div>

            <div className="bg-mv-cream-soft border border-mv-border rounded-lg p-2.5 text-[11px] font-mono space-y-1" style={MONO}>
              <div className="flex items-center justify-between text-mv-ink-soft">
                <span>Plateforme :</span>
                <strong className="text-mv-ink">{platform}</strong>
              </div>
              <div className="flex items-center justify-between text-mv-ink-soft">
                <span>Format :</span>
                <strong className="text-mv-ink">{format}</strong>
              </div>
              <div className="flex items-center justify-between text-mv-ink-soft">
                <span>Date prévue :</span>
                <strong className="text-mv-ink">{date}</strong>
              </div>
              <div className="flex items-center justify-between text-mv-ink-soft">
                <span>Fichier :</span>
                <strong className={videoUrl ? 'text-mv-green' : 'text-mv-ink-faint'}>
                  {videoUrl ? 'Prêt' : 'En attente'}
                </strong>
              </div>
            </div>

            <div className="relative aspect-[9/16] max-h-48 w-full bg-mv-ink rounded-lg overflow-hidden flex flex-col justify-between p-2.5 text-white">
              <div className="flex items-center justify-between text-[10px] font-mono text-white/60" style={MONO}>
                <span>9:16 Feed</span>
                <Film className="w-3 h-3 text-white/60" />
              </div>
              <div className="text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 mx-auto flex items-center justify-center transition-colors">
                  <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                </div>
                <p className="text-[10px] font-medium text-white/80 truncate px-2">{title || 'Aperçu vidéo'}</p>
              </div>
              <div className="text-[9.5px] text-white/60 truncate">
                {script ? `« ${script.slice(0, 40)}… »` : 'Aucun script saisi.'}
              </div>
            </div>
          </Card>
        </div>
      </form>
    </PageFadeIn>
  );
}
