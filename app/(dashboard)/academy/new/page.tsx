'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, GraduationCap, User as UserIcon, Clock, ShieldAlert } from 'lucide-react';
import { addAcademySop } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import { useAppPermissions } from '@/components/providers/AppPermissionsProvider';
import { VideoUploadField } from '@/components/media/VideoUploadField';
import type { AcademySOP } from '@/lib/types';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest mb-3">{children}</h2>;
}

export default function NewSopPage() {
  const router = useRouter();
  const { toastError } = useToast();
  const { can, loading: permissionsLoading } = useAppPermissions();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<AcademySOP['category']>('Onboarding');
  const [author, setAuthor] = useState('');
  const [readTime, setReadTime] = useState(5);
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const created = await addAcademySop({
      title,
      category,
      read_time_min: Number(readTime),
      author,
      description,
      video_url: videoUrl || undefined,
    });

    setSaving(false);
    if (!created) {
      toastError('Erreur', 'Impossible de créer la SOP.');
      return;
    }
    router.push('/academy');
  };

  if (!permissionsLoading && !can('publish_academy_sop')) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé aux administrateurs.</p>
        <p className="text-xs text-mv-ink-soft">Un administrateur peut autoriser les membres à publier des SOPs dans Paramètres &gt; Permissions.</p>
        <Link href="/academy" className="text-xs text-mv-green hover:underline">Retour à l&apos;académie</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/academy" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour à l&apos;académie
      </Link>

      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">Nouvelle SOP</h1>
        <p className="text-sm text-mv-ink-soft mt-1">Documente une procédure pour l&apos;équipe.</p>
      </div>

      <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Identité</SectionLabel>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Titre de la SOP</label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Procédure de validation qualité Framer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AcademySOP['category'])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer"
                >
                  <option value="Onboarding">Onboarding</option>
                  <option value="Rôles & Rémunération">Rôles &amp; Rémunération</option>
                  <option value="Outils & Systèmes">Outils &amp; Systèmes</option>
                  <option value="Ventes & Prospection">Ventes &amp; Prospection</option>
                  <option value="Gestion de compte">Gestion de compte</option>
                  <option value="Support & QA">Support &amp; QA</option>
                  <option value="Design Framer">Design Framer</option>
                  <option value="Workflows IA">Workflows IA</option>
                  <option value="Campagnes Ads">Campagnes Ads</option>
                  <option value="Loi 25 & Compliance">Loi 25 &amp; Compliance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Temps de lecture (min)</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    value={readTime}
                    onChange={(e) => setReadTime(Number(e.target.value))}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink font-mono focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Auteur</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Votre nom"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Vidéo (optionnelle)</SectionLabel>
            <VideoUploadField value={videoUrl} onChange={setVideoUrl} />
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-3">
            <SectionLabel>Description &amp; étapes</SectionLabel>
            <textarea
              rows={10}
              required
              placeholder="Collez ou saisissez la description détaillée et les consignes…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-mv-cream-soft border border-mv-border p-3.5 text-sm text-mv-ink leading-relaxed focus:outline-none focus:border-mv-green transition-colors resize-y"
            />
          </div>

          <div className="flex gap-3">
            <Link href="/academy" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">Annuler</Button>
            </Link>
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Créer la SOP'}
            </Button>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="lg:sticky lg:top-6 bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
          <SectionLabel>Aperçu</SectionLabel>
          <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-4 space-y-3">
            <div className="font-bold text-sm text-mv-ink">{title || 'Titre de la SOP'}</div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="green">{category}</Badge>
              <span className="text-[11px] text-mv-ink-soft">{readTime} min de lecture</span>
            </div>
            <div className="pt-3 border-t border-mv-border flex items-center justify-between">
              <span className="text-[11px] text-mv-ink-soft">Auteur</span>
              <span className="text-xs font-semibold text-mv-ink">{author || 'À définir'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-mv-ink-soft">Vidéo</span>
              <span className="text-xs font-semibold text-mv-ink">{videoUrl ? 'Ajoutée' : 'Aucune'}</span>
            </div>
          </div>
          <p className="text-[11px] text-mv-ink-faint leading-relaxed">
            Voici comment cette SOP apparaîtra dans la bibliothèque de l&apos;académie une fois créée.
          </p>
        </div>
      </form>
    </div>
  );
}
