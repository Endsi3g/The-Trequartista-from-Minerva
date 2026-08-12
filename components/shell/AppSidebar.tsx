'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo, LogoMark } from './Logo';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  FolderKanban,
  CheckCircle2,
  Share2,
  UserCheck,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Star,
  StarOff,
  Settings,
  Zap,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';


// ── Types ──────────────────────────────────────────────
type NavItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  label: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

// ── Navigation Catalogue ───────────────────────────────
const navGroups: NavGroup[] = [
  {
    title: 'REVENUE & CLIENTS',
    items: [
      { key: 'overview',    href: '/overview',                                icon: LayoutDashboard, label: "Vue d'ensemble"               },
      { key: 'leads',       href: '/leads',                                   icon: Target,          label: 'Leads & Pipeline CRM'         },
      { key: 'clients',     href: '/clients',                                 icon: Users,           label: 'Portefeuille Clients & MRR'   },
      { key: 'roi-tracker', href: '/clients/client-apex-roofing/roi-tracker', icon: TrendingUp,      label: 'Rapports ROI & Performance'  },
    ],
  },
  {
    title: 'OPÉRATIONS CLIENTS',
    items: [
      { key: 'projects',        href: '/projects',                               icon: FolderKanban, label: 'Pipeline Projets'           },
      { key: 'launch-check',    href: '/projects/proj-apex-launch/launch-check', icon: CheckCircle2, label: 'Checklist Qualité (20 Pts)' },
      { key: 'content-planner', href: '/content-planner',                        icon: Share2,       label: 'Planificateur Contenu'      },
    ],
  },
  {
    title: 'RESSOURCES HUMAINES',
    items: [
      { key: 'team',     href: '/team',    icon: UserCheck,      label: 'Membres & Équipe'            },
      { key: 'profil',   href: '/profil',  icon: Users,          label: 'Mon Profil & OKRs'            },
      { key: 'academy',  href: '/academy', icon: GraduationCap,  label: 'Base de Connaissances & SOPs' },
    ],
  },
];


const bottomItems: NavItem[] = [
  { key: 'integrations', href: '/integrations', icon: Zap,      label: 'Intégrations'  },
  { key: 'settings',     href: '/settings',     icon: Settings, label: 'Paramètres'    },
];

const FAVORITES_KEY = 'mv-sidebar-favorites';

// ── NavLink Component ──────────────────────────────────
function NavLink({
  item,
  active,
  collapsed,
  isFavorite,
  onToggleFavorite,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent, key: string) => void;
}) {
  const Icon = item.icon;

  return (
    <div className="group relative flex items-center">
      <Tooltip content={collapsed ? item.label : ''} position="right">
        <Link
          href={item.href}
          className={[
            'flex flex-1 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all duration-150',
            active
              ? 'bg-mv-green text-white shadow-mv-sm'
              : 'text-mv-ink-soft hover:bg-mv-green-tint hover:text-mv-ink',
          ].join(' ')}
          title={undefined}
        >
          <Icon
            className={[
              'h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110',
              active ? 'text-mv-warm' : 'text-mv-ink-faint group-hover:text-mv-green',
            ].join(' ')}
          />
          {!collapsed && (
            <span className="truncate">{item.label}</span>
          )}
        </Link>
      </Tooltip>

      {/* Favorite toggle — only visible on hover when expanded */}
      {!collapsed && onToggleFavorite && (
        <Tooltip content={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} position="right">
          <button
            onClick={(e) => onToggleFavorite(e, item.key)}
            className="absolute right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-mv-ink-faint hover:text-mv-amber"
          >
            {isFavorite
              ? <Star className="w-3 h-3 fill-mv-amber text-mv-amber" />
              : <StarOff className="w-3 h-3" />
            }
          </button>
        </Tooltip>
      )}
    </div>
  );
}

// ── AppSidebar ─────────────────────────────────────────
interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AppSidebar({ collapsed, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [userInitials, setUserInitials] = useState('MV');
  const [userLabel, setUserLabel] = useState('Équipe Minerva');

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch {}
  }, []);

  // Load user from Supabase auth
  useEffect(() => {
    (async () => {
      try {
        const { createBrowserClient } = await import('@supabase/ssr');
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const name = user.user_metadata?.full_name || user.email;
          const parts = name.split(/[ @]/);
          const initials = parts.slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join('');
          setUserInitials(initials || 'MV');
          setUserLabel(user.user_metadata?.full_name || user.email);
        }
      } catch {}
    })();
  }, []);

  const toggleFavorite = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // All nav items flat for active check
  const allItems = navGroups.flatMap((g) => g.items);
  const favoriteItems = allItems.filter((item) => favorites.includes(item.key));

  const isActive = (href: string, key: string) =>
    pathname === href || (href !== '/overview' && pathname.startsWith(href) && key !== 'roi-tracker' && key !== 'launch-check');

  return (
    <aside
      className={[
        'fixed top-0 left-0 bottom-0 z-30 flex flex-col bg-mv-cream-soft border-r border-mv-border transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[260px]',
      ].join(' ')}
    >
      {/* ── Header ── */}
      <div className="h-16 px-3 border-b border-mv-border flex items-center justify-between shrink-0">
        <Link href="/overview" className="flex items-center gap-2.5 min-w-0">
          {collapsed
            ? <LogoMark size={28} />
            : <Logo size={28} />
          }
        </Link>

        <Tooltip content={collapsed ? 'Déplier la sidebar' : 'Rétracter la sidebar'} position="right">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-mv-ink-soft hover:text-mv-ink hover:bg-mv-border/60 transition-colors shrink-0 cursor-pointer ml-1"
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />
            }
          </button>
        </Tooltip>
      </div>

      {/* ── Navigation ── */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 pt-3">

        {/* Favoris */}
        {favoriteItems.length > 0 && (
          <div className="space-y-0.5">
            {!collapsed && (
              <p className="px-2.5 mb-1 text-[10px] font-bold tracking-widest uppercase text-mv-ink-faint">
                Favoris
              </p>
            )}
            {favoriteItems.map((item) => (
              <NavLink
                key={item.key}
                item={item}
                active={isActive(item.href, item.key)}
                collapsed={collapsed}
                isFavorite
                onToggleFavorite={toggleFavorite}
              />
            ))}
            <div className="mt-2 border-t border-mv-border-soft" />
          </div>
        )}

        {/* Main groups */}
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-0.5">
            {!collapsed && (
              <p className="px-2.5 mb-1 text-[10px] font-bold tracking-widest uppercase text-mv-ink-faint">
                {group.title}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.key}
                item={item}
                active={isActive(item.href, item.key)}
                collapsed={collapsed}
                isFavorite={favorites.includes(item.key)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ))}
      </div>

      {/* ── Bottom Items ── */}
      <div className="p-2 border-t border-mv-border space-y-0.5 shrink-0">
        {bottomItems.map((item) => (
          <NavLink
            key={item.key}
            item={item}
            active={pathname.startsWith(item.href)}
            collapsed={collapsed}
          />
        ))}
      </div>

      {/* ── User Footer ── */}
      <div className="p-2.5 border-t border-mv-border bg-mv-surface/50 shrink-0">
        <div className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-mv-green-tint transition-colors cursor-pointer">
          <div className="relative shrink-0">
            <div className="w-7 h-7 rounded-full bg-mv-green text-white flex items-center justify-center font-bold text-[11px]">
              {userInitials}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-400 border-2 border-mv-cream-soft" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-semibold text-mv-ink truncate">{userLabel}</span>
              <span className="text-[10px] text-mv-ink-faint truncate">Minerva • Admin</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
