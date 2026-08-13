'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { addAcademySop } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import { VideoUploadField } from '@/components/media/VideoUploadField';
import type { AcademySOP } from '@/lib/types';

export default function NewSopPage() {
  const router = useRouter();
  const { toastError } = useToast();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<AcademySOP['category']>('Design Framer');
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

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/academy" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour à l'académie
      </Link>

      <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">Créer une Nouvelle SOP</h1>

      <Card>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-mv-ink">Titre de la SOP</label>
            <input
              type="text"
              required
              placeholder="Ex: Procédure de Validation Qualité Framer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-mv-ink">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AcademySOP['category'])}
                className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer font-medium"
              >
                <option value="Design Framer">Design Framer</option>
                <option value="Workflows IA">Workflows IA</option>
                <option value="Campagnes Ads">Campagnes Ads</option>
                <option value="Loi 25 & Compliance">Loi 25 & Compliance</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-mv-ink">Temps de lecture (min)</label>
              <input
                type="number"
                min="1"
                value={readTime}
                onChange={(e) => setReadTime(Number(e.target.value))}
                className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-mv-ink">Auteur</label>
            <input
              type="text"
              placeholder="Votre nom"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <div>
            <label className="font-bold text-mv-ink">Vidéo (optionnelle)</label>
            <div className="mt-1">
              <VideoUploadField value={videoUrl} onChange={setVideoUrl} />
            </div>
          </div>

          <div>
            <label className="font-bold text-mv-ink">Description & Étapes SOP</label>
            <textarea
              rows={8}
              required
              placeholder="Collez ou saisissez la description détaillée et les consignes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl p-3 text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-mv-border">
            <Link href="/academy">
              <Button variant="outline" size="sm" type="button">
                Annuler
              </Button>
            </Link>
            <Button variant="primary" size="sm" type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer SOP'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
