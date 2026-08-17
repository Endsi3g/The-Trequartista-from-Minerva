'use client';

import React, { useState } from 'react';
import { useTeamPresence } from '@/components/providers/PresenceProvider';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Users, X } from 'lucide-react';

export function TeamPresence() {
  const members = useTeamPresence();
  const [isOpen, setIsOpen] = useState(false);

  if (members.length === 0) return null;

  const visible = members.slice(0, 4);
  const overflow = members.length - visible.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1 pl-1.5 pr-2.5 py-1 rounded-lg bg-mv-surface border border-mv-border hover:border-mv-green/40 transition-all cursor-pointer"
        title={`${members.length} membre${members.length > 1 ? 's' : ''} actif${members.length > 1 ? 's' : ''}`}
      >
        <div className="flex items-center -space-x-2">
          {visible.map((m) => (
            <span key={m.userId} className="relative">
              <UserAvatar name={m.fullName} src={m.avatarUrl} size="xs" className="ring-2 ring-mv-surface" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-mv-green ring-2 ring-mv-surface" />
            </span>
          ))}
        </div>
        {overflow > 0 && <span className="text-[10px] font-bold text-mv-ink-soft">+{overflow}</span>}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-mv-surface border border-mv-border rounded-xl shadow-mv-lg p-3 z-50 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-mv-border">
              <span className="text-xs font-bold text-mv-ink uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-mv-green" />
                Actifs maintenant ({members.length})
              </span>
              <button onClick={() => setIsOpen(false)} className="text-mv-ink-soft hover:text-mv-ink cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-mv-cream-soft transition-colors">
                  <span className="relative shrink-0">
                    <UserAvatar name={m.fullName} src={m.avatarUrl} size="sm" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-mv-green ring-2 ring-mv-surface" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-mv-ink truncate">{m.fullName}</div>
                    <div className="text-[11px] text-mv-ink-soft truncate">{m.pageLabel || 'En ligne'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
