'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRealtimeChat } from '@/hooks/use-realtime-chat';
import { fetchTeamChatMessages, sendTeamChatMessage } from '@/lib/services/supabase-data';
import type { TeamChatMessage } from '@/lib/types';

// Same broadcast-plus-persist pattern as use-client-chat-thread.ts, for
// internal team channels scoped to a project or a client instead of the
// client<->Minerva Q&A thread.
export function useTeamChatThread(
  channelType: 'project' | 'client',
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
      .map((m) => ({
        id: m.id,
        channel_type: channelType,
        channel_id: channelId || '',
        sender_id: m.user.id || null,
        sender_name: m.user.name,
        sender_avatar: '',
        body: m.content,
        created_at: m.createdAt,
      }));
    return [...dbMessages, ...fromLive].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [dbMessages, liveMessages, currentUserId, channelType, channelId]);

  const send = async (body: string) => {
    if (!body.trim() || !channelId || !currentUserId) return false;
    const created = await sendTeamChatMessage(channelType, channelId, currentUserId, body.trim());
    if (!created) return false;
    setDbMessages((prev) => [...prev, { ...created, sender_name: currentUserName }]);
    if (isConnected) broadcast(body.trim());
    return true;
  };

  return { messages, loading, send };
}
