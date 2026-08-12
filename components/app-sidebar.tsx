'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Target,
  Users,
  FolderKanban,
  Clapperboard,
  GraduationCap,
  UserCheck,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSidebarState } from '@/components/shell/SidebarState';
import { WorkspaceSwitcher } from '@/components/shell/WorkspaceSwitcher';
import { UserMenu } from '@/components/shell/UserMenu';
import { useNavCounts } from '@/hooks/use-nav-counts';

const SIDEBAR_WIDTH = 268;

type NavItem = { key: string; label: string; href: string; icon: LucideIcon; count?: number };

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-all duration-150',
        active
          ? 'bg-mv-green text-white font-semibold shadow-mv-sm'
          : 'text-mv-ink-soft hover:bg-mv-cream-soft hover:text-mv-ink'
      )}
    >
      <Icon size={16} strokeWidth={active ? 2.2 : 1.6} className={cn('shrink-0', active ? 'text-white' : 'opacity-70')} />
      <span className="truncate flex-1">{item.label}</span>
      {typeof item.count === 'number' && item.count > 0 && (
        <span
          className={cn(
            'shrink-0 min-w-[18px] text-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
            active ? 'bg-white/20 text-white' : 'bg-mv-cream-soft text-mv-ink-faint'
          )}
        >
          {item.count}
        </span>
      )}
    </Link>
  );
}

function CollapsibleGroup({
  label,
  defaultOpen,
  children,
}: {
  label: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-2.5 py-1 text-left text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-faint hover:text-mv-ink transition-colors cursor-pointer"
      >
        <span>{label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={12} className="opacity-60" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 40 }}
            className="overflow-hidden space-y-0.5"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, isMobile, mobileOpen, setMobileOpen, closeOnNavigate } = useSidebarState();
  const counts = useNavCounts();

  const coreItems: NavItem[] = [
    { key: 'overview', label: 'Aperçu', href: '/overview', icon: LayoutDashboard },
    { key: 'leads', label: 'Leads', href: '/leads', icon: Target, count: counts.leads ?? undefined },
    { key: 'clients', label: 'Clients', href: '/clients', icon: Users, count: counts.clients ?? undefined },
    { key: 'projects', label: 'Projets', href: '/projects', icon: FolderKanban, count: counts.projects ?? undefined },
  ];

  const contentItems: NavItem[] = [
    { key: 'reels', label: 'Réels', href: '/content-planner', icon: Clapperboard },
    { key: 'academy', label: 'Académie', href: '/academy', icon: GraduationCap },
  ];

  const teamItem: NavItem = { key: 'team', label: 'Équipe', href: '/team', icon: UserCheck };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const body = (
    <div className="flex h-full w-[268px] min-w-[268px] flex-col bg-mv-cream-soft">
      {/* Header — workspace switcher */}
      <div className="flex h-14 items-center border-b border-mv-border px-3">
        <WorkspaceSwitcher />
      </div>

      {/* Nav */}
      <div className="flex-1 space-y-4 overflow-y-auto px-2.5 py-3">
        <div className="space-y-0.5">
          {coreItems.map((item) => (
            <NavLink key={item.key} item={item} active={isActive(item.href)} onNavigate={closeOnNavigate} />
          ))}
        </div>

        <CollapsibleGroup label="Contenu" defaultOpen={contentItems.some((i) => isActive(i.href))}>
          {contentItems.map((item) => (
            <NavLink key={item.key} item={item} active={isActive(item.href)} onNavigate={closeOnNavigate} />
          ))}
        </CollapsibleGroup>

        <div className="pt-1 border-t border-mv-border-soft space-y-0.5">
          <NavLink item={teamItem} active={isActive(teamItem.href)} onNavigate={closeOnNavigate} />
        </div>
      </div>

      {/* Footer — user menu */}
      <div className="border-t border-mv-border p-2">
        <UserMenu onNavigate={closeOnNavigate} />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/40" />
        )}
        <motion.aside
          initial={false}
          animate={{ x: mobileOpen ? 0 : -SIDEBAR_WIDTH }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-y-0 left-0 z-50 flex shrink-0 border-r border-mv-border shadow-mv-lg"
        >
          {body}
        </motion.aside>
      </>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 0 : SIDEBAR_WIDTH }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn('relative shrink-0 overflow-hidden border-r border-mv-border', collapsed && 'border-r-0')}
    >
      {body}
    </motion.aside>
  );
}
