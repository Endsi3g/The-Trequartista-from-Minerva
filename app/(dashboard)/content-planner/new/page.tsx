'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clapperboard,
  CalendarDays,
  Building2,
  Share2,
  Video,
  FileText,
  Play,
  Upload,
  Link2,
  Sparkles,
  Check,
  Film,
} from 'lucide-react';
import { addContentPost, fetchClients } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import type { ContentPost, Client } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function NewReelPage() {
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [format, setFormat] = useState<ContentPost['format']>('Reel 60s');
  const [platform, setPlatform] = useState<ContentPost['platform']>('Instagram');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [videoSourceMode, setVideoSourceMode] = useState<'upload' | 'link'>('upload');
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
        format,
        platform,
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
    <PageFadeIn className="max-w-7xl mx-auto space-y-3 pb-16">
      {/* ── Top Header Navigation ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] px-3.5 py-2.5 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/content-planner"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Réels</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <h1 className="text-[14px] font-semibold text-zinc-900 truncate">Planifier un Réel</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline" style={MONO}>
            ⌘ + Entrée pour valider
          </span>
        </div>
      </div>

      {/* ── Monolithic 2-Column Grid (65% Form / 35% Live Preview) ── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-3.5 items-start">
        {/* Left Column (Structured Continuous Form) */}
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-4 divide-y divide-zinc-100">
          {/* Section 1: Title & Client */}
          <div className="space-y-3">
            <div>
              <label className="block text-[10.5px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
                Titre du Réel / Contenu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Clapperboard className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reel 60s — Remplacement toiture commerciale & avant/après"
                  className="w-full h-8 pl-8 pr-3 text-[12px] bg-white border border-zinc-200 rounded-[4px] text-zinc-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-all placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-medium uppercase tracking-wider text-zinc-400 mb-1">
                Client Assigné <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-[12px] bg-white border border-zinc-200 rounded-[4px] text-zinc-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-all cursor-pointer"
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

          {/* Section 2: Format & Distribution (3-Column Inline Row) */}
          <div className="pt-3.5 space-y-3">
            <label className="block text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
              Format & Diffusion
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Plateforme */}
              <div>
                <span className="block text-[10px] text-zinc-500 mb-1 font-medium">Plateforme</span>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as ContentPost['platform'])}
                  className="w-full h-8 px-2 text-[11.5px] bg-white border border-zinc-200 rounded-[4px] text-zinc-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="Instagram">Instagram Reels</option>
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube">YouTube Shorts</option>
                  <option value="LinkedIn">LinkedIn Video</option>
                  <option value="Facebook">Facebook Reels</option>
                </select>
              </div>

              {/* Format / Durée */}
              <div>
                <span className="block text-[10px] text-zinc-500 mb-1 font-medium">Format / Durée</span>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ContentPost['format'])}
                  className="w-full h-8 px-2 text-[11.5px] bg-white border border-zinc-200 rounded-[4px] text-zinc-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="Reel 30s">Reel 30s (Court)</option>
                  <option value="Reel 60s">Reel 60s (Standard)</option>
                  <option value="Reel 90s">Reel 90s (Détaillé)</option>
                  <option value="Carrousel">Carrousel 5-10 slides</option>
                  <option value="Story">Story interactive</option>
                </select>
              </div>

              {/* Date de publication */}
              <div>
                <span className="block text-[10px] text-zinc-500 mb-1 font-medium">Date prévue</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-8 px-2 text-[11.5px] bg-white border border-zinc-200 rounded-[4px] text-zinc-800 focus:outline-none focus:border-emerald-600 font-mono"
                  style={MONO}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Media Source (40px Upload / Link Strip) */}
          <div className="pt-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                Fichier Vidéo / Ressource Média
              </label>
              {/* Tabs Switcher [ Téléverser | Lien Drive ] */}
              <div className="flex items-center bg-zinc-100 p-0.5 rounded-[4px] text-[10.5px] font-medium">
                <button
                  type="button"
                  onClick={() => setVideoSourceMode('upload')}
                  className={cn(
                    'px-2 py-0.5 rounded-[3px] transition-all cursor-pointer',
                    videoSourceMode === 'upload' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-500'
                  )}
                >
                  Fichier Direct
                </button>
                <button
                  type="button"
                  onClick={() => setVideoSourceMode('link')}
                  className={cn(
                    'px-2 py-0.5 rounded-[3px] transition-all cursor-pointer',
                    videoSourceMode === 'link' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-500'
                  )}
                >
                  Lien Drive / Dropbox
                </button>
              </div>
            </div>

            {videoSourceMode === 'upload' ? (
              <div className="h-10 border border-dashed border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 rounded-[4px] flex items-center justify-center gap-2 text-xs text-zinc-500 cursor-pointer transition-colors px-3">
                <Upload className="w-3.5 h-3.5 text-zinc-400" />
                <span className="truncate">Déposer la vidéo MP4 / MOV ou cliquer pour parcourir</span>
              </div>
            ) : (
              <div className="relative">
                <Link2 className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://drive.google.com/... ou https://dropbox.com/..."
                  className="w-full h-8 pl-8 pr-3 text-[11.5px] bg-white border border-zinc-200 rounded-[4px] text-zinc-900 focus:outline-none focus:border-emerald-600 font-mono"
                  style={MONO}
                />
              </div>
            )}
          </div>

          {/* Section 4: Script & Hook Notes (90px Compact Editor) */}
          <div className="pt-3.5 space-y-1.5">
            <label className="block text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
              Notes de Script & Accroche (Hook)
            </label>
            <textarea
              rows={3}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Accroche des 3 premières secondes, texte de description et appel à l'action (CTA)..."
              className="w-full h-22 p-2.5 text-[12px] bg-white border border-zinc-200 rounded-[4px] text-zinc-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 leading-relaxed placeholder:text-zinc-400"
            />
          </div>

          {/* Action Footer Bar */}
          <div className="pt-3.5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push('/content-planner')}
              className="h-7 px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
            >
              Annuler (Échap)
            </button>

            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="h-7 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Planification…' : 'Planifier le Réel (⌘ + Entrée)'}</span>
            </button>
          </div>
        </div>

        {/* Right Column (Live Sticky Preview Card) */}
        <div className="sticky top-4 space-y-3">
          <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs space-y-3">
            {/* Header with Micro-Badge */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                Aperçu Direct
              </span>
              <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.2 rounded font-medium">
                ● Idéation
              </span>
            </div>

            {/* Client Avatar & Title */}
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-[3px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 text-[10px] font-bold shrink-0">
                {selectedClient?.name ? selectedClient.name.slice(0, 2).toUpperCase() : 'MV'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-[12.5px] font-semibold text-zinc-900 truncate">
                  {title || 'Titre du reel en cours…'}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  {selectedClient?.name || 'Client sélectionné'}
                </p>
              </div>
            </div>

            {/* Metadata Micro-Grid */}
            <div className="bg-zinc-50/70 border border-zinc-200/60 rounded-[4px] p-2 text-[11px] font-mono space-y-1" style={MONO}>
              <div className="flex items-center justify-between text-zinc-600">
                <span>Plateforme :</span>
                <strong className="text-zinc-900">{platform}</strong>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <span>Format :</span>
                <strong className="text-zinc-900">{format}</strong>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <span>Date prévue :</span>
                <strong className="text-zinc-900">{date}</strong>
              </div>
              <div className="flex items-center justify-between text-zinc-600">
                <span>Fichier :</span>
                <strong className="text-zinc-500">
                  {videoUrl ? 'Lien configuré' : 'En attente'}
                </strong>
              </div>
            </div>

            {/* Mini 9:16 Video Player Mock */}
            <div className="relative aspect-[9/16] max-h-48 w-full bg-zinc-900 rounded-[4px] overflow-hidden flex flex-col justify-between p-2.5 text-white">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400" style={MONO}>
                <span>9:16 Feed</span>
                <Film className="w-3 h-3 text-zinc-400" />
              </div>

              <div className="text-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 mx-auto flex items-center justify-center transition-colors">
                  <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                </div>
                <p className="text-[10px] font-medium text-zinc-300 truncate px-2">
                  {title || 'Aperçu vidéo'}
                </p>
              </div>

              <div className="text-[9.5px] text-zinc-400 truncate">
                {script ? `« ${script.slice(0, 40)}… »` : 'Aucun script saisi.'}
              </div>
            </div>
          </div>
        </div>
      </form>
    </PageFadeIn>
  );
}
