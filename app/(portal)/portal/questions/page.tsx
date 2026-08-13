'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { fetchClientMessages, sendClientMessage } from '@/lib/services/supabase-data';
import type { ClientMessage } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function PortalQuestionsPage() {
  const [clientId, setClientId] = useState('');
  const [userId, setUserId] = useState('');
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).maybeSingle();
      if (profile?.client_id) {
        setClientId(profile.client_id);
        setMessages(await fetchClientMessages(profile.client_id));
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !clientId || !userId) return;
    setSending(true);
    const ok = await sendClientMessage(clientId, userId, 'client', draft.trim());
    setSending(false);
    if (ok) {
      setMessages(await fetchClientMessages(clientId));
      setDraft('');
    }
  };

  return (
    <div className="space-y-6 pb-12 flex flex-col h-[calc(100vh-160px)]">
      <h1 className="text-2xl font-extrabold text-mv-ink font-display">Questions à l'équipe Minerva</h1>

      <Card className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <p className="text-xs text-mv-ink-faint text-center py-8">Chargement…</p>
          ) : messages.length === 0 ? (
            <p className="text-xs text-mv-ink-faint text-center py-8">
              Aucun message pour le moment — posez votre première question ci-dessous.
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn('flex', m.sender_role === 'client' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                    m.sender_role === 'client' ? 'bg-mv-green text-white' : 'bg-mv-cream-soft text-mv-ink border border-mv-border'
                  )}
                >
                  <p>{m.body}</p>
                  <p className={cn('text-[10px] mt-1', m.sender_role === 'client' ? 'text-white/70' : 'text-mv-ink-faint')}>
                    {new Date(m.created_at).toLocaleString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-mv-border p-3 flex items-center gap-2">
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
