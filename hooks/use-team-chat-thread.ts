'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRealtimeChat } from '@/hooks/use-realtime-chat';
import { fetchTeamChatMessages, sendTeamChatMessage } from '@/lib/services/supabase-data';
import type { TeamChatAttachment, TeamChatMessage } from '@/lib/types';

// The shared broadcast hook's payload is a plain string (`content`) --
// it's also used by the client<->Minerva Q&A thread, which has no concept
// of attachments, so it isn't worth widening there. Attachment messages
// instead broadcast a small JSON envelope in that same string field; a
// plain-text message is still just plain text (no envelope), so old
// tabs/peers reading a non-JSON string keep working unchanged.
const ATTACHMENT_MARKER = '__mv_attachment__';
interface AttachmentEnvelope {
  marker: typeof ATTACHMENT_MARKER;
  body: string | null;
  attachment: TeamChatAttachment;
}
function encodeBroadcastContent(body: string, attachment?: TeamChatAttachment | null): string {
  if (!attachment) return body;
  const envelope: AttachmentEnvelope = { marker: ATTACHMENT_MARKER, body: body || null, attachment };
  return JSON.stringify(envelope);
}
function decodeBroadcastContent(content: string): { body: string | null; attachment: TeamChatAttachment | null } {
  if (content.startsWith('{')) {
    try {
      const parsed = JSON.parse(content);
      if (parsed?.marker === ATTACHMENT_MARKER) {
        return { body: parsed.body ?? null, attachment: parsed.attachment as TeamChatAttachment };
      }
    } catch {
      // Not an envelope -- fall through and treat as plain text.
    }
  }
  return { body: content, attachment: null };
}

// Same broadcast-plus-persist pattern as use-client-chat-thread.ts, for
// internal team channels scoped to a project, a client, or a 1-on-1 DM
// between two members instead of the client<->Minerva Q&A thread.
export function useTeamChatThread(
  channelType: 'project' | 'client' | 'member',
  channelId: string | undefined,
  currentUserId: string,
  currentUserName: string
) {
  const [dbMessages, setDbMessages] = useState<TeamChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const roomName = channelId ? `team-chat-${channelType}-${channelId}` : 'team-chat-pending';
  const { messages: liveMessages, sendMessage: broadcast, isConnected } = useRealtimeChat({
    roomName,
    username: currentUserName,
    userId: currentUserId,
  });

  useEffect(() => {
    if (!channelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      setDbMessages(await fetchTeamChatMessages(channelType, channelId));
      setLoading(false);
    })();
  }, [channelType, channelId]);

  const messages = useMemo(() => {
    const fromLive: TeamChatMessage[] = liveMessages
      .filter((m) => m.user.id !== currentUserId)
      .map((m) => {
        const { body, attachment } = decodeBroadcastContent(m.content);
        return {
          id: m.id,
          channel_type: channelType,
          channel_id: channelId || '',
          sender_id: m.user.id || null,
          sender_name: m.user.name,
          sender_avatar: '',
          body,
          attachment_url: attachment?.url || null,
          attachment_type: attachment?.type || null,
          attachment_name: attachment?.name || null,
          created_at: m.createdAt,
        };
      });
    return [...dbMessages, ...fromLive].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [dbMessages, liveMessages, currentUserId, channelType, channelId]);

  const send = async (body: string, attachment?: TeamChatAttachment | null) => {
    const trimmed = body.trim();
    if (!trimmed && !attachment) return false;
    if (!channelId) return false;
    const senderId = currentUserId || 'team-user';
    const created = await sendTeamChatMessage(channelType, channelId, senderId, trimmed, attachment);
    if (created) {
      setDbMessages((prev) => [...prev, { ...created, sender_name: currentUserName || 'Moi' }]);
    }
    if (isConnected) broadcast(encodeBroadcastContent(trimmed, attachment));
    return true;
  };

  return { messages, loading, send };
}
