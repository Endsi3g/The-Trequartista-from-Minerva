'use client';

import React, { useEffect, useState } from 'react';
import { Share, PlusSquare, X, Download, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'minerva-pwa-prompt-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check if already installed / standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // 2. Check if previously dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isIosSafari = isIosDevice && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);

    if (isIosSafari) {
      setIsIOS(true);
      setShowBanner(true);
      return;
    }

    // 4. Capture beforeinstallprompt for Android & Chromium browsers
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic('success');
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    setShowBanner(false);
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {}
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-16 md:bottom-4 left-3 right-3 md:left-auto md:right-4 z-40 max-w-sm bg-white/95 backdrop-blur-md border border-emerald-300 rounded-[8px] p-3.5 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[6px] bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            M
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <span>Installer l&apos;application</span>
              <Sparkles className="w-3 h-3 text-emerald-600" />
            </h3>
            <p className="text-[11px] text-zinc-500 leading-snug">
              Accès rapide au tableau de bord sans barre d&apos;adresse
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fermer"
          className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isIOS ? (
        <div className="mt-2.5 pt-2 border-t border-zinc-100 text-[11px] text-zinc-600 flex items-center gap-1.5 flex-wrap">
          <span>Appuyez sur</span>
          <span className="inline-flex items-center gap-0.5 font-semibold text-zinc-900 bg-zinc-100 px-1 py-0.5 rounded">
            <Share className="w-3 h-3 text-blue-600" /> Partager
          </span>
          <span>puis</span>
          <span className="inline-flex items-center gap-0.5 font-semibold text-zinc-900 bg-zinc-100 px-1 py-0.5 rounded">
            <PlusSquare className="w-3 h-3 text-zinc-800" /> Sur l&apos;écran d&apos;accueil
          </span>
        </div>
      ) : (
        <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="text-[11px] text-zinc-500 hover:text-zinc-700 px-2 py-1 cursor-pointer"
          >
            Plus tard
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="h-7 px-3 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3 h-3" />
            <span>Installer maintenant</span>
          </button>
        </div>
      )}
    </div>
  );
}
