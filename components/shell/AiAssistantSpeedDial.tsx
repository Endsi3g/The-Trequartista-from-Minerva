'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, User, Plus, SlidersHorizontal, ChevronDown, RefreshCw, Maximize2, Minimize2, Workflow, ClipboardList, Search, BookOpen, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoMark } from '@/components/shell/Logo';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useCurrentUser } from '@/hooks/use-current-user';
import { fetchAiConversations, fetchHelpChatMessagesByConversation } from '@/lib/services/supabase-data';
import type { AiConversation } from '@/lib/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { id: string; title: string }[];
}

const QUICK_PROMPTS: { icon: typeof Workflow; label: string }[] = [
  { icon: Workflow, label: 'Comment lier mes comptes dans Composio ?' },
  { icon: ClipboardList, label: 'Comment créer un devis avec acompte 50% ?' },
  { icon: Search, label: 'Comment qualifier un lead sur Minerva OS Lite ?' },
  { icon: BookOpen, label: 'Comment lancer le contrôle QA 20-points ?' },
];

const DEFAULT_TITLE = 'Nouvelle discussion avec l\'IA';
const MAX_TEXTAREA_HEIGHT = 120;

export function AiAssistantSpeedDial() {
  const { id: userId, fullName, avatarUrl } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard shortcut ⌘J ou Ctrl+J pour ouvrir/fermer le panneau
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  // Auto-grow the textarea up to a max height, scrolling internally beyond that.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [draft]);

  const loadConversations = async () => {
    if (!userId) return;
    setConversations(await fetchAiConversations(userId));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || draft).trim();
    if (!query || sending) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    setDraft('');
    setSending(true);

    try {
      const res = await fetch('/api/help-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, conversationId }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.answer || 'Je n’ai pas pu trouver de réponse.',
          sources: data.sources,
        };
        setMessages((prev) => [...prev, botMsg]);
        if (data.conversationId) setConversationId(data.conversationId);
        if (data.title) {
          setTitle(data.title);
          loadConversations();
        }
      } else {
        const botMsg: Message = {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: 'Désolé, une erreur est survenue lors de la communication avec l’IA. Vous pouvez poser votre question directement dans le chat d’équipe.',
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch {
      const botMsg: Message = {
        id: `bot-network-err-${Date.now()}`,
        role: 'assistant',
        content: 'Erreur réseau : impossible de joindre le serveur d’assistance.',
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setSending(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setDraft('');
    setConversationId(null);
    setTitle(DEFAULT_TITLE);
    setHistoryOpen(false);
  };

  const openConversation = async (conv: AiConversation) => {
    setHistoryOpen(false);
    setConversationId(conv.id);
    setTitle(conv.title);
    const rows = await fetchHelpChatMessagesByConversation(conv.id);
    setMessages(rows.map((r) => ({ id: r.id, role: r.role, content: r.content })));
  };

  const toggleHistory = () => {
    if (!historyOpen) loadConversations();
    setHistoryOpen((v) => !v);
  };

  return (
    <>
      {/* ── Floating SpeedDial Button ── */}
      <div className="fixed bottom-4 right-4 z-40 no-print flex items-center gap-2">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'group relative flex items-center gap-2 px-3 h-9 rounded-full shadow-mv-lg transition-all duration-200 cursor-pointer border',
            isOpen
              ? 'bg-mv-ink text-white border-mv-ink'
              : 'bg-mv-green hover:bg-mv-green-dark text-white border-mv-green-dark/40'
          )}
          title="Assistant IA Minerva (⌘J)"
          aria-label="Ouvrir l'Assistant IA Minerva"
        >
          <Sparkles className={cn('w-4 h-4 text-white transition-transform duration-300', isOpen && 'rotate-90')} />
          <span className="text-xs font-bold tracking-tight pr-1">Assistant IA</span>
          <kbd className="hidden sm:inline-flex text-[9px] font-mono bg-white/20 px-1 py-0.5 rounded text-white/90">
            ⌘J
          </kbd>
        </button>
      </div>

      {/* ── AI Panel (layout Notion-AI, thème clair Minerva) ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6 bg-black/20 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div
            className={cn(
              'w-full bg-mv-surface border border-mv-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-3 duration-200 transition-[width,height]',
              expanded ? 'sm:w-[640px] h-[85vh]' : 'sm:w-[420px] h-[560px]',
              'max-h-[85vh]'
            )}
          >
            {/* Header */}
            <div className="relative px-4 h-12 flex items-center justify-between border-b border-mv-border shrink-0">
              <button
                onClick={toggleHistory}
                className="flex items-center gap-1.5 text-mv-ink-soft hover:text-mv-ink transition-colors cursor-pointer min-w-0"
              >
                <span className="text-[13px] font-medium truncate max-w-[220px]">{title}</span>
                <ChevronDown className={cn('w-3.5 h-3.5 text-mv-ink-faint shrink-0 transition-transform', historyOpen && 'rotate-180')} />
              </button>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={startNewConversation}
                  className="p-1.5 rounded-md text-mv-ink-faint hover:text-mv-ink hover:bg-mv-cream-soft transition-colors cursor-pointer"
                  title="Nouvelle discussion"
                  aria-label="Nouvelle discussion"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="hidden sm:inline-flex p-1.5 rounded-md text-mv-ink-faint hover:text-mv-ink hover:bg-mv-cream-soft transition-colors cursor-pointer"
                  title={expanded ? 'Réduire' : 'Agrandir'}
                  aria-label={expanded ? 'Réduire' : 'Agrandir'}
                >
                  {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md text-mv-ink-faint hover:text-mv-ink hover:bg-mv-cream-soft transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Past-discussions dropdown */}
              {historyOpen && (
                <div className="absolute top-full left-2 mt-1 w-72 max-h-72 overflow-y-auto bg-mv-surface border border-mv-border rounded-xl shadow-mv-md z-10 py-1">
                  {conversations.length === 0 ? (
                    <p className="px-3 py-4 text-[12px] text-mv-ink-faint text-center">Aucune discussion précédente.</p>
                  ) : (
                    conversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => openConversation(c)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-mv-cream-soft transition-colors cursor-pointer',
                          c.id === conversationId && 'bg-mv-cream-soft'
                        )}
                      >
                        <MessageSquareText className="w-3.5 h-3.5 text-mv-ink-faint shrink-0" />
                        <span className="flex-1 min-w-0 truncate text-[12.5px] text-mv-ink">{c.title}</span>
                        <span className="text-[10px] text-mv-ink-faint font-mono shrink-0">
                          {new Date(c.updated_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Body */}
            {messages.length === 0 ? (
              /* Empty state: mascotte centrée + prompts suggérés, à la Notion AI */
              <div className="flex-1 flex flex-col items-center justify-end px-5 pb-6 gap-5 overflow-y-auto bg-mv-cream-soft/40">
                <div className="w-16 h-16 rounded-full bg-mv-green-tint border border-mv-green/25 flex items-center justify-center overflow-hidden shrink-0 p-3.5">
                  <LogoMark size={36} />
                </div>
                <h2 className="text-lg font-bold font-display text-mv-ink text-center">Quelle est ta question aujourd&apos;hui ?</h2>
                <div className="w-full space-y-1">
                  {QUICK_PROMPTS.map((p, idx) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(p.label)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-mv-ink-soft hover:bg-mv-surface hover:text-mv-ink border border-transparent hover:border-mv-border transition-colors cursor-pointer text-[13px]"
                      >
                        <Icon className="w-4 h-4 text-mv-ink-faint shrink-0" />
                        <span className="truncate">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Message history */
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs bg-mv-cream-soft/40">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div key={m.id} className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
                      {!isUser && (
                        <div className="w-6 h-6 rounded-full bg-mv-green-tint border border-mv-green/25 flex items-center justify-center overflow-hidden shrink-0 mt-0.5 p-1">
                          <LogoMark size={16} />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[85%] rounded-lg p-2.5 space-y-1.5 leading-relaxed',
                          isUser
                            ? 'bg-mv-green text-white rounded-br-none'
                            : 'bg-mv-surface border border-mv-border text-mv-ink rounded-bl-none shadow-2xs'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        {m.sources && m.sources.length > 0 && (
                          <div className="pt-1 border-t border-mv-border text-[10px] text-mv-ink-faint space-y-0.5">
                            <span className="font-semibold block text-mv-ink-soft">Sources Académie :</span>
                            {m.sources.map((s) => (
                              <span key={s.id} className="block text-mv-green truncate font-mono">
                                • {s.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isUser && (
                        fullName ? (
                          <UserAvatar name={fullName} src={avatarUrl} size="xs" className="w-6 h-6 text-[10px] shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-mv-border text-mv-ink-soft flex items-center justify-center shrink-0 mt-0.5">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
                {sending && (
                  <div className="flex gap-2.5 items-center text-xs text-mv-ink-faint">
                    <div className="w-6 h-6 rounded-full bg-mv-green-tint text-mv-green flex items-center justify-center shrink-0 animate-spin">
                      <RefreshCw className="w-3 h-3" />
                    </div>
                    <span className="italic">L’IA réfléchit et consulte les SOPs…</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Barre d'entrée, à la Notion AI, en thème clair */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="m-2.5 mt-0 bg-mv-cream-soft border border-mv-border rounded-xl shrink-0 focus-within:border-mv-green/60 transition-colors"
            >
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Posez une question ou demandez une action…"
                rows={1}
                className="w-full px-3.5 pt-2.5 text-[13px] bg-transparent focus:outline-none text-mv-ink placeholder:text-mv-ink-faint resize-none overflow-y-auto"
                style={{ maxHeight: MAX_TEXTAREA_HEIGHT }}
                disabled={sending}
              />
              <div className="flex items-center justify-between px-2 pb-1.5">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    className="p-1.5 rounded-md text-mv-ink-faint hover:text-mv-ink hover:bg-mv-border/50 transition-colors cursor-pointer"
                    title="Ajouter du contexte"
                    aria-label="Ajouter du contexte"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-md text-mv-ink-faint hover:text-mv-ink hover:bg-mv-border/50 transition-colors cursor-pointer"
                    title="Options"
                    aria-label="Options"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-medium text-mv-ink-faint">Automatique</span>
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    className="w-6 h-6 rounded-full bg-mv-green hover:bg-mv-green-dark disabled:opacity-30 disabled:hover:bg-mv-green text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    aria-label="Envoyer"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
