'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  MessageCircle,
  LogOut,
  BarChart3,
  Sparkles,
  Zap,
} from 'lucide-react';
import { TeamOnlineBadge } from '@/components/portal/TeamOnlineBadge';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const NAV = [
  { key: 'overview', label: 'Tableau de bord', href: '/portal', icon: LayoutDashboard },
  { key: 'tasks', label: '⚡ Avancement & Livrables', href: '/portal/tasks', icon: Zap },
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-zinc-900">
      {/* ── 1. Top Navigation Bar (40px Height) ── */}
      <header className="h-10 px-4 md:px-6 bg-white border-b border-zinc-200 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
        {/* Left: Brand / Client Name */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-[4px] bg-zinc-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
            M
          </div>
          <span className="text-[13px] font-semibold text-zinc-900 truncate">
            {clientName || 'Toitures Beauchemin'}
          </span>
        </div>

        {/* Center: Underlined Compact Tabs */}
        <nav className="hidden md:flex items-center gap-1 h-full">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'h-full flex items-center gap-1.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap',
                  active
                    ? 'border-emerald-600 text-zinc-900 font-semibold'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                )}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Online Badge & Logout */}
        <div className="flex items-center gap-2.5">
          <TeamOnlineBadge />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer pl-2 border-l border-zinc-200"
            title="Se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Mobile Nav strip */}
      <nav className="md:hidden bg-white border-b border-zinc-200 px-3 flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'px-2 py-1 rounded text-xs whitespace-nowrap font-medium',
                active ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'text-zinc-500'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
