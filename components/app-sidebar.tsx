'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  Users,
  FolderKanban,
  Share2,
  GraduationCap,
  UserCheck,
  Zap,
  Settings,
  Plus,
  Minus,
  UserPlus,
  Gift,
  ChevronRight,
} from 'lucide-react';

import { SearchForm } from '@/components/search-form';
import { Logo, LogoMark } from '@/components/shell/Logo';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

// Navigation catalog matching Bonsai Design System (Image 2)
const navData = {
  navMain: [
    {
      title: 'Dashboard & Clients',
      icon: LayoutDashboard,
      url: '/overview',
      items: [
        { title: "Vue d'ensemble", url: '/overview', icon: LayoutDashboard },
        { title: 'CRM Leads & Sales', url: '/leads', icon: Target },
        { title: 'Portefeuille Clients', url: '/clients', icon: Users },
      ],
    },
    {
      title: 'Tools & Opérations',
      icon: FolderKanban,
      url: '/projects',
      items: [
        { title: 'Pipeline Projets', url: '/projects', icon: FolderKanban },
        { title: 'Planificateur Contenu', url: '/content-planner', icon: Share2 },
        { title: 'Base de Connaissances & SOPs', url: '/academy', icon: GraduationCap },
      ],
    },
    {
      title: 'Équipe & Paramètres',
      icon: UserCheck,
      url: '/team',
      items: [
        { title: 'Membres & Équipe', url: '/team', icon: UserCheck },
        { title: 'Mon Profil & OKRs', url: '/profil', icon: Users },
        { title: 'Intégrations Notion', url: '/integrations', icon: Zap },
        { title: 'Paramètres & Facturation', url: '/settings/billing', icon: Settings },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="bg-white border-r border-mv-border" {...props}>
      {/* ── Sidebar Header ── */}
      <SidebarHeader className="p-3 border-b border-mv-border/60">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-mv-surface transition-colors">
              <Link href="/overview" className="flex items-center gap-2.5">
                {isCollapsed ? <LogoMark size={28} /> : <Logo size={28} />}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!isCollapsed && (
          <div className="mt-2">
            <SearchForm />
          </div>
        )}
      </SidebarHeader>

      {/* ── Sidebar Main Navigation (Sidebar-05 Collapsible Groups) ── */}
      <SidebarContent className="p-2 space-y-3">
        {navData.navMain.map((group, groupIdx) => (
          <SidebarGroup key={group.title} className="p-0">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[10px] font-extrabold uppercase tracking-widest text-mv-ink-faint px-2 py-1">
                {group.title}
              </SidebarGroupLabel>
            )}
            <SidebarMenu>
              {group.items.map((subItem) => {
                const SubIcon = subItem.icon;
                const isActive = pathname === subItem.url;
                return (
                  <SidebarMenuItem key={subItem.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={subItem.title}
                      isActive={isActive}
                      className={
                        isActive
                          ? 'bg-[#00a800] text-white font-bold hover:bg-[#009000] hover:text-white shadow-mv-sm'
                          : 'text-mv-ink-soft hover:bg-mv-surface hover:text-mv-ink font-medium'
                      }
                    >
                      <Link href={subItem.url} className="flex items-center gap-2.5">
                        <SubIcon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-mv-ink-faint'}`} />
                        <span className="truncate text-xs">{subItem.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── Sidebar Footer (Image 2 - Invite Team & Upgrade) ── */}
      {!isCollapsed && (
        <SidebarFooter className="p-3 border-t border-mv-border/60 space-y-2">
          <Link
            href="/team"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-mv-border bg-mv-surface text-xs font-semibold text-mv-ink hover:bg-mv-border/40 transition-colors shadow-mv-sm"
          >
            <UserPlus className="w-4 h-4 text-mv-green" />
            <span>Invite Team</span>
          </Link>

          <Link
            href="/settings/billing"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-mv-green-tint border border-mv-green/30 text-xs font-bold text-mv-green hover:bg-mv-green/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <span>Get 1 Month Free</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </SidebarFooter>
      )}

      {/* Resizable Rail */}
      <SidebarRail />
    </Sidebar>
  );
}
