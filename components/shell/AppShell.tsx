'use client';

import React from 'react';
import { PanelLeft } from 'lucide-react';
import { AppSidebar } from '@/components/app-sidebar';
import { TopbarActions } from './TopbarActions';
import { AppBreadcrumb } from './AppBreadcrumb';
import { ChangelogBanner } from './ChangelogBanner';
import { ShortcutsModal } from '@/components/ui/shortcuts-modal';
import { MobileBottomNav } from './MobileBottomNav';
import { OfflineStatusIndicator } from '@/components/ui/OfflineStatusIndicator';
import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner';
import { SidebarStateProvider, useSidebarState } from './SidebarState';

import { AiAssistantSpeedDial } from './AiAssistantSpeedDial';

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
    <div className="h-screen bg-mv-cream-soft text-mv-ink flex flex-col w-full relative font-sans overflow-hidden">
      {/* Non-intrusive offline/online network status indicator */}
      <OfflineStatusIndicator />

      <ChangelogBanner />
      <div className="flex flex-1 w-full min-h-0">
        <AppSidebar />

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-14 px-4 md:px-6 bg-mv-surface border-b border-mv-border sticky top-0 z-20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger />
              <div className="hidden sm:block min-w-0">
                <AppBreadcrumb />
              </div>
            </div>
            <TopbarActions />
          </header>

          {/* Page Content -- pb-20 on mobile leaves room for MobileBottomNav */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 pb-20 md:pb-8 w-full min-w-0 transition-all duration-200 ease-in-out">
            {children}
          </main>
        </div>

        {/* Global Keyboard Shortcuts Modal Helper */}
        <ShortcutsModal />

        {/* Universal Floating AI Assistant SpeedDial */}
        <AiAssistantSpeedDial />

        {/* Smart Guided PWA Installation Banner */}
        <PwaInstallBanner />

        {/* Mobile Fixed Bottom Navigation Bar (md:hidden) */}
        <MobileBottomNav />
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
