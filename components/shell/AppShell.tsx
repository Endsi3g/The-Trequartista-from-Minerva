'use client';

import React, { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { TopbarActions } from './TopbarActions';
import { AppBreadcrumb } from './AppBreadcrumb';
import { ShortcutsModal } from '@/components/ui/shortcuts-modal';
import { UserFeedbackModal } from '@/components/ui/user-feedback-modal';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Maximize2, Minimize2 } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen bg-mv-surface text-mv-ink flex w-full relative font-sans">
        {/* Shadcn Sidebar-05 Component */}
        <AppSidebar />

        {/* Main Content Container */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 px-4 md:px-6 bg-white/90 backdrop-blur-md border-b border-mv-border sticky top-0 z-20 flex items-center justify-between">
            {/* Left: Sidebar Trigger & Breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="text-mv-ink-soft hover:text-mv-ink hover:bg-mv-surface rounded-xl p-2 cursor-pointer" />
              <AppBreadcrumb />
            </div>

            {/* Right: Fullscreen Toggle & Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-mv-surface border border-mv-border text-mv-ink-soft hover:text-mv-ink transition-colors cursor-pointer hidden sm:flex items-center justify-center"
                title={isFullscreen ? 'Quitter le mode plein écran' : 'Passer en plein écran'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-mv-green" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <TopbarActions />
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Global Keyboard Shortcuts Modal Helper */}
        <ShortcutsModal />

        {/* Global In-App User Feedback Widget */}
        <UserFeedbackModal />
      </div>
    </SidebarProvider>
  );
}
