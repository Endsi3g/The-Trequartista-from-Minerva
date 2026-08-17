'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, FolderKanban, Users, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useTeamChatThread } from '@/hooks/use-team-chat-thread';
import { fetchProjects, fetchClients } from '@/lib/services/supabase-data';
import type { Project, Client } from '@/lib/types';
import { cn } from '@/lib/utils';

type Channel = { type: 'project' | 'client'; id: string; label: string; sublabel: string };

export default function ChatPage() {
  const { id: userId, fullName } = useCurrentUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [active, setActive] = useState<Channel | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [p, c] = await Promise.all([fetchProjects(), fetchClients()]);
      setProjects(p);
      setClients(c);
      setLoadingChannels(false);
    })();
  }, []);

  const { messages, loading: loadingMessages, send } = useTeamChatThread(
    active?.type || 'client',
    active?.id,
    userId,
    fullName || 'Membre'
  );

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
        <h1 className="text-2xl font-extrabold text-mv-ink font-display">Chat d&apos;équipe</h1>
        <p className="text-xs text-mv-ink-faint mt-1">Un canal par projet ou par client — la discussion reste attachée au bon dossier.</p>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Channel list */}
        <Card className="w-64 shrink-0 p-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {loadingChannels ? (
              <p className="text-xs text-mv-ink-faint text-center py-8">Chargement…</p>
            ) : (
              <>
                <div className="px-3 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-mv-ink-faint">Projets</div>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActive({ type: 'project', id: p.id, label: p.name, sublabel: p.client_name || '' })}
                    className={cn(
                      'w-full text-left px-3 py-2 flex items-center gap-2 text-xs hover:bg-mv-cream-soft transition-colors cursor-pointer',
                      active?.type === 'project' && active.id === p.id && 'bg-mv-green-tint text-mv-green font-bold'
                    )}
                  >
                    <FolderKanban className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}

                <div className="px-3 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-mv-ink-faint">Clients</div>
                {clients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActive({ type: 'client', id: c.id, label: c.name, sublabel: c.industry || '' })}
                    className={cn(
                      'w-full text-left px-3 py-2 flex items-center gap-2 text-xs hover:bg-mv-cream-soft transition-colors cursor-pointer',
                      active?.type === 'client' && active.id === c.id && 'bg-mv-green-tint text-mv-green font-bold'
                    )}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}

                {projects.length === 0 && clients.length === 0 && (
                  <p className="text-xs text-mv-ink-faint text-center py-8 px-3">Aucun projet ni client pour le moment.</p>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Thread */}
        <Card className="flex-1 flex flex-col overflow-hidden p-0 min-w-0">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6">
              <MessageSquare className="w-8 h-8 text-mv-ink-faint" />
              <p className="text-sm text-mv-ink-soft">Choisis un projet ou un client à gauche pour ouvrir son canal.</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-mv-border shrink-0">
                <div className="font-bold text-sm text-mv-ink">{active.label}</div>
                {active.sublabel && <div className="text-[11px] text-mv-ink-faint">{active.sublabel}</div>}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <p className="text-xs text-mv-ink-faint text-center py-8">Chargement…</p>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-mv-ink-faint text-center py-8">Aucun message dans ce canal — lance la discussion.</p>
                ) : (
                  messages.map((m, i) => {
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
                        <div className={cn('max-w-[70%] min-w-0 flex flex-col', isOwn ? 'items-end' : 'items-start')}>
                          {showHeader && (
                            <span className="text-[10px] font-bold text-mv-ink-faint mb-1 px-1">
                              {isOwn ? 'Vous' : m.sender_name}
                            </span>
                          )}
                          <div className={cn(
                            'rounded-2xl px-4 py-2.5 text-sm',
                            isOwn ? 'bg-mv-green text-white' : 'bg-mv-cream-soft text-mv-ink border border-mv-border'
                          )}>
                            <p>{m.body}</p>
                            <p className={cn('text-[10px] mt-1', isOwn ? 'text-white/70' : 'text-mv-ink-faint')}>
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

              <form onSubmit={handleSend} className="border-t border-mv-border p-3 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Écrire dans #${active.label}…`}
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
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
