'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Mail, MessageSquare, Phone, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageFadeIn } from '@/components/ui/page-transition';
import { SkeletonRows } from '@/components/ui/skeleton';
import { fetchHelpArticles, deleteHelpArticle } from '@/lib/services/supabase-data';
import type { HelpArticle } from '@/lib/types';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useConfirm } from '@/components/providers/ConfirmProvider';

function FaqItem({ faq, isAdmin, onDelete }: { faq: HelpArticle; isAdmin: boolean; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-mv-border/80 last:border-b-0">
      <div className="w-full flex items-center justify-between gap-4 py-4 sm:py-5 group">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center justify-between gap-4 text-left cursor-pointer min-w-0"
        >
          <span className="font-bold text-sm text-mv-ink group-hover:text-mv-green transition-colors">
            {faq.question}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-mv-ink-faint shrink-0 transition-transform duration-200',
              open && 'rotate-180 text-mv-green'
            )}
          />
        </button>
        {isAdmin && (
          <button
            onClick={() => onDelete(faq.id)}
            className="shrink-0 p-1.5 rounded-lg text-mv-ink-faint hover:text-mv-red hover:bg-mv-red-bg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
            title="Supprimer cette question"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {open && (
        <p className="text-xs sm:text-sm text-mv-ink-soft pb-5 -mt-1 leading-relaxed animate-mv-fade-up">
          {faq.answer}
        </p>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useCurrentUser();
  const isAdmin = role === 'admin';
  const confirmDialog = useConfirm();

  const loadArticles = async () => setArticles(await fetchHelpArticles());

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadArticles();
      setLoading(false);
    })();
  }, []);

  const handleDelete = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Supprimer cette question ?',
      message: 'Elle disparaîtra immédiatement de la page Aide.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    setArticles((prev) => prev.filter((a) => a.id !== id));
    await deleteHelpArticle(id);
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return articles;
    const q = query.toLowerCase();
    return articles.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  }, [articles, query]);

  return (
    <PageFadeIn className="max-w-3xl mx-auto space-y-10 pb-16 pt-4">
      {/* Centered Hero Header (Shadcnblocks inspiration) */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-mv-ink tracking-tight font-display">
          Comment pouvons-nous vous aider ?
        </h1>
        <p className="text-xs sm:text-sm text-mv-ink-soft max-w-lg mx-auto">
          Trouvez les réponses aux questions courantes ou contactez directement l&apos;équipe Minerva.
        </p>
      </div>

      {/* Large Search Input + Admin CTA */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-mv-ink-faint absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une réponse ou un sujet..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-mv-surface border border-mv-border text-sm text-mv-ink placeholder:text-mv-ink-faint focus:outline-none focus:border-mv-green shadow-mv-sm"
          />
        </div>
        {isAdmin && (
          <Link
            href="/help/new"
            className="shrink-0 flex items-center gap-1.5 px-4 py-3.5 rounded-2xl bg-mv-ink hover:bg-black text-white text-xs font-bold shadow-mv-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ajouter</span>
          </Link>
        )}
      </div>

      {/* FAQ Accordion List */}
      <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm">
        {loading ? (
          <SkeletonRows count={4} />
        ) : articles.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <p className="text-xs sm:text-sm text-mv-ink-faint">Aucune question pour le moment.</p>
            {isAdmin && (
              <Link href="/help/new" className="text-xs font-bold text-mv-green hover:underline">
                Ajouter la première question →
              </Link>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-10 text-xs sm:text-sm text-mv-ink-faint">
            Aucun résultat trouvé pour « {query} ».
          </p>
        ) : (
          <div className="divide-y divide-mv-border/80">
            {filtered.map((faq) => (
              <FaqItem key={faq.id} faq={faq} isAdmin={isAdmin} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom "Still need help?" Box (Shadcnblocks inspiration) */}
      <div className="bg-mv-cream-soft/80 border border-mv-border rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-mv-sm">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-extrabold text-mv-ink font-display">
            Besoin d&apos;aide supplémentaire ?
          </h2>
          <p className="text-xs text-mv-ink-soft">
            Notre équipe et nos ressources d&apos;assistance sont à votre entière disposition.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Link
            href="/chat"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-mv-surface border border-mv-border text-xs font-bold text-mv-ink hover:border-mv-green/50 hover:shadow-mv-sm transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-mv-green" />
            <span>Chat d&apos;assistance</span>
          </Link>

          <a
            href="mailto:contact@minervaflow.com"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-mv-surface border border-mv-border text-xs font-bold text-mv-ink hover:border-mv-green/50 hover:shadow-mv-sm transition-all cursor-pointer"
          >
            <Mail className="w-4 h-4 text-mv-green" />
            <span>Envoyer un courriel</span>
          </a>

          <a
            href="tel:+15140000000"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-mv-surface border border-mv-border text-xs font-bold text-mv-ink hover:border-mv-green/50 hover:shadow-mv-sm transition-all cursor-pointer"
          >
            <Phone className="w-4 h-4 text-mv-green" />
            <span>Nous appeler</span>
          </a>
        </div>
      </div>
    </PageFadeIn>
  );
}
