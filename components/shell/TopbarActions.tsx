'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, X } from 'lucide-react';
import Link from 'next/link';
import { SearchDialog } from './SearchDialog';
import { NewMenu } from './NewMenu';
import { ThemeToggle } from './ThemeToggle';
import { enablePushNotifications } from '@/lib/push-client';

type Alert = {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  url: string;
  created_at: string;
};

export function TopbarActions() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data } = await supabase
          .from('alerts')
          .select('*')
          .eq('resolved', false)
          .order('created_at', { ascending: false })
          .limit(10);
        if (data) setAlerts(data as Alert[]);
      } catch {
        setAlerts([]);
      }
    })();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleBellClick = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && notifPermission === 'default') {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
      if (result === 'granted') {
        new Notification('Minerva Trequartista', {
          body: 'Les notifications sont activées. Vous recevrez les alertes importantes ici.',
          icon: '/icon-192.png',
        });
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) await enablePushNotifications(user.id);
        } catch {
          // Push registration is a bonus on top of the in-app permission --
          // never block the bell UI on it.
        }
      }
      return;
    }
    setIsNotifOpen((v) => !v);
  };

  const needsPermission = notifPermission === 'default';

  return (
    <div className="flex items-center gap-2">
      <button
        id="topbar-search-btn"
        onClick={() => setIsSearchOpen(true)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-mv-surface border border-mv-border text-xs text-mv-ink-soft hover:border-mv-green/40 hover:text-mv-ink transition-all cursor-pointer"
      >
        <Search className="w-3.5 h-3.5 text-mv-green" />
        <span className="hidden sm:inline">Rechercher...</span>
        <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-mv-cream-soft border border-mv-border text-[10px] font-mono text-mv-ink-faint">
          ⌘K
        </kbd>
      </button>

      <NewMenu />
      <ThemeToggle />

      <div className="relative">
        <button
          id="topbar-notif-btn"
          onClick={handleBellClick}
          className="relative p-2 rounded-lg bg-mv-surface border border-mv-border text-mv-ink-soft hover:text-mv-ink transition-colors cursor-pointer"
          title={needsPermission ? 'Activer les notifications' : 'Notifications'}
        >
          <Bell className="w-4 h-4" />
          {(alerts.length > 0 || needsPermission) && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-mv-red animate-pulse" />
          )}
        </button>

        {isNotifOpen && !needsPermission && (
          <div className="absolute right-0 mt-2 w-80 bg-mv-surface border border-mv-border rounded-xl shadow-mv-lg p-3 z-50 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-mv-border">
              <span className="text-xs font-bold text-mv-ink uppercase tracking-wider">
                Alertes {alerts.length > 0 && `(${alerts.length})`}
              </span>
              <button onClick={() => setIsNotifOpen(false)} className="text-mv-ink-soft hover:text-mv-ink">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {alerts.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-mv-ink-faint">Aucune alerte active</p>
                <p className="text-[11px] text-mv-ink-mute mt-1">Vous êtes à jour ✓</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {alerts.map((al) => (
                  <Link
                    key={al.id}
                    href={al.url}
                    onClick={() => setIsNotifOpen(false)}
                    className="block p-2.5 rounded-lg bg-mv-cream-soft hover:bg-mv-green-tint border border-mv-border transition-colors text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-mv-ink truncate">{al.title}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          al.severity === 'critical'
                            ? 'bg-mv-red-bg text-mv-red'
                            : al.severity === 'warning'
                              ? 'bg-mv-amber-bg text-mv-amber'
                              : 'bg-mv-green-tint text-mv-green'
                        }`}
                      >
                        {al.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-mv-ink-soft leading-tight">{al.description}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
