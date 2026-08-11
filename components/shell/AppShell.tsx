'use client';

import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { TopbarActions } from './TopbarActions';
import { AppBreadcrumb } from './AppBreadcrumb';
import { ShortcutsModal } from '@/components/ui/ShortcutsModal';
import { UserFeedbackModal } from '@/components/ui/UserFeedbackModal';
import { Menu, X, Maximize2, Minimize2 } from 'lucide-react';


interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <div className="min-h-screen bg-mv-surface text-mv-ink flex relative">
      {/* Desktop Retractable Sidebar (hidden on small mobile screens) */}
      <div className="hidden md:block">
        <AppSidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-mv-ink/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative flex-1 max-w-xs w-full bg-mv-cream-soft border-r border-mv-border z-10 flex flex-col animate-mv-scale-in">
            <div className="h-16 px-4 border-b border-mv-border flex items-center justify-between">
              <span className="font-extrabold text-sm text-mv-ink font-display">Navigation Minerva</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-mv-ink-soft hover:text-mv-ink hover:bg-mv-border/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <AppSidebar collapsed={false} onToggleCollapse={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'md:pl-[68px]' : 'md:pl-[260px]'
        }`}
      >
        {/* Top Header */}
        <header className="h-16 px-4 md:px-6 bg-mv-cream-soft/90 backdrop-blur-md border-b border-mv-border sticky top-0 z-20 flex items-center justify-between">
          {/* Left: Mobile Menu Toggle & Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-mv-cream border border-mv-border text-mv-ink-soft hover:text-mv-ink"
              title="Ouvrir le menu mobile"
            >
              <Menu className="w-5 h-5" />
            </button>
            <AppBreadcrumb />
          </div>

          {/* Right: Fullscreen Toggle & Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-mv-cream border border-mv-border text-mv-ink-soft hover:text-mv-ink transition-colors cursor-pointer hidden sm:flex items-center justify-center"
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
  );
}

