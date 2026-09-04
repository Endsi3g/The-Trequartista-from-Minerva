'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, MessageSquare, CheckCheck, Sparkles, User, Bot } from 'lucide-react';
import { useClientChatThread } from '@/hooks/use-client-chat-thread';
import { TeamOnlineBadge } from '@/components/portal/TeamOnlineBadge';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface RealtimePortalChatProps {
  clientId: string;
  clientName: string;
  token: string;
  className?: string;
}

export function RealtimePortalChat({
  clientId,
  clientName,
  token,
  className,
}: RealtimePortalChatProps) {
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { messages, loading, send } = useClientChatThread(
    clientId,
    `portal-user-${token.slice(0, 8)}`,
    clientName || 'Client Partenaire',
    'client'
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!draft.trim() || isSending) return;

    setIsSending(true);
    try {
      await send(draft.trim());
      setDraft('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn('bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden flex flex-col', className)}>
      {/* Chat Header */}
      <div className="h-11 px-4 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-900 block leading-tight">
              Canal Direct avec l’Équipe Minerva
            </span>
            <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
              Temps réel synchronisé
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TeamOnlineBadge />
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[300px] max-h-[460px] bg-zinc-50/30">
        {loading ? (
          <div className="h-40 flex flex-col items-center justify-center text-xs text-zinc-400 font-mono space-y-2" style={MONO}>
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Connexion au canal de support direct...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-zinc-800">
              Bienvenue dans votre espace d'échange direct
            </p>
            <p className="text-[11px] text-zinc-500 max-w-sm leading-relaxed">
              Une question sur un livrable, un délai ou une nouvelle demande ? Écrivez-nous directement ici, notre équipe vous répond en direct.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-1.5">
              {[
                'Question sur le sprint en cours',
                'Demande d’ajustement sur un livrable',
                'Planifier un point d’étape',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setDraft(suggestion)}
                  className="px-2.5 py-1 rounded-md text-[10.5px] bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-600 transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isClient = msg.sender_role === 'client';
            const timeStr = new Date(msg.created_at).toLocaleTimeString('fr-CA', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={cn('flex flex-col', isClient ? 'items-end' : 'items-start')}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                    {timeStr}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold',
                      isClient ? 'text-emerald-700' : 'text-zinc-700'
                    )}
                  >
                    {isClient ? 'Vous' : msg.sender_name || 'Équipe Minerva'}
                  </span>
                </div>

                <div
                  className={cn(
                    'max-w-[85%] rounded-lg p-3 text-xs leading-relaxed shadow-2xs',
                    isClient
                      ? 'bg-emerald-700 text-white rounded-tr-none'
                      : 'bg-white border border-zinc-200 text-zinc-900 rounded-tl-none'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-3 border-t border-zinc-200 bg-white">
        <form onSubmit={handleSend} className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez un message à votre équipe Minerva... (Entrée pour envoyer)"
            rows={2}
            className="w-full p-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 resize-none transition-all"
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline" style={MONO}>
              Maj + Entrée pour un saut de ligne
            </span>

            <button
              type="submit"
              disabled={isSending || !draft.trim()}
              className="h-8 px-3 rounded-md bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ml-auto"
            >
              {isSending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Envoyer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
