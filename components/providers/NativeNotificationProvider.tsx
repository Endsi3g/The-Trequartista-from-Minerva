'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/components/providers/ToastProvider';
import {
  sendNativeNotification,
  requestNotificationPermission,
  getNotificationPermission,
} from '@/lib/services/native-notifications';
import { useRealtimePresenceRoom, RealtimeUser } from '@/hooks/use-realtime-presence-room';
import { usePathname } from 'next/navigation';
import { getPageLabel } from '@/lib/presence';

interface NativeNotificationContextType {
  permission: NotificationPermission | 'unsupported';
  requestPermission: () => Promise<NotificationPermission | 'unsupported'>;
  notify: (title: string, body: string, url?: string) => void;
}

const NativeNotificationContext = createContext<NativeNotificationContextType>({
  permission: 'default',
  requestPermission: async () => 'default',
  notify: () => {},
});

export function NativeNotificationProvider({ children }: { children: React.ReactNode }) {
  const { id: currentUserId, fullName: currentUserName } = useCurrentUser();
  const { toastInfo, toastSuccess } = useToast();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const pathname = usePathname();

  // Track previous presence users to detect when someone becomes 'available'
  const prevUsersRef = useRef<Record<string, RealtimeUser>>({});

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      sendNativeNotification({
        title: 'Minerva Flow',
        body: 'Notifications natives activées avec succès !',
        icon: '/icon-192.png',
      });
    }
    return res;
  };

  const notifyUser = (title: string, body: string, url?: string) => {
    // 1. Send native browser notification
    const notif = sendNativeNotification({
      title,
      body,
      url,
      icon: '/icon-192.png',
    });

    // 2. In-app toast fallback / confirmation if tab is in foreground or notif unsupported
    if (!notif || (typeof document !== 'undefined' && !document.hidden)) {
      toastInfo(title, body);
    }
  };

  // Presence room tracking to detect teammates becoming 'available'
  const { otherUsers } = useRealtimePresenceRoom(
    'minerva-team-presence',
    { path: pathname, pageLabel: getPageLabel(pathname) },
    Boolean(currentUserId)
  );

  useEffect(() => {
    if (!currentUserId) return;

    const prevUsers = prevUsersRef.current;
    for (const [userId, user] of Object.entries(otherUsers)) {
      if (userId === currentUserId) continue;

      const prevUser = prevUsers[userId];
      const currentStatus = user.status;
      const prevStatus = prevUser?.status;

      // Detect status change to 'available'
      if (currentStatus === 'available' && prevStatus && prevStatus !== 'available') {
        const memberName = user.name || 'Un membre de l’équipe';
        notifyUser(
          `🟢 ${memberName} est disponible`,
          `Prêt pour échanger ou collaborer sur vos projets.`,
          '/chat'
        );
      }
    }

    prevUsersRef.current = otherUsers;
  }, [otherUsers, currentUserId]);

  // Supabase Realtime subscriptions for Chat messages, Tasks completed, and New profiles
  useEffect(() => {
    if (!currentUserId) return;

    const supabase = createClient();

    const channel = supabase
      .channel('minerva-native-notifications-global')
      // 1. New team chat message
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'team_chat_messages' },
        (payload) => {
          const newMsg = payload.new as {
            sender_id?: string;
            sender_name?: string;
            body?: string;
            channel_type?: string;
          };

          // Ignore own messages
          if (newMsg.sender_id === currentUserId) return;

          const sender = newMsg.sender_name || 'Un collègue';
          const body = newMsg.body || '';
          const isAllMention = /@(all|equipe|everyone|tous)/i.test(body);
          const isDirectMention = currentUserName && body.toLowerCase().includes(`@${currentUserName.toLowerCase()}`);

          const title = isAllMention
            ? `📢 Mention d'Équipe (@all) par ${sender}`
            : isDirectMention
            ? `🔔 ${sender} vous a mentionné`
            : `💬 Message de ${sender}`;

          const snippet = body
            ? body.slice(0, 80) + (body.length > 80 ? '...' : '')
            : 'Nouveau message reçu';

          notifyUser(
            title,
            snippet,
            '/chat'
          );
        }
      )
      // 2. New client portal message
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'client_messages' },
        (payload) => {
          const msg = payload.new as {
            sender_id?: string;
            sender_name?: string;
            content?: string;
          };

          if (msg.sender_id === currentUserId) return;

          const sender = msg.sender_name || 'Client';
          const snippet = msg.content
            ? msg.content.slice(0, 80) + (msg.content.length > 80 ? '...' : '')
            : 'Nouveau message client';

          notifyUser(
            `📩 Message Client (${sender})`,
            snippet,
            '/messages'
          );
        }
      )
      // 3. Task completed
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        (payload) => {
          const updated = payload.new as {
            id: string;
            title: string;
            status: string;
            assignee_id?: string;
            assignee_name?: string;
          };
          const old = payload.old as { status?: string };

          // Only trigger when task transitions to 'done'
          if (updated.status === 'done' && old.status !== 'done') {
            // Ignore if current user is the one assigned and completed it
            const author = updated.assignee_name || 'Un membre de l’équipe';
            notifyUser(
              `✅ Tâche complétée`,
              `« ${updated.title} » a été marquée comme terminée par ${author}.`,
              `/tasks/${updated.id}`
            );
          }
        }
      )
      // 4. New member joined the app (profiles INSERT)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload) => {
          const newProfile = payload.new as {
            id: string;
            full_name?: string;
            role?: string;
          };

          if (newProfile.id === currentUserId) return;

          const memberName = newProfile.full_name || 'Un nouvel utilisateur';
          notifyUser(
            `👋 Nouveau membre dans l'équipe`,
            `${memberName} a rejoint l'espace Minerva Flow !`,
            '/team'
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [currentUserId]);

  return (
    <NativeNotificationContext.Provider
      value={{
        permission,
        requestPermission: handleRequestPermission,
        notify: notifyUser,
      }}
    >
      {children}
    </NativeNotificationContext.Provider>
  );
}

export function useNativeNotifications() {
  return useContext(NativeNotificationContext);
}
