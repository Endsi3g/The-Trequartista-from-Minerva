'use client';

import React from 'react';
import { useRealtimePresenceRoom } from '@/hooks/use-realtime-presence-room';
import { useCurrentUser } from '@/hooks/use-current-user';

// Client-portal-safe presence indicator: count + first names only, never a
// page path. Deliberately a separate room from minerva-team-presence (see
// TeamPresence.tsx) -- a client must never learn which internal page, or
// which OTHER client's record, a teammate is currently viewing. Only
// admin/member roles ever track() here (see profil/layout auth gating);
// a client-role viewer only ever subscribes, so this room never contains
// "self" for that audience -- no exclusion needed on this side.
export function TeamOnlineBadge() {
  const { role } = useCurrentUser();
  const isTeam = role === 'admin' || role === 'member';
  const { users } = useRealtimePresenceRoom('minerva-team-presence-public', undefined, isTeam);
  const members = Object.values(users);
  if (members.length === 0) return null;

  const label = members.length === 1
    ? `${members[0].name.split(' ')[0]} est en ligne`
    : `${members.length} membres Minerva en ligne`;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-mv-green-tint border border-mv-green/30 text-[11px] font-semibold text-mv-green">
      <span className="relative flex w-1.5 h-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-[2px] bg-mv-green opacity-60" />
        <span className="relative inline-flex rounded-[2px] h-1.5 w-1.5 bg-mv-green" />
      </span>
      {label}
    </div>
  );
}
