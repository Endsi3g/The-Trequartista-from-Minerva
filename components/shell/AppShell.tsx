'use client';

import React from 'react';
import { PanelLeft } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { TopbarActions } from './TopbarActions';
import { AppBreadcrumb } from './AppBreadcrumb';
import { ShortcutsModal } from '@/components/ui/shortcuts-modal';
import { SidebarStateProvider, useSidebarState } from './SidebarState';

interface AppShellProps {
  children: React.ReactNode;
}

function SidebarTrigger() {
  const { toggleCollapsed } = useSidebarState();
  return (
    <button
      onClick={toggleCollapsed}
      aria-label="Afficher/masquer la navigation"
      title="Afficher/masquer la navigation"
      className="text-mv-ink-soft hover:text-mv-ink hover:bg-mv-surface rounded-xl p-2 cursor-pointer shrink-0"
    >
      <PanelLeft className="w-4 h-4" />
    </button>
  );
}

function AppShellInner({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-mv-surface text-mv-ink flex w-full relative font-sans">
      <AppSidebar />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 px-4 md:px-6 bg-white/90 backdrop-blur-md border-b border-mv-border sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger />
            <div className="hidden sm:block min-w-0">
              <AppBreadcrumb />
            </div>
          </div>
          <TopbarActions />
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Keyboard Shortcuts Modal Helper */}
      <ShortcutsModal />
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarStateProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarStateProvider>
  );
}
