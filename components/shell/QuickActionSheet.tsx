'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target,
  CheckSquare,
  Sparkles,
  FileText,
  X,
  ArrowRight,
} from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickActionSheet({ isOpen, onClose }: QuickActionSheetProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (callback: () => void) => {
    triggerHaptic('light');
    onClose();
    callback();
  };

  const actions = [
    {
      id: 'lead',
      title: 'Nouveau Lead CRM',
      subtitle: 'Ajouter et qualifier un prospect dans le pipeline',
      icon: Target,
      colorClass: 'text-[#0c8c5e] bg-[#ecfdf5] border-[#a7f3d0]',
      onClick: () => router.push('/leads'),
    },
    {
      id: 'task',
      title: 'Nouvelle Tâche',
      subtitle: 'Créer un livrable avec priorité et assignation',
      icon: CheckSquare,
      colorClass: 'text-[#2563eb] bg-blue-50 border-blue-200',
      onClick: () => router.push('/tasks'),
    },
    {
      id: 'ai',
      title: 'Assistant IA Minerva',
      subtitle: 'Ouvrir le copilote pour exécuter une requête (⌘J)',
      icon: Sparkles,
      colorClass: 'text-[#7c3aed] bg-purple-50 border-purple-200',
      onClick: () => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'j', metaKey: true, bubbles: true })
        );
      },
    },
    {
      id: 'proposal',
      title: 'Nouveau Devis / Proposition',
      subtitle: 'Générer un devis avec acompte 50% et signature',
      icon: FileText,
      colorClass: 'text-[#d97706] bg-amber-50 border-amber-200',
      onClick: () => router.push('/proposals'),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Container */}
      <div className="relative w-full max-w-lg bg-white border border-[#f2f2f2] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom,34px))] z-10 animate-in slide-in-from-bottom-4 duration-200">
        {/* Drag Handle */}
        <div className="w-10 h-1 bg-zinc-200 rounded mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2] mb-4">
          <div>
            <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider" style={MONO}>
              ACCÈS RAPIDE AU POUCE
            </div>
            <h3 className="text-sm font-semibold text-[#08090a]">Actions Rapides Minerva</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded border border-[#f2f2f2] hover:bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-2">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => handleAction(act.onClick)}
                className="w-full p-3 rounded-2xl border border-[#f2f2f2] hover:border-[#dddddd] hover:bg-zinc-50/60 transition-all flex items-center justify-between gap-3 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'w-9 h-9 rounded border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                      act.colorClass
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#08090a] group-hover:text-black">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">{act.subtitle}</div>
                  </div>
                </div>

                <div className="w-6 h-6 rounded flex items-center justify-center text-zinc-300 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all shrink-0">
                  <ArrowRight size={13} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
