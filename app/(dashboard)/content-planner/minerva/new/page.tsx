'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Sparkles,
  Link2,
  UploadCloud,
  Check,
  Loader2,
  Plus,
  Wand2,
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
import { cn } from '@/lib/utils';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest mb-3">{children}</h2>;
}

export default function NewMinervaContentPage() {
  const router = useRouter();
  const { id: userId } = useCurrentUser();
  const { toastError } = useToast();

  const [kind, setKind] = useState<'inspiration' | 'own_video'>('inspiration');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<MinervaContentCategory[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [externalUrl, setExternalUrl] = useState('');
  const [note, setNote] = useState('');

  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [members, setMembers] = useState<TeamMemberSummary[]>([]);
  const [sendToOpusClip, setSendToOpusClip] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [cats, team] = await Promise.all([fetchMinervaContentCategories(), fetchTeamMembers()]);
      setCategories(cats);
      setMembers(team);
    })();
  }, []);

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    const url = await uploadMinervaContentFile(file);
    setUploading(false);
    if (!url) {
      toastError('Erreur', "Impossible de téléverser cette vidéo.");
      return;
    }
    setFileUrl(url);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const created = await createMinervaContentCategory(newCategoryName.trim());
    if (!created) {
      toastError('Erreur', 'Impossible de créer cette catégorie.');
      return;
    }
    setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setCategoryId(created.id);
    setNewCategoryName('');
    setAddingCategory(false);
  };

  const canSubmit =
    title.trim().length > 0 &&
    (kind === 'inspiration' ? externalUrl.trim().length > 0 : fileUrl.length > 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !userId) return;
    setSaving(true);

    const created = await createMinervaContentItem({
      kind,
      title: title.trim(),
      category_id: categoryId || null,
      external_url: kind === 'inspiration' ? externalUrl.trim() : null,
      note: kind === 'inspiration' ? note.trim() || null : null,
      file_url: kind === 'own_video' ? fileUrl : null,
      scheduled_date: kind === 'own_video' ? scheduledDate || null : null,
      assignee_id: kind === 'own_video' ? assigneeId || null : null,
      created_by: userId,
    });

    if (!created) {
      setSaving(false);
      toastError('Erreur', 'Impossible d’ajouter cet élément. Réessayez.');
      return;
    }

    if (kind === 'own_video' && sendToOpusClip && fileUrl) {
      try {
        const res = await fetch('/api/opus-clip/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: fileUrl, title: title.trim(), contentItemId: created.id }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          toastError('Opus Clip', body?.error || "La vidéo est ajoutée, mais l'envoi vers Opus Clip a échoué.");
        }
      } catch {
        toastError('Opus Clip', "La vidéo est ajoutée, mais l'envoi vers Opus Clip a échoué (erreur réseau).");
      }
    }

    setSaving(false);
    router.push('/content-planner');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/content-planner" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour au planificateur
      </Link>

      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">Ajouter au contenu Minerva</h1>
        <p className="text-sm text-mv-ink-soft mt-1">Une inspiration à référencer, ou une de nos propres vidéos à planifier.</p>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
          <SectionLabel>Type</SectionLabel>
          <div className="flex items-center bg-mv-cream-soft border border-mv-border rounded-xl p-1 text-xs w-fit">
            <button
              type="button"
              onClick={() => setKind('inspiration')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer',
                kind === 'inspiration' ? 'bg-mv-green text-white shadow-mv-sm' : 'text-mv-ink-soft hover:text-mv-ink'
              )}
            >
              <Link2 className="w-3.5 h-3.5" /> Inspiration
            </button>
            <button
              type="button"
              onClick={() => setKind('own_video')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer',
                kind === 'own_video' ? 'bg-mv-green text-white shadow-mv-sm' : 'text-mv-ink-soft hover:text-mv-ink'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" /> Vidéo Minerva
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-mv-ink mb-1.5">Titre</label>
            <input
              type="text"
              required
              placeholder={kind === 'inspiration' ? 'Ex: Format témoignage rapide — @compte' : 'Ex: Reel — coulisses onboarding client'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-mv-ink mb-1.5">Catégorie</label>
            {addingCategory ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nom de la nouvelle catégorie"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="p-2.5 rounded-xl bg-mv-green text-white hover:bg-mv-green-dark transition-colors cursor-pointer shrink-0"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingCategory(false); setNewCategoryName(''); }}
                  className="text-xs font-bold text-mv-ink-faint hover:text-mv-ink shrink-0"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green"
                >
                  <option value="">Sans catégorie</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setAddingCategory(true)}
                  className="p-2.5 rounded-xl border border-mv-border text-mv-ink-soft hover:border-mv-green/40 hover:text-mv-ink transition-colors cursor-pointer shrink-0"
                  title="Nouvelle catégorie"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {kind === 'inspiration' ? (
          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Référence</SectionLabel>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Lien externe</label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  required
                  placeholder="https://www.instagram.com/reel/…"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink font-mono focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Pourquoi c&apos;est une bonne référence (optionnel)</label>
              <textarea
                rows={3}
                placeholder="Ce qui nous inspire dans ce format…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Vidéo</SectionLabel>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Fichier vidéo</label>
              <label
                className={cn(
                  'border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer',
                  'border-mv-border hover:border-mv-green/50 bg-mv-cream-soft/40'
                )}
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-mv-green animate-spin" />
                ) : fileUrl ? (
                  <Check className="w-6 h-6 text-mv-green" />
                ) : (
                  <UploadCloud className="w-6 h-6 text-mv-green" />
                )}
                <div className="text-xs font-bold text-mv-ink text-center">
                  {uploading ? 'Envoi en cours…' : fileUrl ? 'Vidéo prête — cliquez pour en choisir une autre' : 'Cliquez pour choisir une vidéo'}
                </div>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadFile(file);
                  }}
                />
              </label>
            </div>

            {fileUrl && (
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-mv-cream-soft/60 border border-mv-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendToOpusClip}
                  onChange={(e) => setSendToOpusClip(e.target.checked)}
                  className="mt-0.5 accent-mv-green cursor-pointer"
                />
                <span className="text-xs">
                  <span className="font-bold text-mv-ink flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-mv-green" /> Envoyer à Opus Clip pour montage automatique
                  </span>
                  <span className="text-mv-ink-faint block mt-0.5">
                    Opus Clip génère des clips courts à partir de cette vidéo ; une fois prêts, ils sont déposés automatiquement dans le Google Drive de l&apos;équipe. Le résultat apparaît ensuite dans l&apos;onglet « Montages Opus Clip ».
                  </span>
                </span>
              </label>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Date de publication prévue (optionnel)</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Assigné à (optionnel)</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green"
                >
                  <option value="">Personne en particulier</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href="/content-planner">
            <Button variant="ghost" type="button">Annuler</Button>
          </Link>
          <Button type="submit" variant="primary" disabled={!canSubmit || saving}>
            {saving ? 'Ajout…' : '+ Ajouter'}
          </Button>
        </div>
      </form>
    </div>
  );
}
