'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Shield,
  Sparkles,
} from 'lucide-react';

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AppSidebar({ collapsed, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname();

  const domainGroups = [
    {
      title: 'PILOTAGE & FINANCES',
      items: [
        { href: '/overview', label: 'Command Center', icon: LayoutDashboard },
        { href: '/clients', label: 'Clients & MRR', icon: Users },
        { href: '/clients/client-apex-roofing/roi-tracker', label: 'Suivi ROI Client', icon: TrendingUp },
      ],
    },
    {
      title: 'OPÉRATIONS & QUALITÉ',
      items: [
        { href: '/projects', label: 'Projets & Kanban', icon: FolderKanban },
        { href: '/projects/proj-apex-launch/launch-check', label: 'Checklist 20-Pts', icon: CheckCircle2 },
        { href: '/content-planner', label: 'Social & Reels', icon: Share2 },
      ],
    },
    {
      title: 'ÉQUIPE & ACADÉMIE',
      items: [
        { href: '/team', label: 'Répertoire Équipe', icon: UserCheck },
        { href: '/team/team-alex/performance', label: 'Fiche 1-on-1 & OKRs', icon: Sparkles },
        { href: '/academy', label: 'Académie LMS & SOPs', icon: GraduationCap },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 bg-mv-surface border-r border-mv-border flex flex-col justify-between transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      {/* Sidebar Header / Brand */}
      <div>
        <div className="h-16 px-4 border-b border-mv-border flex items-center justify-between">
          <Link href="/overview" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-mv-green-tint border border-mv-green/40 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-mv-green animate-mv-leaf-breathe" />
            </div>
            {!collapsed && (
              <div className="flex flex-col whitespace-nowrap">
                <span className="font-extrabold text-sm tracking-tight text-mv-ink">
                  MINERVA <span className="text-mv-green">CENTURIONS</span>
                </span>
                <span className="text-[10px] font-semibold text-mv-lime tracking-widest uppercase">
                  COCKPIT IN-HOUSE
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-mv-cream-soft text-mv-ink-soft hover:text-mv-ink hover:bg-mv-border/40 transition-colors shrink-0 cursor-pointer"
            title={collapsed ? 'Déplier la sidebar' : 'Rétracter la sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {domainGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 py-1.5 text-[11px] font-bold text-mv-ink-faint tracking-wider uppercase">
                  {group.title}
                </div>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/overview' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 group ${
                        isActive
                          ? 'bg-mv-green text-mv-cream shadow-mv-sm font-bold'
                          : 'text-mv-ink-soft hover:bg-mv-cream-soft hover:text-mv-ink'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-mv-lime' : 'text-mv-ink-faint group-hover:text-mv-green'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Profile Status */}
      <div className="p-3 border-t border-mv-border bg-mv-cream-soft/30">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-mv-surface border border-mv-border">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-mv-green text-mv-cream flex items-center justify-center font-bold text-xs">
              AT
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-mv-green border-2 border-mv-surface" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-mv-ink truncate">Alex Tremblay</span>
              <span className="text-[10px] text-mv-ink-soft truncate">Admin • Tech & IA</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
