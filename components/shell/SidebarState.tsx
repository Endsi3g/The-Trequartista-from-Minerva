'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarStateValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
  isMobile: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  closeOnNavigate: () => void;
}

const SidebarStateContext = createContext<SidebarStateValue | null>(null);

export function useSidebarState() {
  const ctx = useContext(SidebarStateContext);
  if (!ctx) throw new Error('useSidebarState must be used within SidebarStateProvider');
  return ctx;
}

const STORAGE_KEY = 'mv-sidebar-collapsed';

export function SidebarStateProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === '1') setCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    if (isMobile) {
      setMobileOpen((v) => !v);
      return;
    }
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  };

  const closeOnNavigate = () => {
    if (isMobile) setMobileOpen(false);
  };

  return (
    <SidebarStateContext.Provider
      value={{ collapsed, toggleCollapsed, isMobile, mobileOpen, setMobileOpen, closeOnNavigate }}
    >
      {children}
    </SidebarStateContext.Provider>
  );
}
