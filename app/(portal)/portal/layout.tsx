'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, MessageCircle, LogOut, BarChart3 } from 'lucide-react';
import { LogoMark } from '@/components/shell/Logo';
import { TeamOnlineBadge } from '@/components/portal/TeamOnlineBadge';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const NAV = [
  { key: 'overview', label: 'Tableau de bord', href: '/portal', icon: LayoutDashboard },
  { key: 'performance', label: 'Performance détaillée', href: '/portal/performance', icon: BarChart3 },
  { key: 'calendar', label: 'Calendrier éditorial', href: '/portal/calendar', icon: Calendar },
  { key: 'questions', label: 'Messagerie & Questions', href: '/portal/questions', icon: MessageCircle },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).maybeSingle();
      if (profile?.client_id) {
        const { data: client } = await supabase.from('clients').select('name').eq('id', profile.client_id).maybeSingle();
        setClientName(client?.name || '');
      }
    })();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-mv-cream flex flex-col text-mv-ink">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-8 bg-mv-surface border-b border-mv-border sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-mv-green text-white flex items-center justify-center shrink-0 shadow-mv-sm">
            <LogoMark size={18} />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-extrabold text-mv-ink truncate block font-display">
              {clientName || 'Portail Partenaire'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <TeamOnlineBadge />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-mv-surface border border-mv-border text-xs font-semibold text-mv-ink-soft hover:text-mv-ink hover:border-mv-ink-faint transition-all cursor-pointer shadow-mv-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Subnav Tabs */}
      <nav className="bg-mv-surface border-b border-mv-border px-4 md:px-8 flex items-center gap-2 overflow-x-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap',
                active
                  ? 'border-mv-green text-mv-ink font-extrabold'
                  : 'border-transparent text-mv-ink-soft hover:text-mv-ink'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-[1600px] w-full mx-auto">{children}</main>
    </div>
  );
}
