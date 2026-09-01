'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, Plus, SlidersHorizontal, ChevronDown, RefreshCw, Maximize2, Minimize2, Workflow, ClipboardList, Search, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function AiAssistantSpeedDial() {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut ⌘J or Ctrl+J to toggle speed dial
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
      setTimeout(() => inputRef.current?.focus(), 150);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

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
        body: JSON.stringify({ message: query }),
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

  const resetConversation = () => {
    setMessages([]);
    setDraft('');
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
              ? 'bg-zinc-900 text-white border-zinc-700'
              : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white border-emerald-500/30'
          )}
          title="Assistant IA Minerva (⌘J)"
          aria-label="Ouvrir l'Assistant IA Minerva"
        >
          <Sparkles className={cn('w-4 h-4 text-emerald-300 transition-transform duration-300', isOpen && 'rotate-90')} />
          <span className="text-xs font-bold tracking-tight pr-1">Assistant IA</span>
          <kbd className="hidden sm:inline-flex text-[9px] font-mono bg-black/25 px-1 py-0.5 rounded text-white/80">
            ⌘J
          </kbd>
        </button>
      </div>

      {/* ── Dark AI Panel (Notion-AI-style layout) ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div
            className={cn(
              'w-full bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-3 duration-200 transition-[width,height]',
              expanded ? 'sm:w-[640px] h-[85vh]' : 'sm:w-[420px] h-[560px]',
              'max-h-[85vh]'
            )}
          >
            {/* Header */}
            <div className="px-4 h-12 flex items-center justify-between border-b border-zinc-800/80 shrink-0">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <span className="text-[13px] font-medium">Nouvelle discussion avec l&apos;IA</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={resetConversation}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Nouvelle discussion"
                  aria-label="Nouvelle discussion"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="hidden sm:inline-flex p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title={expanded ? 'Réduire' : 'Agrandir'}
                  aria-label={expanded ? 'Réduire' : 'Agrandir'}
                >
                  {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            {messages.length === 0 ? (
              /* Empty state: centered mascot + prompt list, à la Notion AI */
              <div className="flex-1 flex flex-col items-center justify-end px-5 pb-6 gap-5 overflow-y-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Bot className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-white text-center">Quelle est ta question aujourd&apos;hui ?</h2>
                <div className="w-full space-y-1">
                  {QUICK_PROMPTS.map((p, idx) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(p.label)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer text-[13px]"
                      >
                        <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span className="truncate">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Message history */
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div key={m.id} className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
                      {!isUser && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[85%] rounded-lg p-2.5 space-y-1.5 leading-relaxed',
                          isUser
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        {m.sources && m.sources.length > 0 && (
                          <div className="pt-1 border-t border-zinc-800 text-[10px] text-zinc-500 space-y-0.5">
                            <span className="font-semibold block text-zinc-400">Sources Académie :</span>
                            {m.sources.map((s) => (
                              <span key={s.id} className="block text-emerald-400 truncate font-mono">
                                • {s.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isUser && (
                        <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {sending && (
                  <div className="flex gap-2.5 items-center text-xs text-zinc-500">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 animate-spin">
                      <RefreshCw className="w-3 h-3" />
                    </div>
                    <span className="italic">L’IA réfléchit et consulte les SOPs…</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Dark input bar, à la Notion AI */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="m-2.5 mt-0 bg-zinc-900 border border-zinc-800 rounded-xl shrink-0 focus-within:border-emerald-600/50 transition-colors"
            >
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Posez une question ou demandez une action…"
                className="w-full h-10 px-3.5 pt-1 text-[13px] bg-transparent focus:outline-none text-white placeholder:text-zinc-500"
                disabled={sending}
              />
              <div className="flex items-center justify-between px-2 pb-1.5">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Ajouter du contexte"
                    aria-label="Ajouter du contexte"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Options"
                    aria-label="Options"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-medium text-zinc-500">Automatique</span>
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    className="w-6 h-6 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
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
