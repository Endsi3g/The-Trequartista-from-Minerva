'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnectedBanner, setShowReconnectedBanner] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnectedBanner(true);
      const timer = setTimeout(() => setShowReconnectedBanner(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnectedBanner(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Offline banner
  if (!isOnline) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] px-3.5 py-1.5 rounded bg-zinc-900/95 text-white border border-zinc-700 shadow-xl backdrop-blur-md flex items-center justify-center gap-2 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
        <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="font-medium text-[11.5px]">Mode hors-ligne actif</span>
        <span className="text-zinc-400 text-[10.5px]">• Données en cache</span>
      </div>
    );
  }

  // Brief reconnected confirmation
  if (showReconnectedBanner) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] px-3.5 py-1.5 rounded bg-emerald-900/95 text-white border border-emerald-700 shadow-xl backdrop-blur-md flex items-center justify-center gap-2 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
        <Wifi className="w-3.5 h-3.5 text-emerald-300" />
        <span className="font-medium text-[11.5px]">Connexion rétablie</span>
        <span className="text-emerald-300 text-[10.5px]">• Synchronisation…</span>
      </div>
    );
  }

  return null;
}
