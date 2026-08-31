'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Scissors,
  Maximize2,
  CheckCheck,
  Languages,
  FileText,
  Smile,
  ArrowRight,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NotionAiAction, NotionAiTone, NotionAiLength } from '@/lib/services/ai-stream';

export interface AiSelectionActionPayload {
  action: NotionAiAction;
  customInstruction?: string;
  tone?: NotionAiTone;
  length?: NotionAiLength;
  targetLanguage?: 'fr' | 'en' | 'es';
}

interface AiSelectionMenuProps {
  selectedText: string;
  onExecute: (payload: AiSelectionActionPayload) => void;
  onClose: () => void;
  className?: string;
}

export function AiSelectionMenu({
  selectedText,
  onExecute,
  onClose,
  className,
}: AiSelectionMenuProps) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeSubmenu, setActiveSubmenu] = useState<'tone' | 'translate' | null>(null);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    onExecute({
      action: 'rewrite',
      customInstruction: customPrompt.trim(),
    });
  };

  return (
    <div
      className={cn(
        'w-80 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 shadow-2xl shadow-zinc-950/20 p-1.5 space-y-1 text-xs text-zinc-700 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-100 z-50',
        className
      )}
    >
      {/* ── Custom Prompt Header ── */}
      <form onSubmit={handleCustomSubmit} className="relative flex items-center gap-1.5 p-1 border-b border-zinc-100 dark:border-zinc-800 mb-1">
        <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Demandez à l'IA de modifier ce texte…"
          className="w-full bg-transparent border-0 text-[11.5px] focus:outline-none focus:ring-0 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          autoFocus
        />
        {customPrompt ? (
          <button
            type="submit"
            className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shrink-0"
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </form>

      {/* ── Submenus or Quick Actions ── */}
      {activeSubmenu === 'tone' ? (
        <div className="space-y-0.5">
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Choisir un ton</span>
            <button
              type="button"
              onClick={() => setActiveSubmenu(null)}
              className="text-emerald-600 hover:underline cursor-pointer"
            >
              Retour
            </button>
          </div>
          {[
            { id: 'professional', label: 'Professionnel & Corporate' },
            { id: 'concise', label: 'Direct & Percutant' },
            { id: 'persuasive', label: 'Persuasif & Commercial' },
            { id: 'educational', label: 'Pédagogique & Clair' },
            { id: 'casual', label: 'Décontracté & Vivant' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                onExecute({
                  action: 'rewrite',
                  tone: t.id as NotionAiTone,
                  customInstruction: `Adopter un ton ${t.label}`,
                })
              }
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 text-left transition-colors cursor-pointer"
            >
              <span>{t.label}</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-600" />
            </button>
          ))}
        </div>
      ) : activeSubmenu === 'translate' ? (
        <div className="space-y-0.5">
          <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Traduire en</span>
            <button
              type="button"
              onClick={() => setActiveSubmenu(null)}
              className="text-emerald-600 hover:underline cursor-pointer"
            >
              Retour
            </button>
          </div>
          {[
            { id: 'en', label: '🇬🇧 Anglais (English)' },
            { id: 'fr', label: '🇫🇷 Français' },
            { id: 'es', label: '🇪🇸 Espagnol (Español)' },
          ].map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() =>
                onExecute({
                  action: 'translate',
                  targetLanguage: lang.id as 'en' | 'fr' | 'es',
                })
              }
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 text-left transition-colors cursor-pointer"
            >
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-0.5">
          {/* Quick AI Presets */}
          <button
            type="button"
            onClick={() =>
              onExecute({
                action: 'rewrite',
                customInstruction: 'Améliorer la qualité, la clarté et l’élégance du style sans altérer le sens',
              })
            }
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-300 text-left transition-colors cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Améliorer la rédaction</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onExecute({
                action: 'rewrite',
                length: 'shorter',
                customInstruction: 'Raccourcir et synthétiser pour aller droit au but',
              })
            }
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-300 text-left transition-colors cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5 text-blue-600" />
            <span>Raccourcir</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onExecute({
                action: 'rewrite',
                length: 'longer',
                customInstruction: 'Développer le propos avec plus de détails et de substance',
              })
            }
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-300 text-left transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Développer / Allonger</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onExecute({
                action: 'rewrite',
                customInstruction: 'Corriger rigoureusement toutes les fautes d’orthographe, de grammaire et de typographie',
              })
            }
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-300 text-left transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Corriger orthographe & grammaire</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubmenu('tone')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-300 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Smile className="w-3.5 h-3.5 text-amber-600" />
              <span>Changer le ton…</span>
            </div>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveSubmenu('translate')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-300 text-left transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Languages className="w-3.5 h-3.5 text-indigo-600" />
              <span>Traduire…</span>
            </div>
            <ChevronRight className="w-3 h-3 text-zinc-400" />
          </button>

          <button
            type="button"
            onClick={() => onExecute({ action: 'summarize' })}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-300 text-left transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>Résumer la sélection</span>
          </button>
        </div>
      )}
    </div>
  );
}
