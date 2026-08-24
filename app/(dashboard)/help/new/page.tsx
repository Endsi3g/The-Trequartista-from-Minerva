'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { addHelpArticle } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function NewHelpArticlePage() {
  const router = useRouter();
  const { role, loading: userLoading } = useCurrentUser();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    await addHelpArticle({
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim() || null,
      created_by: user.id,
    });

    setSaving(false);
    router.push('/help');
  };

  if (!userLoading && role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé aux administrateurs.</p>
        <Link href="/help" className="text-xs text-mv-green hover:underline">Retour à l&apos;aide</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/help" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour à l&apos;aide
      </Link>

      <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">Nouvelle Question</h1>

      <Card>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Question</label>
            <input
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Comment inviter un nouveau membre dans l'équipe ?"
              className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Réponse</label>
            <textarea
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Catégorie (optionnel)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Équipe, Facturation, Contenu…"
              className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green"
            />
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
