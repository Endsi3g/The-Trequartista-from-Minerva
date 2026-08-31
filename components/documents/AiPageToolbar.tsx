'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  CheckSquare,
  Languages,
  X,
  Copy,
  Check,
  ArrowUpToLine,
  ArrowDownToLine,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotionAiStream } from '@/hooks/use-notion-ai-stream';
import { blocksToMarkdown, markdownToBlocks } from '@/components/documents/utils';
import type { DocumentBlock } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AiPageToolbarProps {
  blocks: DocumentBlock[];
  documentTitle?: string;
  onApplyBlocks: (newBlocks: DocumentBlock[], mode: 'prepend' | 'append' | 'replace') => void;
  className?: string;
}

export function AiPageToolbar({
  blocks,
  documentTitle,
  onApplyBlocks,
  className,
}: AiPageToolbarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeActionLabel, setActiveActionLabel] = useState('');
  const [copied, setCopied] = useState(false);
  const { streamText, isStreaming, error, startStream, resetStream } = useNotionAiStream();

  const handleRunPageAction = (
    action: 'summarize' | 'extract_todos' | 'translate',
    label: string,
    targetLanguage?: 'fr' | 'en' | 'es'
  ) => {
    setActiveActionLabel(label);
    setModalOpen(true);
    resetStream();

    const fullDocMarkdown = blocksToMarkdown(blocks, documentTitle);
    startStream({
      action,
      contextText: fullDocMarkdown,
      targetLanguage,
      workspace: 'documents',
    });
  };

  const handleApply = (mode: 'prepend' | 'append' | 'replace') => {
    if (!streamText.trim()) return;
    const generatedBlocks = markdownToBlocks(streamText);
    onApplyBlocks(generatedBlocks, mode);
    setModalOpen(false);
    resetStream();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(streamText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* ── Toolbar Pills ── */}
      <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mr-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Actions IA :</span>
        </span>

        <button
          type="button"
          onClick={() => handleRunPageAction('summarize', 'Résumé exécutif du document')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-medium transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>Résumer la page</span>
        </button>

        <button
          type="button"
          onClick={() => handleRunPageAction('extract_todos', 'Extraction des actions & checklists')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs font-medium transition-colors cursor-pointer"
        >
          <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
          <span>Extraire les tâches</span>
        </button>

        <div className="relative group/lang inline-block">
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-purple-600" />
            <span>Traduire</span>
          </button>
          <div className="hidden group-hover/lang:flex flex-col absolute left-0 top-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-xl p-1 z-50 min-w-32">
            <button
              type="button"
              onClick={() => handleRunPageAction('translate', 'Traduction vers Anglais (EN)', 'en')}
              className="text-left px-2 py-1 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded cursor-pointer"
            >
              🇬🇧 En Anglais
            </button>
            <button
              type="button"
              onClick={() => handleRunPageAction('translate', 'Traduction vers Français (FR)', 'fr')}
              className="text-left px-2 py-1 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded cursor-pointer"
            >
              🇫🇷 En Français
            </button>
            <button
              type="button"
              onClick={() => handleRunPageAction('translate', 'Traduction vers Espagnol (ES)', 'es')}
              className="text-left px-2 py-1 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded cursor-pointer"
            >
              🇪🇸 En Espagnol
            </button>
          </div>
        </div>
      </div>

      {/* ── Output Modal / Drawer ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{activeActionLabel}</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">Modèle Gemini 3.6 Flash</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  resetStream();
                }}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 prose prose-sm dark:prose-invert max-w-none">
              {error && (
                <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
              {streamText ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown>
              ) : (
                !error && (
                  <div className="flex items-center justify-center py-12 text-zinc-400">
                    <Sparkles className="w-5 h-5 text-emerald-500 animate-spin mr-2" />
                    <span>Analyse et génération par l&apos;IA…</span>
                  </div>
                )
              )}
              {isStreaming && <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-1 animate-pulse" />}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-b-xl">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!streamText.trim()}
                  className="px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1 hover:bg-zinc-100 cursor-pointer disabled:opacity-40"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApply('prepend')}
                  disabled={!streamText.trim() || isStreaming}
                  className="px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-100 cursor-pointer disabled:opacity-40"
                >
                  <ArrowUpToLine className="w-3.5 h-3.5" />
                  <span>En tête de page</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApply('append')}
                  disabled={!streamText.trim() || isStreaming}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-40"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>En fin de page</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
