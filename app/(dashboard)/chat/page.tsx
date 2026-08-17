'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, FolderKanban, Users, Send, Paperclip, Mic, Square } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useTeamChatThread } from '@/hooks/use-team-chat-thread';
import {
  fetchProjects,
  fetchClients,
  fetchTeamMembers,
  getOrCreateDmChannel,
  uploadTeamChatAttachment,
} from '@/lib/services/supabase-data';
import type { Project, Client, TeamMemberSummary } from '@/lib/types';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

type Channel = { type: 'project' | 'client' | 'member'; id: string; label: string; sublabel: string; memberId?: string };

export default function ChatPage() {
  const { id: userId, fullName } = useCurrentUser();
  const { toastError } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [members, setMembers] = useState<TeamMemberSummary[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [active, setActive] = useState<Channel | null>(null);
  const [resolvingMemberId, setResolvingMemberId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    (async () => {
      const [p, c, m] = await Promise.all([fetchProjects(), fetchClients(), fetchTeamMembers(userId)]);
      setProjects(p);
      setClients(c);
      setMembers(m);
      setLoadingChannels(false);
    })();
  }, [userId]);

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

  const handleSelectMember = async (member: TeamMemberSummary) => {
    setResolvingMemberId(member.id);
    const dmChannelId = await getOrCreateDmChannel(userId, member.id);
    setResolvingMemberId(null);
    if (!dmChannelId) {
      toastError('Erreur', "Impossible d'ouvrir cette conversation.");
      return;
    }
    setActive({ type: 'member', id: dmChannelId, label: member.full_name, sublabel: member.email, memberId: member.id });
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !active) return;
    setUploading(true);
    const attachment = await uploadTeamChatAttachment(file, active.type, active.id, file.name);
    setUploading(false);
    if (!attachment) {
      toastError('Erreur', 'Impossible de téléverser ce fichier.');
      return;
    }
    await send('', attachment);
  };

  const startRecording = async () => {
    if (!active) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size === 0) return;
        setUploading(true);
        const attachment = await uploadTeamChatAttachment(blob, active.type, active.id, `note-vocale-${Date.now()}.webm`);
        setUploading(false);
        if (!attachment) {
          toastError('Erreur', "Impossible d'envoyer la note vocale.");
          return;
        }
        await send('', attachment);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      toastError('Micro indisponible', "L'accès au micro a été refusé ou n'est pas disponible sur cet appareil.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const busy = sending || uploading || recording;

  return (
    <div className="space-y-6 pb-12 flex flex-col h-[calc(100vh-160px)]">
      <div>
        <h1 className="text-2xl font-extrabold text-mv-ink font-display">Chat d&apos;équipe</h1>
        <p className="text-xs text-mv-ink-faint mt-1">Un canal par projet, par client ou en privé avec un collègue — la discussion reste attachée au bon dossier.</p>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Channel list */}
        <Card className="w-64 shrink-0 overflow-hidden flex flex-col" contentClassName="p-0 flex-1 flex flex-col min-h-0">
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

                <div className="px-3 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-mv-ink-faint">Équipe</div>
                {members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMember(m)}
                    disabled={resolvingMemberId === m.id}
                    className={cn(
                      'w-full text-left px-3 py-2 flex items-center gap-2 text-xs hover:bg-mv-cream-soft transition-colors cursor-pointer disabled:opacity-60',
                      active?.type === 'member' && active.memberId === m.id && 'bg-mv-green-tint text-mv-green font-bold'
                    )}
                  >
                    <UserAvatar name={m.full_name} src={m.avatar_url || ''} size="xs" className="shrink-0" />
                    <span className="truncate">{resolvingMemberId === m.id ? 'Ouverture…' : m.full_name}</span>
                  </button>
                ))}

                {projects.length === 0 && clients.length === 0 && members.length === 0 && (
                  <p className="text-xs text-mv-ink-faint text-center py-8 px-3">Aucun projet, client ou collègue pour le moment.</p>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Thread */}
        <Card className="flex-1 flex flex-col overflow-hidden min-w-0" contentClassName="p-0 flex-1 flex flex-col min-h-0">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6">
              <MessageSquare className="w-8 h-8 text-mv-ink-faint" />
              <p className="text-sm text-mv-ink-soft">Choisis un projet, un client ou un collègue à gauche pour ouvrir son canal.</p>
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
                            {(m.attachment_type === 'image' || m.attachment_type === 'gif') && m.attachment_url && (
                              <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
                                {/* eslint-disable-next-line @next/next/no-img-element -- remote Supabase Storage URL, thumbnail only */}
                                <img
                                  src={m.attachment_url}
                                  alt={m.attachment_name || 'Image'}
                                  className="rounded-lg max-w-[220px] max-h-[220px] object-cover"
                                />
                              </a>
                            )}
                            {m.attachment_type === 'audio' && m.attachment_url && (
                              <audio controls src={m.attachment_url} className="mb-1.5 max-w-[220px]" />
                            )}
                            {m.attachment_type === 'file' && m.attachment_url && (
                              <a
                                href={m.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  'flex items-center gap-1.5 text-xs underline mb-1.5',
                                  isOwn ? 'text-white' : 'text-mv-green'
                                )}
                              >
                                <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{m.attachment_name || 'Fichier'}</span>
                              </a>
                            )}
                            {m.body && <p>{m.body}</p>}
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

              <input ref={fileInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleFileSelected} />

              <form onSubmit={handleSend} className="border-t border-mv-border p-3 pb-4 flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                  title="Joindre une image ou un GIF"
                  className="p-2.5 rounded-xl text-mv-ink-soft hover:bg-mv-cream-soft hover:text-mv-ink transition-all disabled:opacity-40 cursor-pointer shrink-0"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  disabled={sending || uploading}
                  title={recording ? 'Arrêter et envoyer la note vocale' : 'Enregistrer une note vocale'}
                  className={cn(
                    'p-2.5 rounded-xl transition-all disabled:opacity-40 cursor-pointer shrink-0',
                    recording ? 'bg-mv-red text-white animate-pulse' : 'text-mv-ink-soft hover:bg-mv-cream-soft hover:text-mv-ink'
                  )}
                >
                  {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={uploading ? 'Envoi de la pièce jointe…' : recording ? 'Enregistrement en cours…' : `Écrire dans #${active.label}…`}
                  disabled={uploading || recording}
                  className="flex-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3.5 py-2.5 text-sm text-mv-ink focus:outline-none focus:border-mv-green disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={busy || !draft.trim()}
                  className="p-2.5 rounded-xl bg-mv-green hover:bg-mv-green-dark text-white transition-all disabled:opacity-50 cursor-pointer shrink-0"
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
