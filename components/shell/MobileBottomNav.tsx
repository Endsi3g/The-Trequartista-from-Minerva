'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Menu,
  Plus,
} from 'lucide-react';
import { useSidebarState } from './SidebarState';
import { QuickActionSheet } from './QuickActionSheet';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface NavTab {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matcher: (pathname: string) => boolean;
}

const LEFT_TABS: NavTab[] = [
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
];

const RIGHT_TABS: NavTab[] = [
  {
    key: 'tasks',
    label: 'Tâches',
    href: '/tasks',
    icon: CheckSquare,
    matcher: (p) => p.startsWith('/tasks'),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleCollapsed } = useSidebarState();
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const handleTabClick = () => {
    triggerHaptic('light');
  };

  const handleCenterCtaClick = () => {
    triggerHaptic('medium');
    setIsQuickActionOpen(true);
  };

  const handleMenuClick = () => {
    triggerHaptic('medium');
    toggleCollapsed();
  };

  return (
    <>
      <nav
        aria-label="Navigation principale mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#f2f2f2] px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom,34px))] shadow-lg flex items-center justify-around select-none"
      >
        {/* Left Tabs (Accueil & Leads) */}
        {LEFT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.matcher(pathname);

          return (
            <Link
              key={tab.key}
              href={tab.href}
              onClick={handleTabClick}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-1 px-1 rounded min-h-[44px] transition-colors relative cursor-pointer',
                isActive ? 'text-[#0c8c5e] font-semibold' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              {isActive && (
                <span className="absolute -top-1.5 w-6 h-0.5 rounded-[1px] bg-[#0c8c5e]" />
              )}
              <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'stroke-[2.25] text-[#0c8c5e]')} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </Link>
          );
        })}

        {/* Center Action CTA: Elevated Button in Thumb Reach Zone (uxpeak Masterclass) */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <button
            type="button"
            onClick={handleCenterCtaClick}
            aria-label="Actions rapides au pouce"
            title="Actions rapides (+)"
            className="w-10 h-10 -mt-3.5 rounded bg-[#08090a] hover:bg-zinc-800 text-white shadow-md border border-zinc-700/60 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
          >
            <Plus className="w-5 h-5 text-white stroke-[2.5]" />
          </button>
          <span className="text-[9.5px] text-zinc-500 font-medium mt-0.5 tracking-tight">Créer</span>
        </div>

        {/* Right Tabs (Tâches & Menu) */}
        {RIGHT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.matcher(pathname);

          return (
            <Link
              key={tab.key}
              href={tab.href}
              onClick={handleTabClick}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-1 px-1 rounded min-h-[44px] transition-colors relative cursor-pointer',
                isActive ? 'text-[#0c8c5e] font-semibold' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              {isActive && (
                <span className="absolute -top-1.5 w-6 h-0.5 rounded-[1px] bg-[#0c8c5e]" />
              )}
              <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'stroke-[2.25] text-[#0c8c5e]')} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </Link>
          );
        })}

        {/* Menu / Sidebar Drawer toggle */}
        <button
          type="button"
          onClick={handleMenuClick}
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded min-h-[44px] text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </nav>

      {/* Quick Action Sheet Modal */}
      <QuickActionSheet
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
      />
    </>
  );
}
