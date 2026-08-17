'use client';

import React from 'react';
import { usePublicTeamPresence } from '@/components/providers/PresenceProvider';

// Client-portal-safe presence indicator: count + first names only, never a
// page path (see PresenceProvider -- clients never see which internal page,
// or which OTHER client's record, a teammate is currently viewing).
export function TeamOnlineBadge() {
  const members = usePublicTeamPresence();
  if (members.length === 0) return null;

  const label = members.length === 1
    ? `${members[0].fullName.split(' ')[0]} est en ligne`
    : `${members.length} membres Minerva en ligne`;

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-mv-green-tint border border-mv-green/30 text-[11px] font-semibold text-mv-green">
      <span className="relative flex w-1.5 h-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mv-green opacity-60" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-mv-green" />
      </span>
      {label}
    </div>
  );
}
