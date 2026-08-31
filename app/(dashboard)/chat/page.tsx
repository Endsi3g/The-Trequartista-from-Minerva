'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Users,
  Send,
  Paperclip,
  Mic,
  Square,
  Search,
  ExternalLink,
  MessageSquare,
  FileText,
  Download,
  X,
  Hash,
  CornerDownRight,
  ChevronDown,
  ChevronUp,
  SmilePlus,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useTeamChatThread } from '@/hooks/use-team-chat-thread';
import { AudioVoicePlayer } from '@/components/chat/AudioVoicePlayer';
import {
  fetchProjects,
  fetchClients,
  fetchTeamMembers,
  getOrCreateDmChannel,
  uploadTeamChatAttachment,
  fetchReactionsForMessages,
  toggleReaction,
  createMentions,
} from '@/lib/services/supabase-data';
import type { Project, Client, TeamMemberSummary, TeamChatReaction } from '@/lib/types';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';
import { PageFadeIn } from '@/components/ui/page-transition';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '👀'];

// Fixed, well-known topic channels -- like project/client channels, a
// topic channel is just a stable slug used as channel_id, no metadata
// table needed (see the migration notes for why).
const TOPIC_CHANNELS: { slug: string; label: string; sublabel: string }[] = [
  { slug: '00000000-0000-0000-0000-000000000001', label: 'général', sublabel: 'Discussion libre' },
  { slug: '00000000-0000-0000-0000-000000000002', label: 'annonces', sublabel: "Annonces d'équipe" },
];

type Channel = {
  type: 'project' | 'client' | 'dm' | 'topic';
  id: string;
  label: string;
  sublabel: string;
  memberId?: string;
  projectId?: string;
  clientId?: string;
};

export default function ChatPage() {
  const { id: userId, fullName, avatarUrl } = useCurrentUser();
  const { toastError } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [members, setMembers] = useState<TeamMemberSummary[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [active, setActive] = useState<Channel | null>(null);
  const [resolvingMemberId, setResolvingMemberId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [reactions, setReactions] = useState<TeamChatReaction[]>([]);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keyboard shortcut: Cmd/Ctrl + F to focus channel search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingChannels(true);
      try {
        const [p, c, m] = await Promise.all([fetchProjects(), fetchClients(), fetchTeamMembers(userId)]);
        setProjects(p);
        setClients(c);
        setMembers(m);

        // Auto-select first active channel on load to prevent empty screen
        if (p.length > 0) {
          setActive({
            type: 'project',
            id: p[0].id,
            label: p[0].name,
            sublabel: p[0].client_name || '',
            projectId: p[0].id,
          });
        } else if (c.length > 0) {
          setActive({
            type: 'client',
            id: c[0].id,
            label: c[0].name,
            sublabel: c[0].industry || '',
            clientId: c[0].id,
          });
        }
      } finally {
        setLoadingChannels(false);
      }
    })();
  }, [userId]);

  const { messages, loading: loadingMessages, send } = useTeamChatThread(
    active?.type || 'client',
    active?.id,
    userId,
    fullName || 'Membre'
  );

  const topLevelMessages = useMemo(() => messages.filter((m) => !m.parent_message_id), [messages]);
  const repliesByParent = useMemo(() => {
    const map: Record<string, typeof messages> = {};
    messages.forEach((m) => {
      if (m.parent_message_id) {
        (map[m.parent_message_id] = map[m.parent_message_id] || []).push(m);
      }
    });
    return map;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setReactions([]);
      return;
    }
    fetchReactionsForMessages(messages.map((m) => m.id)).then(setReactions);
  }, [messages]);

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!userId) return;
    setReactionPickerFor(null);
    // Optimistic toggle so the UI reacts instantly instead of waiting on the round-trip
    setReactions((prev) => {
      const existing = prev.find((r) => r.message_id === messageId && r.user_id === userId && r.emoji === emoji);
      if (existing) return prev.filter((r) => r.id !== existing.id);
      return [...prev, { id: `optimistic-${Date.now()}`, message_id: messageId, user_id: userId, emoji, created_at: new Date().toISOString() }];
    });
    await toggleReaction(messageId, userId, emoji);
    fetchReactionsForMessages(messages.map((m) => m.id)).then(setReactions);
  };

  // Resolves @FullName or @all mentions in a message body against the current
  // channel's known team members -- notifies via the existing push route and native notifications.
  const notifyMentions = async (messageId: string, body: string) => {
    const isAll = /@(all|equipe|everyone|tous)/i.test(body);
    const targetUserIds = isAll
      ? members.map((m) => m.id)
      : members.filter((m) => body.toLowerCase().includes(`@${m.full_name.toLowerCase()}`)).map((m) => m.id);

    if (targetUserIds.length === 0) return;
    await createMentions(messageId, targetUserIds);
    fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: isAll
          ? `📢 ${fullName || 'Un collègue'} a mentionné toute l'équipe`
          : `💬 ${fullName || 'Un collègue'} vous a mentionné`,
        body: body.slice(0, 120),
        url: '/chat',
        userIds: targetUserIds,
      }),
    }).catch(() => {});
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    const sent = await send(draft, undefined, replyingTo || undefined);
    setSending(false);
    if (sent) {
      const sentText = draft;
      setDraft('');
      setReplyingTo(null);
      setMentionQuery(null);
      if (sent.id) notifyMentions(sent.id, sentText);
    }
  };

interface MentionItem {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string | null;
  isAll?: boolean;
}

  const mentionSuggestions = useMemo<MentionItem[]>(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    const specials: MentionItem[] = [];
    if ('all'.includes(q) || 'tout'.includes(q) || 'equipe'.includes(q) || 'everyone'.includes(q) || q === '') {
      specials.push({ id: '__all__', full_name: 'all', isAll: true });
      specials.push({ id: '__equipe__', full_name: 'equipe', isAll: true });
    }
    const memberMatches: MentionItem[] = members
      .filter((m) => m.full_name.toLowerCase().includes(q))
      .slice(0, 6)
      .map((m) => ({ id: m.id, full_name: m.full_name, email: m.email, avatar_url: m.avatar_url }));
    return [...specials, ...memberMatches];
  }, [mentionQuery, members]);

  const handleDraftChange = (value: string) => {
    setDraft(value);
    const match = value.match(/@([\wÀ-ÿ]*)$/);
    setMentionQuery(match ? match[1] : null);
  };

  const insertMention = (nameOrMember: string | MentionItem) => {
    const name = typeof nameOrMember === 'string' ? nameOrMember : nameOrMember.full_name;
    setDraft((prev) => prev.replace(/@([\wÀ-ÿ]*)$/, `@${name} `));
    setMentionQuery(null);
  };

  const handleSelectMember = async (member: TeamMemberSummary) => {
    setResolvingMemberId(member.id);
    const dmChannelId = await getOrCreateDmChannel(userId, member.id);
    setResolvingMemberId(null);
    if (!dmChannelId) {
      toastError('Erreur', "Impossible d'ouvrir cette conversation.");
      return;
    }
    setActive({
      type: 'dm',
      id: dmChannelId,
      label: member.full_name,
      sublabel: member.email,
      memberId: member.id,
    });
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
      setRecordingDuration(0);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
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

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      toastError('Micro indisponible', "L'accès au micro a été refusé ou n'est pas disponible sur cet appareil.");
    }
  };

  const stopRecording = (discard = false) => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (discard) {
      audioChunksRef.current = [];
      mediaRecorderRef.current?.stop();
    } else {
      mediaRecorderRef.current?.stop();
    }
    setRecording(false);
    setRecordingDuration(0);
  };

  // Filter channels based on filterQuery
  const q = filterQuery.toLowerCase().trim();
  const filteredProjects = useMemo(
    () => projects.filter((p) => p.name.toLowerCase().includes(q) || (p.client_name || '').toLowerCase().includes(q)),
    [projects, q]
  );
  const filteredClients = useMemo(
    () => clients.filter((c) => c.name.toLowerCase().includes(q) || (c.industry || '').toLowerCase().includes(q)),
    [clients, q]
  );
  const filteredMembers = useMemo(
    () => members.filter((m) => m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)),
    [members, q]
  );

  return (
    <PageFadeIn className="h-[calc(100vh-140px)] flex flex-col">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />

      {/* ── Monolithic Split-Pane Container ── */}
      <div className="flex-1 bg-white border border-mv-border rounded-[6px] overflow-hidden flex shadow-2xs min-h-0">
        {/* ── Left Column: Channels & Threads Navigation (280px) ── */}
        <div className="w-[280px] shrink-0 border-r border-mv-border bg-white flex flex-col min-h-0">
          {/* Quick Search Header */}
          <div className="p-2.5 border-b border-mv-border">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filtrer les discussions... (⌘F)"
                className="w-full h-7 pl-7 pr-2 text-[11.5px] rounded-[4px] border border-mv-border bg-zinc-50/50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-mv-green focus:bg-white transition-colors"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute right-1.5 top-1.5 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Channels Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-mv-border/40 py-1">
            {loadingChannels ? (
              <p className="text-[11px] text-zinc-400 text-center py-8 font-mono">Chargement…</p>
            ) : (
              <>
                {/* ── Topic Channels ── */}
                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Canaux
                  </div>
                  {TOPIC_CHANNELS.filter((t) => t.label.includes(q) || t.sublabel.toLowerCase().includes(q)).map((t) => {
                    const isSelected = active?.type === 'topic' && active.id === t.slug;
                    return (
                      <button
                        key={t.slug}
                        onClick={() => setActive({ type: 'topic', id: t.slug, label: t.label, sublabel: t.sublabel })}
                        className={cn(
                          'w-full text-left px-3 h-8 flex items-center justify-between text-[12px] transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-zinc-100/90 text-zinc-900 font-semibold border-l-2 border-mv-green pl-2.5'
                            : 'text-zinc-600 hover:bg-black/[0.025] hover:text-zinc-900'
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Hash className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-mv-green' : 'text-zinc-400')} />
                          <span className="truncate">{t.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* ── Projects Channels ── */}
                {filteredProjects.length > 0 && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Projets ({filteredProjects.length})
                    </div>
                    {filteredProjects.map((p) => {
                      const isSelected = active?.type === 'project' && active.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() =>
                            setActive({
                              type: 'project',
                              id: p.id,
                              label: p.name,
                              sublabel: p.client_name || 'Projet',
                              projectId: p.id,
                            })
                          }
                          className={cn(
                            'w-full text-left px-3 h-8 flex items-center justify-between text-[12px] transition-colors cursor-pointer',
                            isSelected
                              ? 'bg-zinc-100/90 text-zinc-900 font-semibold border-l-2 border-mv-green pl-2.5'
                              : 'text-zinc-600 hover:bg-black/[0.025] hover:text-zinc-900'
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FolderKanban className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-mv-green' : 'text-zinc-400')} />
                            <span className="truncate">{p.name}</span>
                          </div>
                          {p.client_name && (
                            <span className="text-[10px] font-mono text-zinc-400 shrink-0 ml-1.5 truncate max-w-[80px]">
                              {p.client_name}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── Clients Channels ── */}
                {filteredClients.length > 0 && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Clients ({filteredClients.length})
                    </div>
                    {filteredClients.map((c) => {
                      const isSelected = active?.type === 'client' && active.id === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() =>
                            setActive({
                              type: 'client',
                              id: c.id,
                              label: c.name,
                              sublabel: c.industry || 'Client',
                              clientId: c.id,
                            })
                          }
                          className={cn(
                            'w-full text-left px-3 h-8 flex items-center justify-between text-[12px] transition-colors cursor-pointer',
                            isSelected
                              ? 'bg-zinc-100/90 text-zinc-900 font-semibold border-l-2 border-mv-green pl-2.5'
                              : 'text-zinc-600 hover:bg-black/[0.025] hover:text-zinc-900'
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Users className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-mv-green' : 'text-zinc-400')} />
                            <span className="truncate">{c.name}</span>
                          </div>
                          {c.industry && (
                            <span className="text-[10px] font-mono text-zinc-400 shrink-0 ml-1.5 truncate max-w-[80px]">
                              {c.industry}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ── Team Direct Messages ── */}
                {filteredMembers.length > 0 && (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Messages Directs ({filteredMembers.length})
                    </div>
                    {filteredMembers.map((m) => {
                      const isSelected = active?.type === 'dm' && active.memberId === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => handleSelectMember(m)}
                          disabled={resolvingMemberId === m.id}
                          className={cn(
                            'w-full text-left px-3 h-8 flex items-center justify-between text-[12px] transition-colors cursor-pointer disabled:opacity-60',
                            isSelected
                              ? 'bg-zinc-100/90 text-zinc-900 font-semibold border-l-2 border-mv-green pl-2.5'
                              : 'text-zinc-600 hover:bg-black/[0.025] hover:text-zinc-900'
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <UserAvatar name={m.full_name} src={m.avatar_url || ''} size="xs" className="shrink-0 w-4 h-4 text-[9px]" />
                            <span className="truncate">{resolvingMemberId === m.id ? 'Ouverture…' : m.full_name}</span>
                          </div>
                          <span className="w-1.5 h-1.5 rounded-full bg-mv-green shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {filteredProjects.length === 0 && filteredClients.length === 0 && filteredMembers.length === 0 && (
                  <p className="text-[11px] text-zinc-400 text-center py-8 px-3">Aucune discussion trouvée.</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Right Column: Active Discussion Thread ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6">
              <MessageSquare className="w-7 h-7 text-zinc-300" />
              <p className="text-xs font-semibold text-zinc-700">Sélectionnez une discussion</p>
              <p className="text-[11px] text-zinc-400">Choisissez un projet, un client ou un collègue dans la colonne de gauche.</p>
            </div>
          ) : (
            <>
              {/* ── Channel Header (44px) ── */}
              <div className="h-11 px-4 border-b border-mv-border flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-[13.5px] text-mv-ink truncate">
                    {active.type === 'topic' ? `#${active.label}` : active.label}
                  </span>
                  {active.sublabel && (
                    <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline" style={MONO}>
                      · {active.sublabel}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {active.projectId && (
                    <Link
                      href={`/projects/${active.projectId}/roadmap`}
                      className="text-[11px] font-medium text-mv-green hover:underline flex items-center gap-1"
                    >
                      <span>Fiche Projet</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                  {active.clientId && (
                    <Link
                      href={`/clients/${active.clientId}/roi-tracker`}
                      className="text-[11px] font-medium text-mv-green hover:underline flex items-center gap-1"
                    >
                      <span>Suivi ROI</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>

              {/* ── Messages Flow (Dense & Linear Styled) ── */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {loadingMessages ? (
                  <p className="text-xs text-zinc-400 text-center py-8 font-mono">Chargement des messages…</p>
                ) : topLevelMessages.length === 0 ? (
                  <div className="text-center py-12 space-y-1">
                    <p className="text-xs font-semibold text-zinc-700">Aucun message pour le moment</p>
                    <p className="text-[11px] text-zinc-400">Envoyez le premier message ou partagez un fichier dans ce canal.</p>
                  </div>
                ) : (
                  topLevelMessages.map((m, i) => {
                    const isOwn = m.sender_id === userId;
                    const showHeader = i === 0 || topLevelMessages[i - 1].sender_id !== m.sender_id;
                    const timeStr = new Date(m.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
                    const messageReactions = reactions.filter((r) => r.message_id === m.id);
                    const reactionGroups = QUICK_EMOJIS.map((emoji) => ({
                      emoji,
                      users: messageReactions.filter((r) => r.emoji === emoji),
                    })).filter((g) => g.users.length > 0);
                    const replies = repliesByParent[m.id] || [];
                    const threadOpen = !!expandedThreads[m.id];

                    return (
                      <div key={m.id} className={cn('flex items-start gap-2 group', isOwn ? 'justify-end' : 'justify-start')}>
                        {!isOwn && (
                          <div className="w-6 shrink-0 pt-0.5">
                            {showHeader ? (
                              <UserAvatar name={m.sender_name} src={m.sender_avatar} size="xs" className="w-6 h-6 text-[10px]" />
                            ) : (
                              <div className="w-6" />
                            )}
                          </div>
                        )}

                        <div className={cn('max-w-[75%] min-w-0 flex flex-col', isOwn ? 'items-end' : 'items-start')}>
                          {showHeader && (
                            <div className="flex items-center gap-2 mb-0.5 px-1">
                              <span className="text-[10.5px] font-semibold text-zinc-700">
                                {isOwn ? 'Vous' : m.sender_name}
                              </span>
                              <span className="text-[9.5px] text-zinc-400 font-mono" style={MONO}>
                                {timeStr}
                              </span>
                            </div>
                          )}

                          <div className="relative">
                            <div
                              className={cn(
                                'rounded-[6px] px-3 py-1.5 text-[12.5px] leading-relaxed break-words',
                                isOwn
                                  ? 'bg-mv-green text-white shadow-2xs'
                                  : 'bg-zinc-100 text-zinc-900 border border-zinc-200/60'
                              )}
                            >
                              {/* Image / GIF Attachment */}
                              {(m.attachment_type === 'image' || m.attachment_type === 'gif') && m.attachment_url && (
                                <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-1.5">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={m.attachment_url}
                                    alt={m.attachment_name || 'Image'}
                                    className="rounded-[4px] max-w-[240px] max-h-[240px] object-cover border border-black/10"
                                  />
                                </a>
                              )}

                              {/* Audio Voice Note Attachment */}
                              {m.attachment_type === 'audio' && m.attachment_url && (
                                <div className="mb-1.5">
                                  <AudioVoicePlayer src={m.attachment_url} className={isOwn ? 'bg-white/20 border-white/30 text-white' : ''} />
                                </div>
                              )}

                              {/* Document Attachment */}
                              {m.attachment_type === 'file' && m.attachment_url && (
                                <a
                                  href={m.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 mb-1.5 bg-black/10 px-2 py-1 rounded-[4px] text-[11px] font-medium hover:underline"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[160px]">{m.attachment_name || 'Document'}</span>
                                  <Download className="w-3 h-3 ml-1 opacity-70" />
                                </a>
                              )}

                              {m.body && (
                                <p className="whitespace-pre-wrap">
                                  {m.body.split(/(@[\wÀ-ÿ]+)/g).map((part, pIdx) => {
                                    if (/^@(all|equipe|everyone|tous)$/i.test(part)) {
                                      return (
                                        <span
                                          key={pIdx}
                                          className={cn(
                                            'inline-flex items-center px-1.5 py-0.2 rounded font-mono font-bold text-[11px] mx-0.5 shadow-2xs',
                                            isOwn
                                              ? 'bg-white text-emerald-800'
                                              : 'bg-emerald-600 text-white'
                                          )}
                                        >
                                          📢 {part}
                                        </span>
                                      );
                                    }
                                    if (/^@[\wÀ-ÿ]+/i.test(part)) {
                                      return (
                                        <span
                                          key={pIdx}
                                          className={cn(
                                            'inline-flex items-center px-1 py-0.2 rounded font-semibold text-[11.5px] mx-0.5',
                                            isOwn
                                              ? 'bg-white/30 text-white'
                                              : 'bg-zinc-200/80 text-zinc-900'
                                          )}
                                        >
                                          {part}
                                        </span>
                                      );
                                    }
                                    return <span key={pIdx}>{part}</span>;
                                  })}
                                </p>
                              )}
                            </div>

                            {/* Hover actions: react / reply */}
                            <div
                              className={cn(
                                'absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white border border-zinc-200 rounded-[4px] shadow-2xs',
                                isOwn ? 'right-full mr-1' : 'left-full ml-1'
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => setReactionPickerFor(reactionPickerFor === m.id ? null : m.id)}
                                className="p-1 text-zinc-400 hover:text-mv-green cursor-pointer"
                                title="Réagir"
                              >
                                <SmilePlus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setReplyingTo(m.id)}
                                className="p-1 text-zinc-400 hover:text-mv-green cursor-pointer"
                                title="Répondre en fil"
                              >
                                <CornerDownRight className="w-3 h-3" />
                              </button>
                            </div>

                            {reactionPickerFor === m.id && (
                              <div
                                className={cn(
                                  'absolute top-6 z-10 flex items-center gap-1 bg-white border border-zinc-200 rounded-[6px] shadow-mv-md p-1',
                                  isOwn ? 'right-0' : 'left-0'
                                )}
                              >
                                {QUICK_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleToggleReaction(m.id, emoji)}
                                    className="text-sm p-1 hover:bg-zinc-100 rounded cursor-pointer"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Reaction pills */}
                          {reactionGroups.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {reactionGroups.map((g) => {
                                const mine = g.users.some((u) => u.user_id === userId);
                                return (
                                  <button
                                    key={g.emoji}
                                    onClick={() => handleToggleReaction(m.id, g.emoji)}
                                    className={cn(
                                      'text-[10.5px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 cursor-pointer transition-colors',
                                      mine
                                        ? 'bg-mv-green-tint border-mv-green/40 text-mv-green'
                                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                                    )}
                                  >
                                    <span>{g.emoji}</span>
                                    <span className="font-semibold">{g.users.length}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Thread replies */}
                          {replies.length > 0 && (
                            <div className="mt-1">
                              <button
                                onClick={() => setExpandedThreads((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                                className="text-[10.5px] font-semibold text-mv-green hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                {threadOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                <span>{replies.length} réponse{replies.length > 1 ? 's' : ''}</span>
                              </button>
                              {threadOpen && (
                                <div className="mt-1.5 pl-3 border-l-2 border-zinc-200 space-y-1.5">
                                  {replies.map((r) => (
                                    <div key={r.id} className="flex items-start gap-1.5">
                                      <UserAvatar name={r.sender_name} src={r.sender_avatar} size="xs" className="w-4 h-4 text-[8px] mt-0.5" />
                                      <div className="min-w-0">
                                        <span className="text-[10px] font-semibold text-zinc-700 mr-1.5">
                                          {r.sender_id === userId ? 'Vous' : r.sender_name}
                                        </span>
                                        <span className="text-[11.5px] text-zinc-700 break-words">{r.body}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* ── Fixed Command-Driven Input Bar ── */}
              <div className="p-3 border-t border-mv-border bg-white">
                {recording ? (
                  <div className="h-10 px-3 bg-red-50/60 border border-red-200 rounded-[6px] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                      <span className="text-xs font-semibold text-rose-800">Enregistrement audio en cours…</span>
                      <span className="text-xs font-mono text-rose-600 font-bold ml-2" style={MONO}>
                        0:{recordingDuration.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => stopRecording(true)}
                        className="px-2 py-1 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => stopRecording(false)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-[4px] cursor-pointer flex items-center gap-1"
                      >
                        <Square className="w-3 h-3 fill-white" />
                        <span>Envoyer</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSend} className="space-y-2">
                    {replyingTo && (
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-[4px] text-[11px]">
                        <span className="flex items-center gap-1.5 text-zinc-600 truncate">
                          <CornerDownRight className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            Réponse à : {messages.find((m) => m.id === replyingTo)?.body?.slice(0, 60) || 'message'}
                          </span>
                        </span>
                        <button type="button" onClick={() => setReplyingTo(null)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer shrink-0 ml-2">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="relative border border-mv-border focus-within:border-mv-green focus-within:ring-1 focus-within:ring-mv-green/20 rounded-[6px] bg-zinc-50/50 transition-all">
                      {mentionSuggestions.length > 0 && (
                        <div className="absolute bottom-full left-2 mb-1 w-64 bg-white border border-zinc-200 rounded-[6px] shadow-mv-md py-1 z-10">
                          {mentionSuggestions.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => insertMention(m)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-zinc-50 cursor-pointer"
                            >
                              {m.isAll ? (
                                <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] shrink-0 font-bold font-mono">
                                  📢
                                </div>
                              ) : (
                                <UserAvatar name={m.full_name} src={m.avatar_url || ''} size="xs" className="w-5 h-5 text-[8px]" />
                              )}
                              <div className="min-w-0">
                                <span className="text-[12px] font-medium text-zinc-900">
                                  @{m.full_name}
                                </span>
                                {m.isAll && (
                                  <span className="text-[10px] text-zinc-400 font-mono block">
                                    Notifier toute l'équipe
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <textarea
                        value={draft}
                        onChange={(e) => handleDraftChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder={`Écrire dans #${active.label}... (@ pour mentionner, Entrée pour envoyer)`}
                        rows={2}
                        className="w-full text-[12.5px] p-2.5 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none"
                      />

                      <div className="flex items-center justify-between px-2.5 pb-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="h-6 w-6 rounded border border-mv-border flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Joindre un fichier ou image"
                          >
                            <Paperclip className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={startRecording}
                            disabled={uploading}
                            className="h-6 w-6 rounded border border-mv-border flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Enregistrer une note vocale"
                          >
                            <Mic className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={!draft.trim() || sending}
                          className="h-6 px-2.5 rounded-[4px] bg-mv-green text-white text-[11px] font-medium hover:bg-emerald-700 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>{sending ? '…' : 'Envoyer'}</span>
                          <Send className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </PageFadeIn>
  );
}
