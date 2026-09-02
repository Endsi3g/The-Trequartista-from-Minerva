'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRealtimePresenceRoom } from '@/hooks/use-realtime-presence-room';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getPageLabel } from '@/lib/presence';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Users, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_KEY = 'mv-team-status';

export const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponible', dot: 'bg-mv-green' },
  { value: 'meeting', label: 'En réunion', dot: 'bg-amber-500' },
  { value: 'away', label: 'Absent', dot: 'bg-zinc-400' },
] as const;

export type TeamStatus = (typeof STATUS_OPTIONS)[number]['value'];

function statusMeta(value: unknown) {
  return STATUS_OPTIONS.find((s) => s.value === value) || STATUS_OPTIONS[0];
}

export function TeamPresence() {
  const pathname = usePathname();
  const { role, fullName } = useCurrentUser();
  const isTeam = role === 'admin' || role === 'member';

  const [myStatus, setMyStatus] = useState<TeamStatus>('available');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATUS_KEY) as TeamStatus | null;
      if (saved && STATUS_OPTIONS.some((s) => s.value === saved)) setMyStatus(saved);
    } catch {}
  }, []);

  const changeStatus = (value: TeamStatus) => {
    const previous = myStatus;
    setMyStatus(value);
    try {
      localStorage.setItem(STATUS_KEY, value);
    } catch {}
    // Setting "En réunion" notifies the whole team -- best-effort, silently
    // no-ops if VAPID isn't configured (checked server-side by the route).
    if (value === 'meeting' && previous !== 'meeting') {
      fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🔴 En réunion',
          body: `${fullName || 'Un collègue'} est actuellement en réunion.`,
          url: '/overview',
        }),
      }).catch(() => {});
    }
  };

  // Custom status is only ever spread into the internal presence room's
  // `extra` payload, never the public one (usePublicTeamPresence /
  // TeamOnlineBadge) -- a client-role account must never see whether a
  // teammate is "en réunion", only that the team is online at all.
  const { otherUsers } = useRealtimePresenceRoom(
    'minerva-team-presence',
    { path: pathname, pageLabel: getPageLabel(pathname), status: myStatus },
    isTeam
  );
  const members = Object.values(otherUsers);
  const [isOpen, setIsOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  if (members.length === 0 && !isTeam) return null;

  const visible = members.slice(0, 4);
  const overflow = members.length - visible.length;
  const myStatusMeta = statusMeta(myStatus);

  return (
    <div className="relative flex items-center gap-1.5">
      {isTeam && (
        <div className="relative">
          <button
            onClick={() => setStatusMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-mv-surface border border-mv-border hover:border-mv-green/40 transition-all cursor-pointer text-[11px] font-medium text-mv-ink-soft"
            title="Changer mon statut"
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', myStatusMeta.dot)} />
            <span className="hidden sm:inline">{myStatusMeta.label}</span>
          </button>
          {statusMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setStatusMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-mv-surface border border-mv-border rounded-xl shadow-mv-lg p-1.5 z-50 space-y-0.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      changeStatus(opt.value);
                      setStatusMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-mv-cream-soft transition-colors text-left text-xs cursor-pointer"
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full', opt.dot)} />
                    <span className="flex-1 text-mv-ink">{opt.label}</span>
                    {opt.value === myStatus && <Check className="w-3 h-3 text-mv-green" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {members.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="flex items-center gap-1 pl-1.5 pr-2.5 py-1 rounded-lg bg-mv-surface border border-mv-border hover:border-mv-green/40 transition-all cursor-pointer"
            title={`${members.length} membre${members.length > 1 ? 's' : ''} actif${members.length > 1 ? 's' : ''}`}
          >
            <div className="flex items-center -space-x-2">
              {visible.map((m) => (
                <span key={m.id} className="relative">
                  <UserAvatar name={m.name} src={m.image} size="xs" className="ring-2 ring-mv-surface" />
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-mv-surface',
                      statusMeta(m.status).dot
                    )}
                  />
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
                    <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-mv-cream-soft transition-colors">
                      <span className="relative shrink-0">
                        <UserAvatar name={m.name} src={m.image} size="sm" />
                        <span
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-mv-surface',
                            statusMeta(m.status).dot
                          )}
                        />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-mv-ink truncate">{m.name}</div>
                        <div className="text-[11px] text-mv-ink-soft truncate">
                          {statusMeta(m.status).label}
                          {m.pageLabel ? ` · ${m.pageLabel as string}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
