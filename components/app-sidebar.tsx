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
  UsersRound,
  FolderKanban,
  Clapperboard,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  CheckCircle2,
  Circle,
  Gauge,
  Sparkles,
  ClipboardCheck,
  FileText,
  User,
  Bell,
  HelpCircle,
  Megaphone,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSidebarState } from '@/components/shell/SidebarState';
import { UserMenu } from '@/components/shell/UserMenu';
import { useNavCounts } from '@/hooks/use-nav-counts';
import { useRecentItems } from '@/hooks/use-recent-items';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOnboardingChecklist } from '@/hooks/use-onboarding-checklist';

// Sized to fit the nav labels themselves (short French words + icon + a
// badge) with a little breathing room -- not an arbitrary wide default.
const SIDEBAR_WIDTH = 232;

// Set isNew: true on an item to flag it as a freshly-launched section —
// shows a small "Nouveau" pill until you remove the flag (no auto-expiry,
// this is a manual "still worth calling out" switch for whoever ships the
// next feature).
type NavItem = { key: string; label: string; href: string; icon: LucideIcon; count?: number; isNew?: boolean };

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
      {item.isNew && (
        <span
          className={cn(
            'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide leading-none',
            active ? 'bg-white/20 text-white' : 'bg-mv-green-tint text-mv-green'
          )}
        >
          Nouveau
        </span>
      )}
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

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <div className="px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-faint">{label}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
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
  const recentItems = useRecentItems(4);
  const { role } = useCurrentUser();
  const isAdmin = role === 'admin';

  // "Menu principal" -- the everyday, always-visible actions.
  const mainMenuItems: NavItem[] = [
    { key: 'overview', label: 'Accueil', href: '/overview', icon: LayoutDashboard },
    { key: 'tasks', label: 'Tâches', href: '/tasks', icon: CheckSquare, count: counts.myTasks ?? undefined },
  ];

  // "Données" -- everything that's a real record/collection.
  const dataItems: NavItem[] = [
    { key: 'clients', label: 'Clients', href: '/clients', icon: Users },
    { key: 'leads', label: 'Leads', href: '/leads', icon: Target },
    { key: 'projects', label: 'Projets', href: '/projects', icon: FolderKanban },
    { key: 'team', label: 'Équipe', href: '/team', icon: UsersRound, isNew: true },
    { key: 'reels', label: 'Réels', href: '/content-planner', icon: Clapperboard },
    { key: 'academy', label: 'Académie', href: '/academy', icon: GraduationCap },
    ...(isAdmin
      ? [
          { key: 'workload', label: 'Charge de travail', href: '/team/workload', icon: Gauge } as NavItem,
          { key: 'acquisition', label: 'Acquisition', href: '/acquisition', icon: Sparkles } as NavItem,
          { key: 'audits', label: 'Audits', href: '/audits', icon: ClipboardCheck } as NavItem,
        ]
      : []),
  ];

  const settingsItems: NavItem[] = [
    { key: 'profil', label: 'Profil', href: '/profil', icon: User },
    { key: 'members', label: 'Membres', href: '/team', icon: Users },
    { key: 'notifications', label: 'Notifications', href: '/settings/notifications', icon: Bell },
    { key: 'help', label: 'Aide', href: '/help', icon: HelpCircle },
    { key: 'changelog', label: 'Nouveautés', href: '/changelog', icon: Megaphone },
    ...(isAdmin ? [{ key: 'billing', label: 'Facturation', href: '/settings/billing', icon: CreditCard } as NavItem] : []),
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const { steps: onboardingSteps, doneCount, total: onboardingTotal, loading: onboardingLoading } =
    useOnboardingChecklist();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const onboardingPct = onboardingTotal > 0 ? Math.round((doneCount / onboardingTotal) * 100) : 0;
  const onboardingComplete = onboardingTotal > 0 && doneCount === onboardingTotal;

  const body = (
    <div className="flex h-full w-[232px] min-w-[232px] flex-col bg-mv-cream-soft">
      {/* Header — personal profile card (avatar + name + email), opens the
          account menu via UserMenu's dropdown content. */}
      <div className="border-b border-mv-border px-2 py-2.5">
        <UserMenu onNavigate={closeOnNavigate} variant="card" />
      </div>

      {/* Nav */}
      <div className="flex-1 space-y-4 overflow-y-auto px-2.5 py-3">
        <NavSection label="Menu principal">
          {mainMenuItems.map((item) => (
            <NavLink key={item.key} item={item} active={isActive(item.href)} onNavigate={closeOnNavigate} />
          ))}
        </NavSection>

        <NavSection label="Données">
          {dataItems.map((item) => (
            <NavLink key={item.key} item={item} active={isActive(item.href)} onNavigate={closeOnNavigate} />
          ))}
        </NavSection>

        {/* Aujourd'hui — clients/projets créés le plus récemment (données réelles) */}
        {recentItems.length > 0 && (
          <NavSection label="Aujourd'hui">
            {recentItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={closeOnNavigate}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-1 text-xs text-mv-ink-soft hover:bg-mv-cream hover:text-mv-ink transition-colors truncate"
              >
                {item.id.startsWith('client-') ? (
                  <Users size={13} className="shrink-0 opacity-60" />
                ) : (
                  <FileText size={13} className="shrink-0 opacity-60" />
                )}
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </NavSection>
        )}
      </div>

      {/* Footer — Démarrage (real onboarding progress) + compact settings group */}
      <div className="border-t border-mv-border p-2 space-y-1">
        {!onboardingLoading && onboardingTotal > 0 && !onboardingComplete && (
          <div className="relative">
            <AnimatePresence>
              {showOnboarding && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-mv-surface border border-mv-border rounded-lg shadow-mv-md space-y-2.5 z-50"
                >
                  <div className="flex items-center justify-between border-b border-mv-border pb-1.5">
                    <span className="text-xs font-bold text-mv-ink">Bien démarrer</span>
                    <span className="text-[10px] font-semibold text-mv-green bg-mv-green-tint px-1.5 py-0.5 rounded">
                      {onboardingPct}% fait
                    </span>
                  </div>
                  <ul className="space-y-1.5 max-h-[180px] overflow-y-auto">
                    {onboardingSteps.map((step) => (
                      <li key={step.key}>
                        <Link
                          href={step.href}
                          onClick={closeOnNavigate}
                          className="flex items-start gap-2 text-xs text-mv-ink-soft hover:text-mv-ink"
                        >
                          {step.done ? (
                            <CheckCircle2 size={14} className="text-mv-green shrink-0 mt-0.5" />
                          ) : (
                            <Circle size={14} className="text-mv-ink-faint shrink-0 mt-0.5" />
                          )}
                          <span className={cn('truncate', step.done && 'line-through text-mv-ink-faint')}>
                            {step.label}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={() => setShowOnboarding((v) => !v)}
              className="w-full text-left p-2.5 bg-mv-surface border border-mv-border hover:border-mv-ink-faint rounded-md flex flex-col gap-1.5 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-xs font-bold text-mv-ink">
                <span>Démarrage</span>
                <motion.span animate={{ rotate: showOnboarding ? 180 : 0 }} transition={{ duration: 0.15 }}>
                  <ChevronUp size={12} className="text-mv-ink-faint" />
                </motion.span>
              </div>
              <div className="text-[10px] text-mv-ink-soft">
                {onboardingPct}% fait <span className="text-mv-green">• En cours</span>
              </div>
              <div className="w-full bg-mv-cream-soft h-1 rounded-full overflow-hidden">
                <div className="bg-mv-green h-full rounded-full transition-all duration-500" style={{ width: `${onboardingPct}%` }} />
              </div>
            </button>
          </div>
        )}
        <CollapsibleGroup label="Paramètres" defaultOpen={false}>
          {settingsItems.map((item) => (
            <NavLink key={item.key} item={item} active={isActive(item.href)} onNavigate={closeOnNavigate} />
          ))}
        </CollapsibleGroup>
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
