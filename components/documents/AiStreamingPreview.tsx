'use client';

import React from 'react';
import {
  Sparkles,
  Check,
  RotateCcw,
  Scissors,
  Maximize2,
  X,
  ArrowDownToLine,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AiStreamingPreviewProps {
  streamText: string;
  isStreaming: boolean;
  onAccept: () => void;
  onInsertBelow?: () => void;
  onRetry: () => void;
  onRefine: (refinement: 'shorter' | 'longer') => void;
  onDiscard: () => void;
  className?: string;
}

export function AiStreamingPreview({
  streamText,
  isStreaming,
  onAccept,
  onInsertBelow,
  onRetry,
  onRefine,
  onDiscard,
  className,
}: AiStreamingPreviewProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg border border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-lg p-3.5 space-y-3 transition-all animate-in fade-in zoom-in-95 duration-150',
        className
      )}
    >
      {/* ── Status Header ── */}
      <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/60 pb-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
          <Sparkles className={cn('w-4 h-4 text-emerald-500', isStreaming && 'animate-spin')} />
          <span>{isStreaming ? 'Génération IA en cours…' : 'Proposition IA prête'}</span>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Streaming…</span>
          </div>
        )}
      </div>

      {/* ── Streaming Content Box ── */}
      <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 text-xs leading-relaxed max-h-96 overflow-y-auto pr-1">
        {streamText ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown>
        ) : (
          <div className="text-zinc-400 italic py-2">Initialisation de la réponse…</div>
        )}
        {isStreaming && <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-1 animate-pulse" />}
      </div>

      {/* ── Action Toolbar (Active when streaming completes or readable) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onAccept}
            disabled={!streamText.trim() || isStreaming}
            className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Conserver</span>
          </button>

          {onInsertBelow && (
            <button
              type="button"
              onClick={onInsertBelow}
              disabled={!streamText.trim() || isStreaming}
              className="px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Insérer en dessous</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRetry}
            disabled={isStreaming}
            className="px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onRefine('shorter')}
            disabled={!streamText.trim() || isStreaming}
            title="Rendre plus court"
            className="p-1.5 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Scissors className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Plus court</span>
          </button>

          <button
            type="button"
            onClick={() => onRefine('longer')}
            disabled={!streamText.trim() || isStreaming}
            title="Développer davantage"
            className="p-1.5 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden sm:inline">Plus long</span>
          </button>

          <button
            type="button"
            onClick={onDiscard}
            className="px-2.5 py-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Rejeter</span>
          </button>
        </div>
      </div>
    </div>
  );
}
