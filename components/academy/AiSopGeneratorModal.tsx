'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, X, Loader2, Check, FileText } from 'lucide-react';
import { useNotionAiStream } from '@/hooks/use-notion-ai-stream';
import { markdownToBlocks } from '@/components/documents/utils';
import type { DocumentBlock, AcademySOP } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AiSopGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: {
    title: string;
    description: string;
    category: AcademySOP['category'];
    blocks: DocumentBlock[];
  }) => void;
}

export function AiSopGeneratorModal({ isOpen, onClose, onApply }: AiSopGeneratorModalProps) {
  const [topic, setTopic] = useState('');
  const [targetRole, setTargetRole] = useState('Développeur / Ingénieur');
  const [category, setCategory] = useState<AcademySOP['category']>('IA & Ingénierie');
  const { streamText, isStreaming, error, startStream, resetStream } = useNotionAiStream();

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!topic.trim() || isStreaming) return;
    resetStream();

    const prompt = `Rédiger une SOP d'excellence pour l'agence Minerva.
Sujet : ${topic}
Destinataire / Rôle cible : ${targetRole}
Catégorie : ${category}

Structure obligatoire de la SOP :
# SOP : ${topic}

> [!NOTE]
> Objectif stratégique de cette procédure pour l'agence et critères de succès.

## 1. Prérequis & Accès
- Outils nécessaires, variables d'environnement, permissions requises.

## 2. Procédure Pas-à-Pas
1. Étape 1 détaillée avec actions précises.
2. Étape 2 détaillée.
3. Étape 3 détaillée.

## 3. Checklist de Contrôle Qualité
- [ ] Vérification 1
- [ ] Vérification 2
- [ ] Vérification 3

## 4. Pièges Fréquents & Bonnes Pratiques
> [!WARNING]
> Erreurs courantes à éviter absolument.

> [!TIP]
> Astuces pour accélérer l'exécution.`;

    startStream({
      action: 'generate',
      prompt,
      workspace: 'academy',
    });
  };

  const handleAccept = () => {
    if (!streamText.trim()) return;
    const parsedBlocks = markdownToBlocks(streamText);
    // Extract title from first heading or topic
    const firstH1 = parsedBlocks.find((b) => b.type === 'heading_1');
    const sopTitle = firstH1 ? firstH1.content.replace(/^SOP\s*:\s*/i, '') : topic;
    const description = `Guide opérationnel : ${topic}. Établi selon les standards d'excellence Minerva.`;

    onApply({
      title: sopTitle,
      description,
      category,
      blocks: parsedBlocks,
    });
    onClose();
    resetStream();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Générateur de SOP par l&apos;IA (Notion AI)
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">Modèle Gemini 3.6 Flash</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              resetStream();
            }}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Configuration inputs */}
        <div className="p-4 space-y-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Sujet ou procédure à documenter
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Déploiement d'un agent vocal ElevenLabs, Onboarding client Flow…"
                disabled={isStreaming}
                className="flex-1 px-3 py-1.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!topic.trim() || isStreaming}
                className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
              >
                {isStreaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Générer</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AcademySOP['category'])}
                className="w-full px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Onboarding">Onboarding</option>
                <option value="IA & Ingénierie">IA &amp; Ingénierie</option>
                <option value="Vente & Prospection">Vente &amp; Prospection</option>
                <option value="Delivery & Projets">Delivery &amp; Projets</option>
                <option value="Admin & Finance">Admin &amp; Finance</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Rôle cible</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Ex: Closer, Développeur Fullstack…"
                className="w-full px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Streaming / Output Area */}
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
              <div className="flex flex-col items-center justify-center py-10 text-zinc-400 text-center space-y-2">
                <FileText className="w-8 h-8 text-zinc-300 stroke-[1.5]" />
                <p className="text-xs">
                  Entrez un sujet ci-dessus et cliquez sur &quot;Générer&quot; pour créer automatiquement la structure complète de la SOP.
                </p>
              </div>
            )
          )}
          {isStreaming && <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-1 animate-pulse" />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 rounded-b-xl">
          <button
            type="button"
            onClick={() => {
              onClose();
              resetStream();
            }}
            className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-100 cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleAccept}
            disabled={!streamText.trim() || isStreaming}
            className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Appliquer cette SOP au formulaire</span>
          </button>
        </div>
      </div>
    </div>
  );
}
