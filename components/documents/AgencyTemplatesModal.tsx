'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  FileCode2,
  CheckSquare,
  FileText,
  ArrowRight,
  Eye,
  Check,
} from 'lucide-react';
import { AGENCY_TEMPLATES, AgencyTemplate } from './templates';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  Sparkles,
  Calendar,
  FileCode2,
  CheckSquare,
  FileText,
};

interface AgencyTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: AgencyTemplate) => void;
  loading?: boolean;
}

export function AgencyTemplatesModal({
  isOpen,
  onClose,
  onSelect,
  loading = false,
}: AgencyTemplatesModalProps) {
  const [selectedKey, setSelectedKey] = useState<string>(AGENCY_TEMPLATES[0].key);

  if (!isOpen) return null;

  const currentTemplate = AGENCY_TEMPLATES.find((t) => t.key === selectedKey) || AGENCY_TEMPLATES[0];
  const IconComponent = ICON_MAP[currentTemplate.iconName] || FileText;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-white rounded-[8px] shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[4px] bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Modèles d&apos;Agence Minerva</h2>
              <p className="text-[11px] text-zinc-500">
                Démarrez avec une structure opérationnelle éprouvée et prête à l&apos;emploi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content: 2-column layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 min-h-0 overflow-hidden">
          {/* Left Column: Template Cards List (2 cols) */}
          <div className="md:col-span-2 border-r border-zinc-200 p-3 space-y-1.5 overflow-y-auto bg-zinc-50/30">
            {AGENCY_TEMPLATES.map((tmpl) => {
              const Icon = ICON_MAP[tmpl.iconName] || FileText;
              const isSelected = tmpl.key === selectedKey;

              return (
                <button
                  key={tmpl.key}
                  type="button"
                  onClick={() => setSelectedKey(tmpl.key)}
                  className={cn(
                    'w-full text-left p-3 rounded-[6px] border transition-all cursor-pointer space-y-1',
                    isSelected
                      ? 'bg-white border-emerald-500 shadow-xs ring-1 ring-emerald-500/20'
                      : 'bg-white/70 border-zinc-200/80 hover:bg-white hover:border-zinc-300'
                  )}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          'w-6 h-6 rounded flex items-center justify-center shrink-0 border',
                          isSelected
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-zinc-900 truncate">{tmpl.title}</span>
                    </div>
                    <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 shrink-0">
                      {tmpl.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 line-clamp-2 leading-snug pl-8">
                    {tmpl.subtitle}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Column: Template Preview (3 cols) */}
          <div className="md:col-span-3 p-4 flex flex-col min-h-0 bg-white overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <IconComponent className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900">{currentTemplate.title}</h3>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                {currentTemplate.defaultBlocks.length} blocs configurés
              </span>
            </div>

            {/* Scrollable preview area */}
            <div className="flex-1 overflow-y-auto my-3 p-3 rounded-[6px] bg-zinc-50 border border-zinc-200 text-zinc-800 space-y-2 text-[12px]">
              <p className="text-[11px] text-zinc-500 italic pb-2 border-b border-zinc-200">
                {currentTemplate.description}
              </p>
              {currentTemplate.defaultBlocks.map((block) => (
                <div key={block.id} className="space-y-0.5">
                  {block.type.startsWith('heading_') ? (
                    <div className="font-bold text-zinc-900 pt-1 text-[12.5px] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>{block.content}</span>
                    </div>
                  ) : block.type === 'callout' ? (
                    <div className="p-2 rounded bg-white border border-zinc-200 text-[11.5px] text-zinc-700">
                      {block.content}
                    </div>
                  ) : block.type === 'todo_list' ? (
                    <div className="flex items-center gap-2 text-[11.5px] text-zinc-700">
                      <div
                        className={cn(
                          'w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center',
                          block.checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-zinc-300'
                        )}
                      >
                        {block.checked && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span>{block.content}</span>
                    </div>
                  ) : (
                    <p className="text-[11.5px] text-zinc-600 leading-relaxed">{block.content}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer action */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">Prêt à être personnalisé</span>
              <button
                type="button"
                onClick={() => onSelect(currentTemplate)}
                disabled={loading}
                className="h-8 px-4 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <span>{loading ? 'Création en cours…' : 'Créer depuis ce modèle'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
