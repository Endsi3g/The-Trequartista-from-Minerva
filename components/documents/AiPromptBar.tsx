'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  X,
  FileText,
  Rocket,
  Lightbulb,
  Briefcase,
  Mail,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NotionAiTone, NotionAiLength } from '@/lib/services/ai-stream';

interface AiPromptBarProps {
  onGenerate: (prompt: string, tone?: NotionAiTone, length?: NotionAiLength) => void;
  onClose: () => void;
  isStreaming?: boolean;
  initialPrompt?: string;
  className?: string;
}

const QUICK_PROMPTS = [
  {
    icon: FileText,
    label: 'Rédiger un SOP',
    prompt: 'Rédiger une procédure opérationnelle standardisée (SOP) complète avec objectif, prérequis, étapes numérotées, checklist et pièges à éviter pour :',
  },
  {
    icon: Rocket,
    label: 'Plan de projet & jalons',
    prompt: 'Créer un plan de déploiement projet structuré avec phases, livrables clairs, checklist qualité et échéancier pour :',
  },
  {
    icon: Briefcase,
    label: 'Proposition commerciale',
    prompt: 'Rédiger une proposition commerciale persuasive avec diagnostic, solution sur-mesure, livrables, tarification et ROI pour :',
  },
  {
    icon: Lightbulb,
    label: 'Brainstorming & Idées',
    prompt: 'Générer 5 idées novatrices et actionnables avec avantages, inconvénients et plan de test rapide pour :',
  },
  {
    icon: Mail,
    label: 'Email de relance client',
    prompt: 'Écrire un email de relance professionnel, chaleureux et percutant pour :',
  },
];

export function AiPromptBar({
  onGenerate,
  onClose,
  isStreaming = false,
  initialPrompt = '',
  className,
}: AiPromptBarProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [tone, setTone] = useState<NotionAiTone>('professional');
  const [length, setLength] = useState<NotionAiLength>('standard');
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isStreaming) return;
    onGenerate(prompt.trim(), tone, length);
  };

  const handleSelectQuickPrompt = (prefix: string) => {
    setPrompt(prefix + ' ');
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-lg border border-emerald-500/30 bg-gradient-to-b from-white to-emerald-50/20 dark:from-zinc-900 dark:to-zinc-950 shadow-xl shadow-emerald-500/5 p-3 space-y-2.5 transition-all animate-in fade-in zoom-in-95 duration-150',
        className
      )}
    >
      {/* ── Top Header / Input ── */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center gap-2 px-3 py-2 rounded-md bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isStreaming}
            placeholder="Demandez à l'IA d'écrire, résumer, structurer… (ou tapez Esc pour fermer)"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
            className="w-full text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 bg-transparent border-0 focus:outline-none focus:ring-0"
          />
          {prompt && (
            <button
              type="button"
              onClick={() => setPrompt('')}
              className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Options toggle */}
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          title="Paramètres de ton & longueur"
          className={cn(
            'px-2.5 py-2 rounded-md border text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0',
            showOptions
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300'
              : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50'
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Options</span>
          <ChevronDown className={cn('w-3 h-3 transition-transform', showOptions && 'rotate-180')} />
        </button>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!prompt.trim() || isStreaming}
          className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer shrink-0"
        >
          <span>Générer</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </form>

      {/* ── Advanced Options (Tone & Length) ── */}
      {showOptions && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Ton :</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as NotionAiTone)}
              className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="professional">Professionnel & rigoureux</option>
              <option value="concise">Direct & tranchant</option>
              <option value="persuasive">Persuasif & commercial</option>
              <option value="educational">Pédagogique & détaillé</option>
              <option value="casual">Accessible & dynamique</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Longueur :</span>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as NotionAiLength)}
              className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="standard">Standard (équilibré)</option>
              <option value="shorter">Synthétique (court)</option>
              <option value="longer">Détaillé (complet)</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Quick Prompts Suggestions Chips ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 shrink-0">
          Suggestions :
        </span>
        {QUICK_PROMPTS.map((qp, idx) => {
          const Icon = qp.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectQuickPrompt(qp.prompt)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-600 dark:text-zinc-300 hover:text-emerald-800 dark:hover:text-emerald-300 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-300 text-[11px] font-medium transition-all shrink-0 cursor-pointer"
            >
              <Icon className="w-3 h-3 text-emerald-500" />
              <span>{qp.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
