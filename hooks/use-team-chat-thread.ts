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
  attachment: TeamChatAttachment | null;
  parentMessageId: string | null;
}
function encodeBroadcastContent(
  body: string,
  attachment?: TeamChatAttachment | null,
  parentMessageId?: string | null
): string {
  if (!attachment && !parentMessageId) return body;
  const envelope: AttachmentEnvelope = {
    marker: ATTACHMENT_MARKER,
    body: body || null,
    attachment: attachment || null,
    parentMessageId: parentMessageId || null,
  };
  return JSON.stringify(envelope);
}
function decodeBroadcastContent(content: string): {
  body: string | null;
  attachment: TeamChatAttachment | null;
  parentMessageId: string | null;
} {
  if (content.startsWith('{')) {
    try {
      const parsed = JSON.parse(content);
      if (parsed?.marker === ATTACHMENT_MARKER) {
        return {
          body: parsed.body ?? null,
          attachment: (parsed.attachment as TeamChatAttachment) || null,
          parentMessageId: parsed.parentMessageId || null,
        };
      }
    } catch {
      // Not an envelope -- fall through and treat as plain text.
    }
  }
  return { body: content, attachment: null, parentMessageId: null };
}

// Same broadcast-plus-persist pattern as use-client-chat-thread.ts, for
// internal team channels scoped to a project, a client, or a 1-on-1 DM
// between two members instead of the client<->Minerva Q&A thread.
export function useTeamChatThread(
  channelType: 'project' | 'client' | 'dm' | 'topic',
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

    // Postgres changes listener for rock-solid channel persistence
    const { createClient } = require('@/lib/supabase/client');
    const supabase = createClient();
    const pgChannel = supabase
      .channel(`pg-team-chat-${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_chat_messages', filter: `channel_id=eq.${channelId}` },
        (payload: any) => {
          const newRow = payload.new as TeamChatMessage;
          if (newRow) {
            setDbMessages((prev) => {
              if (prev.some((m) => m.id === newRow.id)) return prev;
              return [...prev, newRow];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pgChannel).catch(() => {});
    };
  }, [channelType, channelId]);

  const messages = useMemo(() => {
    const fromLive: TeamChatMessage[] = liveMessages
      .filter((m) => m.user.id !== currentUserId)
      .map((m) => {
        const { body, attachment, parentMessageId } = decodeBroadcastContent(m.content);
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
          parent_message_id: parentMessageId,
          created_at: m.createdAt,
        };
      });
    return [...dbMessages, ...fromLive].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [dbMessages, liveMessages, currentUserId, channelType, channelId]);

  const send = async (
    body: string,
    attachment?: TeamChatAttachment | null,
    parentMessageId?: string | null
  ): Promise<TeamChatMessage | null> => {
    const trimmed = body.trim();
    if (!trimmed && !attachment) return null;
    if (!channelId) return null;
    const senderId = currentUserId || 'team-user';
    const created = await sendTeamChatMessage(channelType, channelId, senderId, trimmed, attachment, parentMessageId);
    if (created) {
      setDbMessages((prev) => [...prev, { ...created, sender_name: currentUserName || 'Moi' }]);
    }
    if (isConnected) broadcast(encodeBroadcastContent(trimmed, attachment, parentMessageId));
    return created;
  };

  return { messages, loading, send };
}
