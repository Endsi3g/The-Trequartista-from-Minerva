'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Link2,
  UploadCloud,
  Check,
  Plus,
  Video,
  Youtube,
  Calendar,
  User,
  X,
  FileVideo,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/components/providers/ToastProvider';
import {
  fetchMinervaContentCategories,
  createMinervaContentCategory,
  createMinervaContentItem,
  uploadMinervaContentFile,
  fetchTeamMembers,
} from '@/lib/services/supabase-data';
import type { MinervaContentCategory, TeamMemberSummary } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
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

  const [externalUrl, setExternalUrl] = useState('');
  const [note, setNote] = useState('');

  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [members, setMembers] = useState<TeamMemberSummary[]>([]);

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFileName(file.name);
    try {
      const url = await uploadMinervaContentFile(file);
      if (url) {
        setFileUrl(url);
        toastSuccess('Fichier importé', `${file.name} est prêt pour l’enregistrement.`);
      } else {
        toastError('Erreur', 'Échec du téléversement.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      toastError('Champ requis', 'Veuillez saisir un titre pour ce contenu.');
      return;
    }

    setSaving(true);
    try {
      const item = await createMinervaContentItem({
        kind,
        title: title.trim(),
        category_id: categoryId || null,
        external_url: externalUrl.trim() || null,
        note: note.trim() || null,
        file_url: fileUrl || null,
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
      {/* ── Single Monolith Card ── */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm space-y-4">
        {/* 1. Header Intégré */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <Link
              href="/content-planner"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 mb-0.5 inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Contenu Minerva</span>
            </Link>
            <h1 className="text-[16px] font-semibold text-zinc-900">
              Nouveau Contenu Minerva
            </h1>
          </div>

          {/* 2. Segmented Control Type (28px height) */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200/60 h-7 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setKind('inspiration')}
              className={cn(
                'px-2.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1',
                kind === 'inspiration'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <Link2 className="w-3 h-3" />
              <span>Inspiration</span>
            </button>
            <button
              type="button"
              onClick={() => setKind('own_video')}
              className={cn(
                'px-2.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1',
                kind === 'own_video'
                  ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Vidéo Minerva</span>
            </button>
          </div>
        </div>

        {/* 3. Ligne Titre & Catégorie */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 block">
              Titre du contenu *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Hook d'accroche B2B pour cabinet comptable..."
              className="w-full h-8 px-3 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 block">
                Catégorie
              </label>
              <button
                type="button"
                onClick={() => setAddingCategory(!addingCategory)}
                className="text-[10.5px] text-emerald-700 hover:underline font-medium cursor-pointer"
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
                  className="w-full h-8 px-2 text-xs border border-zinc-200 rounded-md focus:border-emerald-600 outline-none"
                />
                <button
                  type="submit"
                  className="h-8 px-2 bg-emerald-600 text-white rounded-md text-xs font-medium shrink-0"
                >
                  OK
                </button>
              </form>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
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

        {/* 4. Lien Vidéo YouTube / URL externe */}
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
            <Youtube className="w-3.5 h-3.5 text-rose-600" />
            <span>Lien Vidéo YouTube / Instagram / TikTok</span>
          </label>
          <input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... ou lien Reel"
            className="w-full h-8 px-3 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 font-mono text-[11.5px]"
          />
        </div>

        {/* 5. Zone Vidéo & Fichiers Ultra-Compacte (40px) */}
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 block">
            Fichier Vidéo Local (Optionnel)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-10 border-dashed border border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 rounded-md flex items-center justify-center gap-2 text-xs text-zinc-500 cursor-pointer transition-colors px-3"
          >
            {uploading ? (
              <span className="text-emerald-700 font-medium animate-pulse">Téléversement en cours…</span>
            ) : fileUrl ? (
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span className="truncate max-w-[300px]">{fileName || 'Fichier vidéo attaché'}</span>
              </div>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5 text-zinc-400" />
                <span>Glisser un fichier vidéo ou Parcourir (MP4, MOV - Max 100 Mo)</span>
              </>
            )}
          </div>
        </div>

        {/* 6. Ligne Date & Assignation (Grille 2 Colonnes) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-400" />
              <span>Date prévue de publication</span>
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full h-8 px-2.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-none focus:border-emerald-600 font-mono"
              style={MONO}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <User className="w-3 h-3 text-zinc-400" />
              <span>Assigné à</span>
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full h-8 px-2.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
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

        {/* 7. Notes & Script / Angle */}
        <div className="space-y-1">
          <label className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 block">
            Notes & Contexte d’Inspiration
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Points clés, structure du hook, call-to-action ou instructions pour le monteur..."
            rows={3}
            className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 resize-none leading-relaxed"
          />
        </div>

        {/* 8. Barre d'Actions & Raccourcis Clavier (Footer Strip) */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
          <span className="text-[10.5px] font-mono text-zinc-400 hidden sm:inline" style={MONO}>
            Soumission : ⌘ + Entrée · Annuler : Échap
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <Link
              href="/content-planner"
              className="h-8 px-3 text-xs text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors flex items-center"
            >
              Annuler (Échap)
            </Link>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={saving || !title.trim()}
              className="h-8 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{saving ? 'Enregistrement…' : '+ Enregistrer le contenu'}</span>
            </button>
          </div>
        </div>
      </div>
    </PageFadeIn>
  );
}
