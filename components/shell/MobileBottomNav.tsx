'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Building2,
  Menu,
} from 'lucide-react';
import { useSidebarState } from './SidebarState';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface NavTab {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matcher: (pathname: string) => boolean;
}

const TABS: NavTab[] = [
  {
    key: 'overview',
    label: 'Accueil',
    href: '/overview',
    icon: LayoutDashboard,
    matcher: (p) => p === '/' || p.startsWith('/overview'),
  },
  {
    key: 'leads',
    label: 'Leads',
    href: '/leads',
    icon: Target,
    matcher: (p) => p.startsWith('/leads'),
  },
  {
    key: 'tasks',
    label: 'Tâches',
    href: '/tasks',
    icon: CheckSquare,
    matcher: (p) => p.startsWith('/tasks'),
  },
  {
    key: 'clients',
    label: 'Clients',
    href: '/clients',
    icon: Building2,
    matcher: (p) => p.startsWith('/clients'),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleCollapsed } = useSidebarState();

  const handleTabClick = () => {
    triggerHaptic('light');
  };

  const handleMenuClick = () => {
    triggerHaptic('medium');
    toggleCollapsed();
  };

  return (
    <nav
      aria-label="Navigation principale mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-mv-surface/95 backdrop-blur-md border-t border-mv-border/80 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom,0px))] shadow-lg flex items-center justify-around select-none"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.matcher(pathname);

        return (
          <Link
            key={tab.key}
            href={tab.href}
            onClick={handleTabClick}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-[6px] min-h-[44px] transition-colors relative cursor-pointer',
              isActive ? 'text-emerald-700 font-semibold' : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            {isActive && (
              <span className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-emerald-600" />
            )}
            <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'stroke-[2.25] text-emerald-600')} />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </Link>
        );
      })}

      {/* Menu / Sidebar Drawer toggle */}
      <button
        type="button"
        onClick={handleMenuClick}
        className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-[6px] min-h-[44px] text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">Menu</span>
      </button>
    </nav>
  );
}
