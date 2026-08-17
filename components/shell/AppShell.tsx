'use client';

import React from 'react';
import { PanelLeft } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { TopbarActions } from './TopbarActions';
import { AppBreadcrumb } from './AppBreadcrumb';
import { ChangelogBanner } from './ChangelogBanner';
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
    <div className="h-screen bg-mv-surface text-mv-ink flex flex-col w-full relative font-sans overflow-hidden">
      <ChangelogBanner />
      <div className="flex flex-1 w-full min-h-0">
        <AppSidebar />

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header -- solid background, no blur (a translucent/blurred
              header over scrolling content read as visually noisy). */}
          <header className="h-14 px-4 md:px-6 bg-mv-surface border-b border-mv-border sticky top-0 z-20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger />
              <div className="hidden sm:block min-w-0">
                <AppBreadcrumb />
              </div>
            </div>
            <TopbarActions />
          </header>

          {/* Page Content -- full width of whatever the sidebar leaves
              available, so collapsing it actually gives pages more room
              instead of just growing empty margins. Scrolls on its own so
              the sidebar footer never gets pushed off-screen by a tall page. */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full">
            {children}
          </main>
        </div>

        {/* Global Keyboard Shortcuts Modal Helper */}
        <ShortcutsModal />
      </div>
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
