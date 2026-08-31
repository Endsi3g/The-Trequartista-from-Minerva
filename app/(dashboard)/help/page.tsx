'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Mail, MessageSquare, Phone, Plus, Trash2, Sparkles, Send, Bot, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageFadeIn } from '@/components/ui/page-transition';
import { SkeletonRows } from '@/components/ui/skeleton';
import {
  fetchHelpArticles,
  deleteHelpArticle,
  fetchHelpChatMessages,
  fetchAllHelpChatMessagesForAdmin,
} from '@/lib/services/supabase-data';
import type { HelpArticle, HelpChatMessage } from '@/lib/types';
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

// "Demander à l'IA" tab: a 1:1 chatbot grounded in the rebuilt Academy
// content (chantier 3), so a team member can get an answer without
// needing to ask Kael directly. Runs on Gemini -- see
// app/api/help-chat/route.ts and lib/services/gemini.ts.
function AiHelpChat({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<HelpChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (userId) setMessages(await fetchHelpChatMessages(userId));
      setLoading(false);
    })();
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    const optimisticUser: HelpChatMessage = {
      id: `optimistic-${Date.now()}`,
      user_id: userId,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setDraft('');

    try {
      const res = await fetch('/api/help-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue.');
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, user_id: userId, role: 'assistant', content: data.answer, created_at: new Date().toISOString() },
      ]);
    } catch {
      setError('Impossible de contacter le serveur.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-mv-surface border border-mv-border rounded-2xl shadow-mv-sm flex flex-col h-[480px]">
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {loading ? (
          <SkeletonRows count={3} />
        ) : messages.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Bot className="w-6 h-6 text-mv-ink-faint mx-auto" />
            <p className="text-xs text-mv-ink-faint">
              Pose une question sur l&apos;utilisation de l&apos;app -- je réponds à partir de l&apos;Académie interne.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-xl px-3.5 py-2 text-xs leading-relaxed whitespace-pre-wrap',
                  m.role === 'user' ? 'bg-mv-green text-white' : 'bg-mv-cream-soft text-mv-ink border border-mv-border'
                )}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="px-5 py-2 text-[11px] text-mv-red bg-mv-red-bg/60 border-t border-mv-border">{error}</div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-mv-border">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Pose ta question..."
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-mv-border text-xs text-mv-ink placeholder:text-mv-ink-faint focus:outline-none focus:border-mv-green"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="shrink-0 w-9 h-9 rounded-xl bg-mv-green hover:bg-mv-green/90 disabled:opacity-40 text-white flex items-center justify-center cursor-pointer transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

// Admin-only: every question asked across the team, not anonymized -- an
// explicit product decision so Kael can spot real gaps in the Academy.
function AdminHelpChatLog() {
  const [rows, setRows] = useState<HelpChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setRows(await fetchAllHelpChatMessagesForAdmin());
      setLoading(false);
    })();
  }, []);

  const questions = useMemo(() => rows.filter((r) => r.role === 'user'), [rows]);

  return (
    <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 shadow-mv-sm space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-mv-ink-faint uppercase tracking-wider">
        <Users className="w-3.5 h-3.5" />
        <span>Questions posées par l&apos;équipe ({questions.length})</span>
      </div>
      {loading ? (
        <SkeletonRows count={3} />
      ) : questions.length === 0 ? (
        <p className="text-[11px] text-mv-ink-faint italic">Personne n&apos;a encore utilisé le chatbot IA.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {questions.map((q) => (
            <div key={q.id} className="p-2.5 rounded-lg border border-mv-border bg-white">
              <div className="flex items-center justify-between text-[10.5px] text-mv-ink-faint mb-1">
                <span className="font-semibold text-mv-ink">{q.user_name}</span>
                <span>{new Date(q.created_at).toLocaleDateString('fr-CA')}</span>
              </div>
              <p className="text-xs text-mv-ink-soft">{q.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'faq' | 'ai'>('faq');
  const { id: userId, role } = useCurrentUser();
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

      {/* Tab switcher: FAQ vs AI chatbot */}
      <div className="flex items-center justify-center gap-1 p-1 bg-mv-cream-soft rounded-xl w-fit mx-auto">
        <button
          onClick={() => setActiveTab('faq')}
          className={cn(
            'px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer',
            activeTab === 'faq' ? 'bg-white text-mv-ink shadow-mv-sm' : 'text-mv-ink-soft hover:text-mv-ink'
          )}
        >
          FAQ
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer',
            activeTab === 'ai' ? 'bg-white text-mv-ink shadow-mv-sm' : 'text-mv-ink-soft hover:text-mv-ink'
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-mv-green" />
          <span>Demander à l&apos;IA</span>
        </button>
      </div>

      {activeTab === 'faq' ? (
        <>
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
        </>
      ) : (
        <div className="space-y-5">
          {userId && <AiHelpChat userId={userId} />}
          {isAdmin && <AdminHelpChatLog />}
        </div>
      )}

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
