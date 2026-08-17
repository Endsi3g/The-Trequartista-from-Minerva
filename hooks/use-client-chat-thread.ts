'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRealtimeChat, type ChatMessage } from '@/hooks/use-realtime-chat';
import { fetchClientMessages, sendClientMessage } from '@/lib/services/supabase-data';
import type { ClientMessage } from '@/lib/types';

// Shared data layer for the client <-> Minerva Q&A thread, used by both
// /portal/questions (client side) and /clients/[id] (team side, which
// previously had no way to reply at all -- sendClientMessage(..., 'team',
// ...) was never called anywhere in the app). History loads once from
// client_messages (the real persisted record); new messages during the
// session go out over a Supabase Realtime broadcast room AND get
// persisted, so a message sent while the other side is offline still
// shows up next time they load the page.
export function useClientChatThread(
  clientId: string | undefined,
  currentUserId: string,
  currentUserName: string,
  senderRole: 'client' | 'team'
) {
  const [dbMessages, setDbMessages] = useState<ClientMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const { messages: liveMessages, sendMessage: broadcast, isConnected } = useRealtimeChat({
    roomName: clientId ? `client-chat-${clientId}` : 'client-chat-pending',
    username: currentUserName,
    userId: currentUserId,
  });

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    (async () => {
      setDbMessages(await fetchClientMessages(clientId));
      setLoading(false);
    })();
  }, [clientId]);

  const messages = useMemo(() => {
    const fromDb: ClientMessage[] = dbMessages;
    // This thread only ever has two sides. A live message from anyone
    // other than "me" is necessarily from the other side -- whichever
    // role I'm NOT (there's no third party in a client<->Minerva thread).
    const otherRole = senderRole === 'client' ? 'team' : 'client';
    const fromLive: ClientMessage[] = liveMessages
      // Our own message is added to dbMessages directly on send (see
      // `send` below) using the real persisted row -- the broadcast echo
      // of the same message would otherwise show up twice.
      .filter((m) => m.user.id !== currentUserId)
      .map((m) => ({
        id: m.id,
        client_id: clientId,
        sender_id: m.user.id || '',
        sender_role: otherRole,
        sender_name: m.user.name,
        sender_avatar: '',
        body: m.content,
        created_at: m.createdAt,
      } as ClientMessage));

    return [...fromDb, ...fromLive].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [dbMessages, liveMessages, currentUserId, clientId, senderRole]);

  const send = async (body: string) => {
    if (!body.trim() || !clientId || !currentUserId) return false;
    const created = await sendClientMessage(clientId, currentUserId, senderRole, body.trim());
    if (!created) return false;
    setDbMessages((prev) => [...prev, created]);
    if (isConnected) broadcast(body.trim());
    return true;
  };

  return { messages, loading, send };
}
