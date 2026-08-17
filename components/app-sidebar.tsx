'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
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
  PhoneCall,
  Building2,
  Plus,
  Rocket,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSidebarState } from '@/components/shell/SidebarState';
import { UserMenu } from '@/components/shell/UserMenu';
import { useNavCounts } from '@/hooks/use-nav-counts';
import { useRecentItems } from '@/hooks/use-recent-items';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOnboardingChecklist } from '@/hooks/use-onboarding-checklist';
import { LogoMark } from '@/components/shell/Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SIDEBAR_WIDTH = 232;

type NavItem = { key: string; label: string; href: string; icon: LucideIcon; count?: number; isNew?: boolean };

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
        active
          ? 'bg-neutral-900 text-white font-semibold shadow-2xs'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      )}
    >
      <Icon size={16} strokeWidth={active ? 2.2 : 1.6} className={cn('shrink-0', active ? 'text-white' : 'opacity-70')} />
      <span className="truncate flex-1">{item.label}</span>
      {item.isNew && (
        <span
          className={cn(
            'shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide leading-none',
            active ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
          )}
        >
          Nouveau
        </span>
      )}
      {typeof item.count === 'number' && item.count > 0 && (
        <span
          className={cn(
            'shrink-0 min-w-[18px] text-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
            active ? 'bg-white/20 text-white' : 'bg-neutral-200/80 text-neutral-600'
          )}
        >
          {item.count}
        </span>
      )}
    </Link>
  );
}

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30, mass: 1 };

function NavSection({
  label,
  children,
  alwaysOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  // Skips the collapse toggle/chevron/localStorage entirely -- used for
  // the "Principal" group of daily-use items, which should never be
  // hidden by an accidental collapse. Every other section stays
  // collapsible exactly as before.
  alwaysOpen?: boolean;
}) {
  const storageKey = `mv-sidebar-section-${label}`;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (alwaysOpen) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) setOpen(stored !== 'closed');
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    if (alwaysOpen) return;
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? 'open' : 'closed');
      } catch {}
      return next;
    });
  };

  if (alwaysOpen) {
    return (
      <div className="space-y-0.5">
        <div className="px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-neutral-400">
          {label}
        </div>
        <div className="space-y-0.5">{children}</div>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
      >
        <span>{label}</span>
        <ChevronDown
          size={12}
          className={cn('shrink-0 transition-transform duration-200', open ? 'rotate-0' : '-rotate-90')}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING}
            className="overflow-hidden"
          >
            <div className="space-y-0.5">{children}</div>
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

  // Workspaces state for minimalist switcher
  const [selectedWorkspace, setSelectedWorkspace] = useState('Minerva Agency');

  // "Principal" -- daily-use, personal-scope items
  const mainMenuItems: NavItem[] = [
    { key: 'overview', label: 'Accueil', href: '/overview', icon: LayoutDashboard },
    { key: 'voice-agent', label: 'Agent Vocal IA', href: '/voice-agent', icon: PhoneCall, isNew: true },
    { key: 'tasks', label: 'Tâches', href: '/tasks', icon: CheckSquare, count: counts.myTasks ?? undefined },
    { key: 'documents', label: 'Documents', href: '/documents', icon: FileText, isNew: true },
    { key: 'chat', label: 'Chat d\'équipe', href: '/chat', icon: MessageSquare, isNew: true },
  ];

  // "CRM" -- the sales pipeline
  const crmItems: NavItem[] = [
    { key: 'clients', label: 'Clients', href: '/clients', icon: Users },
    { key: 'leads', label: 'Leads', href: '/leads', icon: Target },
  ];

  // "Livraison" -- client-facing production work
  const deliveryItems: NavItem[] = [
    { key: 'projects', label: 'Projets', href: '/projects', icon: FolderKanban },
    { key: 'reels', label: 'Réels', href: '/content-planner', icon: Clapperboard },
    { key: 'academy', label: 'Académie', href: '/academy', icon: GraduationCap },
  ];

  // "Équipe" -- people ops
  const teamItems: NavItem[] = [
    { key: 'team', label: 'Équipe', href: '/team', icon: UsersRound },
    ...(isAdmin ? [{ key: 'workload', label: 'Charge de travail', href: '/team/workload', icon: Gauge } as NavItem] : []),
  ];

  // "Croissance" -- admin-only, top-of-funnel
  const growthItems: NavItem[] = isAdmin
    ? [
        { key: 'acquisition', label: 'Acquisition', href: '/acquisition', icon: Sparkles },
        { key: 'audits', label: 'Audits IA', href: '/audits', icon: ClipboardCheck },
        { key: 'produits', label: 'Produits Minerva', href: '/produits', icon: Rocket },
      ]
    : [];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const { steps: onboardingSteps, doneCount, total: onboardingTotal, loading: onboardingLoading } =
    useOnboardingChecklist();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const onboardingPct = onboardingTotal > 0 ? Math.round((doneCount / onboardingTotal) * 100) : 0;
  const onboardingComplete = onboardingTotal > 0 && doneCount === onboardingTotal;

  const body = (
    <div className="flex h-full w-[232px] min-w-[232px] flex-col bg-[#F9F9F8] border-r border-neutral-200">
      
      {/* ── Top Header: Minimalist Workspace Switcher ── */}
      <div className="p-3 border-b border-neutral-200/80">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center justify-between gap-2.5 rounded-xl border border-neutral-200/90 bg-white p-2 text-left hover:border-neutral-300 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                  <LogoMark size={24} />
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-xs font-extrabold text-neutral-900">
                    {selectedWorkspace}
                  </span>
                  <span className="block truncate text-[10px] text-neutral-400">Espace de travail</span>
                </div>
              </div>
              <ChevronDown size={13} className="shrink-0 text-neutral-400" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-neutral-400">
              Espaces de travail
            </div>
            <DropdownMenuItem onClick={() => setSelectedWorkspace('Minerva Agency')} className="text-xs font-semibold cursor-pointer">
              <Building2 className="w-3.5 h-3.5 mr-2 text-neutral-700" />
              <span>Minerva Agency</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedWorkspace('Minerva Voice AI')} className="text-xs font-semibold cursor-pointer">
              <PhoneCall className="w-3.5 h-3.5 mr-2 text-neutral-700" />
              <span>Minerva Voice AI</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/billing" className="text-xs font-medium cursor-pointer">
                <Plus className="w-3.5 h-3.5 mr-2 text-neutral-500" />
                <span>Créer un espace...</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Nav Links ── */}
      <div className="flex-1 space-y-4 overflow-y-auto px-2.5 py-3 scrollbar-none">
        <NavSection label="Principal" alwaysOpen>
          {mainMenuItems.map((item) => (
            <NavLink key={item.key} item={item} active={isActive(item.href)} onNavigate={closeOnNavigate} />
          ))}
        </NavSection>

        <NavSection label="CRM">
          {crmItems.map((item) => (
            <NavLink key={item.key} item={item} active={isActive(item.href)} onNavigate={closeOnNavigate} />
          ))}
        </NavSection>

        <NavSection label="Livraison">
          {deliveryItems.map((item) => (
            <NavLink key={item.key} item={item} active={isActive(item.href)} onNavigate={closeOnNavigate} />
          ))}
        </NavSection>

        <NavSection label="Équipe">
          {teamItems.map((item) => (
            <NavLink key={item.key} item={item} active={isActive(item.href)} onNavigate={closeOnNavigate} />
          ))}
        </NavSection>

        {growthItems.length > 0 && (
          <NavSection label="Croissance">
            {growthItems.map((item) => (
              <NavLink key={item.key} item={item} active={isActive(item.href)} onNavigate={closeOnNavigate} />
            ))}
          </NavSection>
        )}

        {/* Aujourd'hui */}
        {recentItems.length > 0 && (
          <NavSection label="Aujourd'hui">
            {recentItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={closeOnNavigate}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors truncate"
              >
                {item.id.startsWith('client-') ? (
                  <Users size={12} className="shrink-0 opacity-60" />
                ) : (
                  <FileText size={12} className="shrink-0 opacity-60" />
                )}
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </NavSection>
        )}
      </div>

      {/* ── Footer: Onboarding Check + User Profile Menu ── */}
      <div className="border-t border-neutral-200/80 p-2.5 space-y-2">
        {!onboardingLoading && onboardingTotal > 0 && !onboardingComplete && (
          <div className="relative">
            <AnimatePresence>
              {showOnboarding && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-white border border-neutral-200 rounded-xl shadow-md space-y-2.5 z-50"
                >
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5">
                    <span className="text-xs font-bold text-neutral-900">Bien démarrer</span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {onboardingPct}% fait
                    </span>
                  </div>
                  <ul className="space-y-1.5 max-h-[180px] overflow-y-auto">
                    {onboardingSteps.map((step) => (
                      <li key={step.key}>
                        <Link
                          href={step.href}
                          onClick={closeOnNavigate}
                          className="flex items-start gap-2 text-xs text-neutral-600 hover:text-neutral-900"
                        >
                          {step.done ? (
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Circle size={14} className="text-neutral-400 shrink-0 mt-0.5" />
                          )}
                          <span className={cn('line-clamp-1', step.done && 'line-through text-neutral-400')}>
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
              onClick={() => setShowOnboarding(!showOnboarding)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-100/70 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 transition-colors"
            >
              <span>Bien démarrer</span>
              <span className="text-[10px] text-emerald-700 font-bold">{onboardingPct}%</span>
            </button>
          </div>
        )}

        {/* User Account / Profile at bottom */}
        <UserMenu onNavigate={closeOnNavigate} variant="card" />
      </div>

    </div>
  );

  return (
    <>
      <aside
        className={cn(
          'hidden lg:block shrink-0 h-screen sticky top-0 transition-all duration-200 z-20',
          collapsed ? 'w-0 overflow-hidden' : `w-[${SIDEBAR_WIDTH}px]`
        )}
      >
        {body}
      </aside>

      {/* Mobile Drawer */}
      {isMobile && mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden shadow-xl">
            {body}
          </div>
        </>
      )}
    </>
  );
}
