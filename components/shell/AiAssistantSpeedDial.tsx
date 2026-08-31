'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, ArrowRight, ExternalLink, Zap, HelpCircle, CornerDownLeft, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { id: string; title: string }[];
}

const QUICK_PROMPTS = [
  'Comment lier mes comptes dans Composio ?',
  'Comment créer un devis avec acompte 50% ?',
  'Comment onboarder un client sur Minerva Flow ?',
  'Comment qualifier un lead sur Minerva OS Lite ?',
  'Comment lancer le contrôle QA 20-points ?',
];

export function AiAssistantSpeedDial() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Bonjour ! Je suis l’Assistant IA de Minerva. Je peux vous aider à naviguer dans l’ERP, configurer vos outils Composio, préparer des propositions commerciales ou consulter les procédures de l’Académie.',
    },
  ]);
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

      {/* ── Modal Floating Drawer ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end sm:p-6 bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <div className="w-full sm:w-[420px] max-h-[85vh] h-[560px] bg-white border border-zinc-200 rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-3 duration-200">
            {/* Header */}
            <div className="px-4 py-3 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Assistant IA Minerva</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-zinc-400">Documentation, Composio & Actions ERP</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick action chips */}
            <div className="p-2.5 bg-zinc-50 border-b border-zinc-200/80 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Message history */}
            <div className="flex-1 p-3.5 space-y-3 overflow-y-auto bg-zinc-50/30 text-xs">
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div key={m.id} className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
                    {!isUser && (
                      <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] rounded-lg p-2.5 space-y-1.5 leading-relaxed',
                        isUser
                          ? 'bg-zinc-900 text-white rounded-br-none'
                          : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-none shadow-2xs'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.sources && m.sources.length > 0 && (
                        <div className="pt-1 border-t border-zinc-100 text-[10px] text-zinc-400 space-y-0.5">
                          <span className="font-semibold block text-zinc-500">Sources Académie :</span>
                          {m.sources.map((s) => (
                            <span key={s.id} className="block text-emerald-600 truncate font-mono">
                              • {s.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {isUser && (
                      <div className="w-6 h-6 rounded-md bg-zinc-200 text-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
              {sending && (
                <div className="flex gap-2.5 items-center text-xs text-zinc-400">
                  <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold animate-spin">
                    <RefreshCw className="w-3 h-3" />
                  </div>
                  <span className="italic">L’IA réfléchit et consulte les SOPs…</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-2.5 bg-white border-t border-zinc-200 flex items-center gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Posez une question ou demandez une action…"
                className="flex-1 h-8 px-3 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 text-zinc-900 placeholder:text-zinc-400"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
