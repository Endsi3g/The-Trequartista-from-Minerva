'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getPageLabel } from '@/lib/presence';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface TeamPresenceMember {
  userId: string;
  fullName: string;
  avatarUrl: string;
  role: string;
  path?: string;
  pageLabel?: string;
  onlineAt: string;
}

interface PresenceContextValue {
  members: TeamPresenceMember[]; // full detail, path included — internal use only
  publicMembers: TeamPresenceMember[]; // no path — safe for the client portal
}

const PresenceContext = createContext<PresenceContextValue>({ members: [], publicMembers: [] });

// Two channels, deliberately separate: `minerva-team-presence` carries the
// exact page each teammate is on (internal dashboard only -- the avatar
// stack + panel in TopbarActions). `minerva-team-presence-public` carries
// only name/avatar/online-status with no path, and is the one the client
// portal subscribes to, so a client can never see which internal page (or
// which OTHER client's record) a teammate is currently viewing.
export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [members, setMembers] = useState<TeamPresenceMember[]>([]);
  const [publicMembers, setPublicMembers] = useState<TeamPresenceMember[]>([]);
  const identityRef = useRef<{ userId: string; fullName: string; avatarUrl: string; role: string } | null>(null);
  const channelsRef = useRef<{ full?: RealtimeChannel; pub?: RealtimeChannel }>({});

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;

      const identity = {
        userId: user.id,
        fullName: profile?.full_name || user.email || 'Membre',
        avatarUrl: profile?.avatar_url || '',
        role: profile?.role || 'member',
      };
      identityRef.current = identity;
      const isTeam = identity.role === 'admin' || identity.role === 'member';

      const fullChannel = supabase.channel('minerva-team-presence', {
        config: { presence: { key: identity.userId } },
      });
      fullChannel
        .on('presence', { event: 'sync' }, () => {
          const state = fullChannel.presenceState<TeamPresenceMember>();
          const list = Object.values(state).map((entries) => entries[0]).filter(Boolean);
          setMembers(list);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && isTeam) {
            await fullChannel.track({
              userId: identity.userId,
              fullName: identity.fullName,
              avatarUrl: identity.avatarUrl,
              role: identity.role,
              path: pathname,
              pageLabel: getPageLabel(pathname),
              onlineAt: new Date().toISOString(),
            });
          }
        });
      channelsRef.current.full = fullChannel;

      const publicChannel = supabase.channel('minerva-team-presence-public', {
        config: { presence: { key: identity.userId } },
      });
      publicChannel
        .on('presence', { event: 'sync' }, () => {
          const state = publicChannel.presenceState<TeamPresenceMember>();
          const list = Object.values(state).map((entries) => entries[0]).filter(Boolean);
          setPublicMembers(list);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED' && isTeam) {
            await publicChannel.track({
              userId: identity.userId,
              fullName: identity.fullName,
              avatarUrl: identity.avatarUrl,
              role: identity.role,
              onlineAt: new Date().toISOString(),
            });
          }
        });
      channelsRef.current.pub = publicChannel;
    })();

    return () => {
      cancelled = true;
      if (channelsRef.current.full) supabase.removeChannel(channelsRef.current.full);
      if (channelsRef.current.pub) supabase.removeChannel(channelsRef.current.pub);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-broadcast the current page on every navigation without rejoining the channel.
  useEffect(() => {
    const identity = identityRef.current;
    const channel = channelsRef.current.full;
    if (!identity || !channel || (identity.role !== 'admin' && identity.role !== 'member')) return;
    channel.track({
      userId: identity.userId,
      fullName: identity.fullName,
      avatarUrl: identity.avatarUrl,
      role: identity.role,
      path: pathname,
      pageLabel: getPageLabel(pathname),
      onlineAt: new Date().toISOString(),
    });
  }, [pathname]);

  return (
    <PresenceContext.Provider value={{ members, publicMembers }}>
      {children}
    </PresenceContext.Provider>
  );
}

// Internal dashboard use only -- includes exact page path per teammate.
export function useTeamPresence(): TeamPresenceMember[] {
  return useContext(PresenceContext).members;
}

// Client portal use -- name/avatar/online status only, never a page path.
export function usePublicTeamPresence(): TeamPresenceMember[] {
  return useContext(PresenceContext).publicMembers;
}
