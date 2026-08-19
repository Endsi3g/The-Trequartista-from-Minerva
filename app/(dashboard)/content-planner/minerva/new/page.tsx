'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Link2, Check, Calendar, User } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/components/providers/ToastProvider';
import {
  fetchMinervaContentCategories,
  createMinervaContentCategory,
  createMinervaContentItem,
  fetchTeamMembers,
} from '@/lib/services/supabase-data';
import type { MinervaContentCategory, TeamMemberSummary } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VideoUploadField } from '@/components/media/VideoUploadField';
import { ReelDistributionFields } from '@/components/content/ReelDistributionFields';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function NewMinervaContentPage() {
  const router = useRouter();
  const { id: userId } = useCurrentUser();
  const { toastSuccess, toastError } = useToast();

  const [kind, setKind] = useState<'inspiration' | 'own_video'>('own_video');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<MinervaContentCategory[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [platform, setPlatform] = useState('Instagram');
  const [format, setFormat] = useState('Reel 60s');
  const [externalUrl, setExternalUrl] = useState('');
  const [note, setNote] = useState('');

  const [fileUrl, setFileUrl] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [members, setMembers] = useState<TeamMemberSummary[]>([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [cats, team] = await Promise.all([fetchMinervaContentCategories(), fetchTeamMembers()]);
      setCategories(cats);
      setMembers(team);
      if (cats.length > 0) setCategoryId(cats[0].id);
    })();
  }, []);

  // Keyboard Shortcuts: ⌘ + Enter to submit, Escape to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        router.push('/content-planner');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // The DB enforces file_url/external_url mutual exclusivity per kind
  // (minerva_content_items_kind_fields) -- switching kind must clear
  // whichever field no longer applies, or the insert 400s silently.
  const handleKindChange = (next: 'inspiration' | 'own_video') => {
    setKind(next);
    if (next === 'inspiration') setFileUrl('');
    else setExternalUrl('');
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const cat = await createMinervaContentCategory(newCategoryName.trim());
    if (cat) {
      setCategories((prev) => [...prev, cat]);
      setCategoryId(cat.id);
      setNewCategoryName('');
      setAddingCategory(false);
      toastSuccess('Catégorie ajoutée', `« ${cat.name} » est sélectionnée.`);
    } else {
      toastError('Erreur', 'Impossible de créer la catégorie.');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      toastError('Champ requis', 'Veuillez saisir un titre pour ce contenu.');
      return;
    }
    if (kind === 'inspiration' && !externalUrl.trim()) {
      toastError('Lien requis', 'Une inspiration nécessite un lien externe.');
      return;
    }
    if (kind === 'own_video' && !fileUrl) {
      toastError('Fichier requis', 'Téléversez une vidéo pour ce contenu Minerva.');
      return;
    }

    setSaving(true);
    try {
      const item = await createMinervaContentItem({
        kind,
        title: title.trim(),
        category_id: categoryId || null,
        external_url: kind === 'inspiration' ? externalUrl.trim() || null : null,
        note: note.trim() || null,
        file_url: kind === 'own_video' ? fileUrl || null : null,
        platform,
        format,
        scheduled_date: scheduledDate || null,
        assignee_id: assigneeId || null,
        created_by: userId || 'local-user',
      });

      if (item) {
        toastSuccess('Contenu enregistré', 'La ressource a été ajoutée à la banque Minerva.');
        router.push('/content-planner');
      } else {
        toastError('Erreur', 'Impossible de sauvegarder le contenu.');
      }
    } catch {
      toastError('Erreur', 'Une anomalie est survenue lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageFadeIn className="max-w-2xl mx-auto py-6 pb-20 space-y-4">
      <Card contentClassName="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-mv-border pb-3">
          <div>
            <Link
              href="/content-planner"
              className="text-xs font-semibold text-mv-ink-soft hover:text-mv-ink mb-0.5 inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Contenu Minerva</span>
            </Link>
            <h1 className="text-base font-extrabold text-mv-ink font-display">Nouveau Contenu Minerva</h1>
          </div>

          <div className="flex items-center bg-mv-cream-soft p-0.5 rounded-lg border border-mv-border h-7 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => handleKindChange('inspiration')}
              className={cn(
                'px-2.5 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1',
                kind === 'inspiration' ? 'bg-mv-surface text-mv-ink shadow-2xs' : 'text-mv-ink-soft hover:text-mv-ink'
              )}
            >
              <Link2 className="w-3 h-3" />
              <span>Inspiration</span>
            </button>
            <button
              type="button"
              onClick={() => handleKindChange('own_video')}
              className={cn(
                'px-2.5 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1',
                kind === 'own_video' ? 'bg-mv-surface text-mv-green shadow-2xs' : 'text-mv-ink-soft hover:text-mv-ink'
              )}
            >
              <Sparkles className="w-3 h-3 text-mv-green" />
              <span>Vidéo Minerva</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft block">
              Titre du contenu *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Hook d'accroche B2B pour cabinet comptable..."
              className="w-full h-9 px-3 text-xs bg-mv-cream-soft border border-mv-border rounded-lg text-mv-ink placeholder:text-mv-ink-faint focus:outline-none focus:border-mv-green"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft block">Catégorie</label>
              <button
                type="button"
                onClick={() => setAddingCategory(!addingCategory)}
                className="text-[10.5px] text-mv-green hover:underline font-bold cursor-pointer"
              >
                {addingCategory ? 'Fermer' : '+ Ajouter'}
              </button>
            </div>

            {addingCategory ? (
              <form onSubmit={handleCreateCategory} className="flex items-center gap-1">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nouvelle cat..."
                  className="w-full h-9 px-2 text-xs border border-mv-border rounded-lg bg-mv-cream-soft focus:border-mv-green outline-none"
                />
                <Button type="submit" size="sm" className="shrink-0">
                  OK
                </Button>
              </form>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 px-2 text-xs bg-mv-cream-soft border border-mv-border rounded-lg text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
              >
                <option value="">Sélectionner...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft block">
            Format & Diffusion
          </label>
          <ReelDistributionFields
            platform={platform}
            format={format}
            onPlatformChange={setPlatform}
            onFormatChange={setFormat}
          />
        </div>

        {kind === 'inspiration' ? (
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5 text-mv-ink-faint" />
              <span>Lien Vidéo (YouTube / Instagram / TikTok) *</span>
            </label>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... ou lien Reel"
              className="w-full h-9 px-3 text-[11.5px] bg-mv-cream-soft border border-mv-border rounded-lg text-mv-ink placeholder:text-mv-ink-faint focus:outline-none focus:border-mv-green font-mono"
              style={MONO}
            />
          </div>
        ) : (
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft block">
              Fichier Vidéo *
            </label>
            <VideoUploadField value={fileUrl} onChange={setFileUrl} bucket="team-documents" folder="minerva-content" />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft flex items-center gap-1">
              <Calendar className="w-3 h-3 text-mv-ink-faint" />
              <span>Date prévue de publication</span>
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full h-9 px-2.5 text-xs bg-mv-cream-soft border border-mv-border rounded-lg text-mv-ink focus:outline-none focus:border-mv-green font-mono"
              style={MONO}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft flex items-center gap-1">
              <User className="w-3 h-3 text-mv-ink-faint" />
              <span>Assigné à</span>
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full h-9 px-2.5 text-xs bg-mv-cream-soft border border-mv-border rounded-lg text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
            >
              <option value="">Non assigné (Équipe Minerva)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft block">
            Notes & Contexte d’Inspiration
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Points clés, structure du hook, call-to-action ou instructions pour le monteur..."
            rows={3}
            className="w-full px-3 py-2 text-xs bg-mv-cream-soft border border-mv-border rounded-lg text-mv-ink placeholder:text-mv-ink-faint focus:outline-none focus:border-mv-green resize-none leading-relaxed"
          />
        </div>

        <div className="pt-3 border-t border-mv-border flex items-center justify-between">
          <span className="text-[10.5px] font-mono text-mv-ink-faint hidden sm:inline" style={MONO}>
            Soumission : ⌘ + Entrée · Annuler : Échap
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/content-planner">Annuler (Échap)</Link>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleSubmit()}
              disabled={saving || !title.trim()}
              icon={<Check className="w-3.5 h-3.5" />}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer le contenu'}
            </Button>
          </div>
        </div>
      </Card>
    </PageFadeIn>
  );
}
