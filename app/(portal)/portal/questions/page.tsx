'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useClientChatThread } from '@/hooks/use-client-chat-thread';
import { cn } from '@/lib/utils';

export default function PortalQuestionsPage() {
  const [clientId, setClientId] = useState('');
  const { id: userId, fullName } = useCurrentUser();
  const [draft, setDraft] = useState('');
  const [resolvingClient, setResolvingClient] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setResolvingClient(false); return; }
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).maybeSingle();
      if (profile?.client_id) setClientId(profile.client_id);
      setResolvingClient(false);
    })();
  }, []);

  const { messages, loading: loadingMessages, send } = useClientChatThread(clientId, userId, fullName || 'Vous', 'client');
  const loading = resolvingClient || loadingMessages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    const ok = await send(draft);
    setSending(false);
    if (ok) setDraft('');
  };

  return (
    <div className="space-y-6 pb-12 flex flex-col h-[calc(100vh-160px)]">
      <div>
        <h1 className="text-2xl font-extrabold text-mv-ink font-display">Questions à l'équipe Minerva</h1>
        <p className="text-xs text-mv-ink-faint mt-1">Écrivez votre message ci-dessous ; votre équipe Minerva y répondra directement ici.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden" contentClassName="p-0 flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <p className="text-xs text-mv-ink-faint text-center py-8">Chargement…</p>
          ) : messages.length === 0 ? (
            <p className="text-xs text-mv-ink-faint text-center py-8">
              Aucun message pour le moment — posez votre première question ci-dessous.
            </p>
          ) : (
            messages.map((m, i) => {
              const isClient = m.sender_role === 'client';
              const isOwn = m.sender_id === userId;
              const showHeader = i === 0 || messages[i - 1].sender_id !== m.sender_id;
              return (
                <div key={m.id} className={cn('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
                  {!isOwn && (
                    <UserAvatar
                      name={m.sender_name}
                      src={m.sender_avatar}
                      size="xs"
                      className={cn('shrink-0', showHeader ? 'visible' : 'invisible')}
                    />
                  )}
                  <div className={cn('max-w-[70%] min-w-0', isOwn ? 'items-end' : 'items-start', 'flex flex-col')}>
                    {showHeader && (
                      <span className={cn('text-[10px] font-bold text-mv-ink-faint mb-1 px-1', isOwn ? 'text-right' : 'text-left')}>
                        {isOwn ? 'Vous' : m.sender_name}
                      </span>
                    )}
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2.5 text-sm',
                        isClient ? 'bg-mv-green text-white' : 'bg-mv-cream-soft text-mv-ink border border-mv-border'
                      )}
                    >
                      <p>{m.body}</p>
                      <p className={cn('text-[10px] mt-1', isClient ? 'text-white/70' : 'text-mv-ink-faint')}>
                        {new Date(m.created_at).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-mv-border p-3 pb-4 flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Écrivez votre question…"
            className="flex-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3.5 py-2.5 text-sm text-mv-ink focus:outline-none focus:border-mv-green"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="p-2.5 rounded-xl bg-mv-green hover:bg-mv-green-dark text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </Card>
    </div>
  );
}
