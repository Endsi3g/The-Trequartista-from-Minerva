'use client';

import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { TopbarActions } from './TopbarActions';
import { AppBreadcrumb } from './AppBreadcrumb';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-mv-surface text-mv-ink flex">
      {/* Retractable Sidebar */}
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'pl-[68px]' : 'pl-[260px]'
        }`}
      >
        {/* Top Header */}
        <header className="h-16 px-6 bg-mv-cream-soft/80 backdrop-blur-md border-b border-mv-border sticky top-0 z-20 flex items-center justify-between">
          {/* Left: Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <AppBreadcrumb />
          </div>

          {/* Right: Actions */}
          <TopbarActions />
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
