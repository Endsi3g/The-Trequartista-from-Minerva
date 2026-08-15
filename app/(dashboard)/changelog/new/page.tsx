'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ImageUploadField } from '@/components/media/ImageUploadField';
import { addChangelogEntry } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function NewChangelogEntryPage() {
  const router = useRouter();
  const { role, loading: userLoading } = useCurrentUser();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [version, setVersion] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [includedItems, setIncludedItems] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    await addChangelogEntry({
      title: title.trim(),
      body: body.trim(),
      image_url: imageUrl || null,
      version: version.trim() || null,
      included_items: includedItems.map((i) => i.trim()).filter(Boolean),
      created_by: user.id,
    });

    setSaving(false);
    router.push('/changelog');
  };

  if (!userLoading && role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé aux administrateurs.</p>
        <Link href="/changelog" className="text-xs text-mv-green hover:underline">Retour aux nouveautés</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/changelog" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux nouveautés
      </Link>

      <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">Nouvelle Entrée</h1>

      <Card>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Titre</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Le calendrier éditorial défile maintenant sur mobile"
              className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Version (optionnel)</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="2.0"
              className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Description</label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-mv-ink">Ce qui est inclus (optionnel)</label>
            {includedItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => setIncludedItems((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                  placeholder="Nouvelle fonctionnalité ou correction…"
                  className="flex-1 px-3.5 py-2 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green"
                />
                {includedItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIncludedItems((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-2 rounded-lg text-mv-ink-faint hover:bg-mv-red-bg hover:text-mv-red transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setIncludedItems((prev) => [...prev, ''])}
              className="text-xs font-bold text-mv-green hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter un élément
            </button>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Image (optionnel)</label>
            <ImageUploadField value={imageUrl} onChange={setImageUrl} />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-mv-green hover:bg-mv-green-dark text-white font-bold text-sm rounded-xl shadow-mv-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Publication…' : 'Publier'}
          </button>
        </form>
      </Card>
    </div>
  );
}
