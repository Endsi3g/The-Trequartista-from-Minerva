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
  CheckSquare,
  CheckCircle2,
  Circle,
  Gauge,
  Sparkles,
  ClipboardCheck,
  FileText,
  PhoneCall,
  Building2,
  Plus,
  Rocket,
  MessageSquare,
  Search as SearchIcon,
  Star,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSidebarState } from '@/components/shell/SidebarState';
import { UserMenu } from '@/components/shell/UserMenu';
import { SearchDialog } from '@/components/shell/SearchDialog';
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

// Structure/pattern reproduced from Minerva Flow's components/shell/AppSidebar.tsx
// (github.com/Endsi3g/Minerva-Flow) -- collapsible sections with a
// left-border indent, a session-only Favorites section with per-item
// star toggling, a compact header with a search icon beside the
// workspace switcher, and mv-green as the active-link accent instead of
// solid black. Content stays Trequartista's own (no restaurant-specific
// items ported over); the collapse/mobile-drawer plumbing below
// (useSidebarState, the outer <aside>) is unchanged -- Flow's own
// width-animation approach isn't reused since it would duplicate/
// conflict with AppShell's existing SidebarTrigger wiring.
const SIDEBAR_WIDTH = 232;
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30, mass: 1 };

type NavItem = { key: string; label: string; href: string; icon: LucideIcon; count?: number; isNew?: boolean };

function NavLink({
  item,
  active,
  onNavigate,
  isFavorite,
  onToggleFavorite,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}) {
  const Icon = item.icon;
  return (
    <div className="group relative flex items-center">
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'flex flex-1 min-w-0 h-7 items-center gap-2 rounded-[4px] pl-2 text-[12.5px] font-medium transition-all duration-150',
          // Reserve room on the right for the absolutely-positioned favorite star below,
          // so it never overlaps the isNew dot / count badge instead of sitting on top of them.
          onToggleFavorite ? 'pr-6' : 'pr-2',
          active
            ? 'bg-mv-green text-white font-semibold shadow-xs'
            : 'text-mv-ink-soft hover:bg-black/[0.05] hover:text-mv-ink'
        )}
      >
        <Icon size={14} strokeWidth={active ? 2.2 : 1.6} className={cn('shrink-0', active ? 'text-white' : 'opacity-70')} />
        <span className="truncate flex-1">{item.label}</span>
        {item.isNew && (
          <span
            className={cn(
              'shrink-0 w-1.5 h-1.5 rounded-full',
              active ? 'bg-white' : 'bg-mv-green'
            )}
            title="Nouveau"
          />
        )}
        {typeof item.count === 'number' && item.count > 0 && (
          <span
            className={cn(
              'shrink-0 min-w-[16px] text-center rounded px-1 py-0.2 text-[9.5px] font-bold leading-none',
              active ? 'bg-white/25 text-white' : 'bg-black/[0.06] text-mv-ink-soft'
            )}
          >
            {item.count}
          </span>
        )}
      </Link>
      {onToggleFavorite && (
        <button
          type="button"
          onClick={onToggleFavorite}
          title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className={cn(
            'absolute right-1 p-0.5 text-mv-ink-faint transition-opacity hover:text-mv-amber focus:outline-none cursor-pointer',
            isFavorite ? 'opacity-100 text-mv-amber' : 'opacity-0 group-hover:opacity-100',
            active && !isFavorite && 'text-white/70 hover:text-mv-amber'
          )}
        >
          <Star size={11} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
}

function NavSection({
  label,
  children,
  alwaysOpen = false,
  defaultOpen = false,
  persist = true,
}: {
  label: string;
  children: React.ReactNode;
  alwaysOpen?: boolean;
  defaultOpen?: boolean;
  persist?: boolean;
}) {
  const storageKey = `mv-sidebar-section-${label}`;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (alwaysOpen || !persist) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) setOpen(stored !== 'closed');
    } catch {}
  }, []);

  const toggle = () => {
    if (alwaysOpen) return;
    setOpen((prev) => {
      const next = !prev;
      if (persist) {
        try {
          localStorage.setItem(storageKey, next ? 'open' : 'closed');
        } catch {}
      }
      return next;
    });
  };

  if (alwaysOpen) {
    return (
      <div className="space-y-0.5">
        <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mv-ink-faint">
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
        className="w-full flex items-center justify-between px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mv-ink-faint hover:text-mv-ink transition-colors cursor-pointer"
      >
        <span>{label}</span>
        <motion.span animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown size={11} className="opacity-60" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING}
            className="overflow-hidden space-y-0.5 pl-1.5 border-l border-mv-border ml-2"
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
  const [searchOpen, setSearchOpen] = useState(false);

  // Workspaces state for minimalist switcher (unchanged: no second real
  // workspace exists yet for internal staff to switch into -- see
  // CLAUDE.md's Sidebar section).
  const [selectedWorkspace, setSelectedWorkspace] = useState('Minerva Agency');

  // Persisted favorites in localStorage so user preferences remain across sessions,
  // and removing all favorites is strictly respected (never re-injects defaults).
  const [favoriteKeys, setFavoriteKeys] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('minerva_favorite_nav_keys');
      return saved !== null ? JSON.parse(saved) : ['tasks', 'clients', 'projects'];
    } catch {
      return ['tasks', 'clients', 'projects'];
    }
  });

  const toggleFavorite = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavoriteKeys((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try {
        localStorage.setItem('minerva_favorite_nav_keys', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

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

  const allNavItems = [...mainMenuItems, ...crmItems, ...deliveryItems, ...teamItems, ...growthItems];
  const favoriteItems = allNavItems.filter((item) => favoriteKeys.includes(item.key));

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const { steps: onboardingSteps, doneCount, total: onboardingTotal, loading: onboardingLoading } =
    useOnboardingChecklist();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const onboardingPct = onboardingTotal > 0 ? Math.round((doneCount / onboardingTotal) * 100) : 0;
  const onboardingComplete = onboardingTotal > 0 && doneCount === onboardingTotal;

  const renderNavLink = (item: NavItem) => (
    <NavLink
      key={item.key}
      item={item}
      active={isActive(item.href)}
      onNavigate={closeOnNavigate}
      isFavorite={favoriteKeys.includes(item.key)}
      onToggleFavorite={(e) => toggleFavorite(item.key, e)}
    />
  );

  const body = (
    <div className="flex h-full w-[232px] min-w-[232px] flex-col bg-mv-cream-soft border-r border-mv-border">

      {/* ── Header: compact workspace switcher + search ── */}
      <div className="flex h-14 items-center justify-between border-b border-mv-border px-2.5">
        <div className="flex-1 min-w-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-mv-ink/5 cursor-pointer">
                <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                  <LogoMark size={22} />
                </div>
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-mv-ink font-display">
                  {selectedWorkspace}
                </span>
                <ChevronDown size={13} className="shrink-0 text-mv-ink-faint" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase text-mv-ink-faint">
                Espaces de travail
              </div>
              <DropdownMenuItem onClick={() => setSelectedWorkspace('Minerva Agency')} className="text-xs font-semibold cursor-pointer">
                <Building2 className="w-3.5 h-3.5 mr-2 text-mv-ink-soft" />
                <span>Minerva Agency</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedWorkspace('Minerva Voice AI')} className="text-xs font-semibold cursor-pointer">
                <PhoneCall className="w-3.5 h-3.5 mr-2 text-mv-ink-soft" />
                <span>Minerva Voice AI</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/billing" className="text-xs font-medium cursor-pointer">
                  <Plus className="w-3.5 h-3.5 mr-2 text-mv-ink-faint" />
                  <span>Créer un espace...</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Rechercher"
          title="Rechercher (⌘K)"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-mv-ink-soft transition-colors hover:bg-mv-ink/5 hover:text-mv-ink ml-1 cursor-pointer"
        >
          <SearchIcon size={16} />
        </button>
      </div>

      {/* ── Nav Links ── */}
      <div className="flex-1 space-y-4 overflow-y-auto px-2.5 py-3 scrollbar-none">
        <NavSection label="Principal" alwaysOpen>
          {mainMenuItems.map(renderNavLink)}
        </NavSection>

        {favoriteItems.length > 0 && (
          <NavSection label="Favoris" defaultOpen persist={false}>
            {favoriteItems.map(renderNavLink)}
          </NavSection>
        )}

        <NavSection label="CRM" defaultOpen>
          {crmItems.map(renderNavLink)}
        </NavSection>

        <NavSection label="Livraison" defaultOpen>
          {deliveryItems.map(renderNavLink)}
        </NavSection>

        <NavSection label="Équipe" defaultOpen={teamItems.some((item) => isActive(item.href))}>
          {teamItems.map(renderNavLink)}
        </NavSection>

        {growthItems.length > 0 && (
          <NavSection label="Croissance" defaultOpen={growthItems.some((item) => isActive(item.href))}>
            {growthItems.map(renderNavLink)}
          </NavSection>
        )}

        {/* Aujourd'hui -- recent items, not part of the static nav catalog
            so they don't carry a favorite star. */}
        {recentItems.length > 0 && (
          <NavSection label="Aujourd'hui" defaultOpen>
            {recentItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={closeOnNavigate}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs text-mv-ink-faint hover:bg-mv-ink/[0.06] hover:text-mv-ink transition-colors truncate"
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
      <div className="border-t border-mv-border p-2.5 space-y-2">
        {!onboardingLoading && onboardingTotal > 0 && !onboardingComplete && (
          <div className="relative">
            <AnimatePresence>
              {showOnboarding && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-mv-surface border border-mv-border rounded-xl shadow-mv-md space-y-2.5 z-50"
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
                          <span className={cn('line-clamp-1', step.done && 'line-through text-mv-ink-faint')}>
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
              className="w-full text-left px-2 py-1.5 rounded-[4px] bg-black/[0.03] hover:bg-black/[0.06] transition-colors cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px] font-medium text-mv-ink">
                <span>Bien démarrer</span>
                <span className="text-[10.5px] text-mv-green font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {doneCount}/{onboardingTotal} étapes ({onboardingPct}%)
                </span>
              </div>
              <div className="h-1 w-full bg-black/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-mv-green rounded-full transition-all duration-300"
                  style={{ width: `${onboardingPct}%` }}
                />
              </div>
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

      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
