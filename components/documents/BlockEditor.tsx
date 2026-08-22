'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  AlertCircle,
  Code,
  Table as TableIcon,
  Minus,
  Plus,
  Trash2,
  Copy,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { DocumentBlock, DocumentBlockType } from '@/lib/types';
import { generateBlockId } from './utils';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface BlockEditorProps {
  blocks: DocumentBlock[];
  onChange: (blocks: DocumentBlock[]) => void;
  readOnly?: boolean;
  activeEditorName?: string | null;
}

interface SlashCommandItem {
  type: DocumentBlockType;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  calloutType?: 'info' | 'warning' | 'tip' | 'note';
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  { type: 'paragraph', label: 'Texte / Paragraphe', desc: 'Texte simple multi-lignes', icon: Type },
  { type: 'heading_1', label: 'Titre 1 (H1)', desc: 'Grand titre de section', icon: Heading1 },
  { type: 'heading_2', label: 'Titre 2 (H2)', desc: 'Sous-titre moyen', icon: Heading2 },
  { type: 'heading_3', label: 'Titre 3 (H3)', desc: 'Petit sous-titre de détail', icon: Heading3 },
  { type: 'todo_list', label: 'Liste de tâches', desc: 'Case à cocher interactive', icon: CheckSquare },
  { type: 'bullet_list', label: 'Liste à puces', desc: 'Liste à points simple', icon: List },
  { type: 'numbered_list', label: 'Liste numérotée', desc: 'Liste ordonnée 1, 2, 3…', icon: ListOrdered },
  { type: 'callout', label: 'Encadré Info (Bleu)', desc: 'Message d\'information', icon: Info, calloutType: 'info' },
  { type: 'callout', label: 'Encadré Conseil / Tip (Vert)', desc: 'Astuce ou bonne pratique', icon: Lightbulb, calloutType: 'tip' },
  { type: 'callout', label: 'Encadré Alerte (Ambre)', desc: 'Avertissement ou point critique', icon: AlertTriangle, calloutType: 'warning' },
  { type: 'callout', label: 'Encadré Note (Gris)', desc: 'Note contextuelle générale', icon: AlertCircle, calloutType: 'note' },
  { type: 'quote', label: 'Citation', desc: 'Citation avec barre latérale', icon: Quote },
  { type: 'code_block', label: 'Bloc de code', desc: 'Extrait de code ou JSON', icon: Code },
  { type: 'table', label: 'Tableau', desc: 'Grille de données éditable', icon: TableIcon },
  { type: 'divider', label: 'Séparateur', desc: 'Ligne de séparation horizontale', icon: Minus },
];

export function BlockEditor({ blocks, onChange, readOnly = false, activeEditorName }: BlockEditorProps) {
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const blockRefs = useRef<(HTMLTextAreaElement | HTMLInputElement | null)[]>([]);
  const slashMenuRef = useRef<HTMLDivElement | null>(null);

  // Auto-resize textarea elements
  const adjustHeight = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 28)}px`;
  }, []);

  useEffect(() => {
    blockRefs.current.forEach((el) => {
      if (el instanceof HTMLTextAreaElement) {
        adjustHeight(el);
      }
    });
  }, [blocks, adjustHeight]);

  const updateBlock = (index: number, updates: Partial<DocumentBlock>) => {
    const updated = [...blocks];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const addBlockAfter = (index: number, type: DocumentBlockType = 'paragraph', content = '') => {
    const newBlock: DocumentBlock = {
      id: generateBlockId(),
      type,
      content,
      checked: false,
    };
    const updated = [...blocks.slice(0, index + 1), newBlock, ...blocks.slice(index + 1)];
    onChange(updated);
    setTimeout(() => {
      setActiveBlockIndex(index + 1);
      const nextEl = blockRefs.current[index + 1];
      if (nextEl) {
        nextEl.focus();
      }
    }, 50);
  };

  const deleteBlock = (index: number) => {
    if (blocks.length <= 1) {
      updateBlock(0, { type: 'paragraph', content: '' });
      return;
    }
    const updated = blocks.filter((_, i) => i !== index);
    onChange(updated);
    const targetIdx = Math.max(0, index - 1);
    setActiveBlockIndex(targetIdx);
    setTimeout(() => {
      blockRefs.current[targetIdx]?.focus();
    }, 50);
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= blocks.length) return;
    const updated = [...blocks];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChange(updated);
    setActiveBlockIndex(toIndex);
  };

  const duplicateBlock = (index: number) => {
    const orig = blocks[index];
    const dup: DocumentBlock = {
      ...orig,
      id: generateBlockId(),
    };
    const updated = [...blocks.slice(0, index + 1), dup, ...blocks.slice(index + 1)];
    onChange(updated);
  };

  // Slash commands filtering
  const filteredCommands = SLASH_COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(slashQuery.toLowerCase()) ||
    cmd.desc.toLowerCase().includes(slashQuery.toLowerCase()) ||
    cmd.type.toLowerCase().includes(slashQuery.toLowerCase())
  );

  const applySlashCommand = (cmd: SlashCommandItem) => {
    if (activeBlockIndex === null) return;
    const block = blocks[activeBlockIndex];
    let newContent = block.content.replace(/^\/.*$/, '').trim();

    const updates: Partial<DocumentBlock> = {
      type: cmd.type,
      content: newContent,
      calloutType: cmd.calloutType,
    };

    if (cmd.type === 'table' && !block.tableData) {
      updates.tableData = [
        ['Colonne 1', 'Colonne 2', 'Statut'],
        ['Élément A', 'Détail A', 'Actif'],
        ['Élément B', 'Détail B', 'En cours'],
      ];
    }

    updateBlock(activeBlockIndex, updates);
    setSlashMenuOpen(false);
    setSlashQuery('');
    setTimeout(() => {
      blockRefs.current[activeBlockIndex]?.focus();
    }, 50);
  };

  // Keyboard navigation & markdown transforms
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>, index: number) => {
    const block = blocks[index];
    const target = e.currentTarget;

    // Handle Slash Menu Navigation
    if (slashMenuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[slashSelectedIndex]) {
          applySlashCommand(filteredCommands[slashSelectedIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashMenuOpen(false);
        return;
      }
    }

    // Markdown shortcut expansions on Space
    if (e.key === ' ' && target.selectionStart === target.selectionEnd) {
      const cursor = target.selectionStart || 0;
      const textBefore = target.value.slice(0, cursor);

      if (textBefore === '#') {
        e.preventDefault();
        updateBlock(index, { type: 'heading_1', content: target.value.slice(cursor) });
        return;
      }
      if (textBefore === '##') {
        e.preventDefault();
        updateBlock(index, { type: 'heading_2', content: target.value.slice(cursor) });
        return;
      }
      if (textBefore === '###') {
        e.preventDefault();
        updateBlock(index, { type: 'heading_3', content: target.value.slice(cursor) });
        return;
      }
      if (textBefore === '-' || textBefore === '*') {
        e.preventDefault();
        updateBlock(index, { type: 'bullet_list', content: target.value.slice(cursor) });
        return;
      }
      if (textBefore === '1.') {
        e.preventDefault();
        updateBlock(index, { type: 'numbered_list', content: target.value.slice(cursor) });
        return;
      }
      if (textBefore === '[]' || textBefore === '[ ]') {
        e.preventDefault();
        updateBlock(index, { type: 'todo_list', content: target.value.slice(cursor), checked: false });
        return;
      }
      if (textBefore === '[x]') {
        e.preventDefault();
        updateBlock(index, { type: 'todo_list', content: target.value.slice(cursor), checked: true });
        return;
      }
      if (textBefore === '>') {
        e.preventDefault();
        updateBlock(index, { type: 'quote', content: target.value.slice(cursor) });
        return;
      }
    }

    // Enter key creates a new block
    if (e.key === 'Enter' && !e.shiftKey) {
      if (block.type === 'code_block' || block.type === 'table') {
        return; // Allow multiline in code and table
      }
      e.preventDefault();
      const cursor = target.selectionStart || 0;
      const currentText = block.content;
      const leftPart = currentText.slice(0, cursor);
      const rightPart = currentText.slice(cursor);

      updateBlock(index, { content: leftPart });
      const nextType = block.type === 'todo_list' || block.type === 'bullet_list' || block.type === 'numbered_list'
        ? block.type
        : 'paragraph';
      addBlockAfter(index, nextType, rightPart);
      return;
    }

    // Backspace at beginning of block
    if (e.key === 'Backspace') {
      const cursor = target.selectionStart || 0;
      if (cursor === 0 && target.selectionEnd === 0) {
        if (block.type !== 'paragraph') {
          e.preventDefault();
          updateBlock(index, { type: 'paragraph' });
          return;
        }
        if (block.content === '' && blocks.length > 1) {
          e.preventDefault();
          deleteBlock(index);
          return;
        }
      }
    }

    // Arrow Up / Down navigation between blocks
    if (e.key === 'ArrowUp' && (target.selectionStart || 0) === 0 && index > 0) {
      e.preventDefault();
      blockRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowDown' && (target.selectionEnd || 0) === target.value.length && index < blocks.length - 1) {
      e.preventDefault();
      blockRefs.current[index + 1]?.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>, index: number) => {
    const val = e.target.value;
    updateBlock(index, { content: val });
    if (e.target instanceof HTMLTextAreaElement) {
      adjustHeight(e.target);
    }

    // Detect slash command trigger
    if (val.startsWith('/')) {
      setSlashMenuOpen(true);
      setSlashQuery(val.slice(1));
      setSlashSelectedIndex(0);
      setActiveBlockIndex(index);
    } else if (slashMenuOpen) {
      setSlashMenuOpen(false);
      setSlashQuery('');
    }
  };

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="relative space-y-1.5 focus:outline-none min-h-[400px]">
      {/* ── Active Editor Presence Banner ── */}
      {activeEditorName && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 mb-2 rounded-[4px] bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span><strong>{activeEditorName}</strong> est également en train d&apos;éditer ce document</span>
        </div>
      )}

      {/* ── Block List ── */}
      {blocks.map((block, index) => {
        const isActive = activeBlockIndex === index;

        return (
          <div
            key={block.id}
            className={cn(
              'group/block relative flex items-start gap-1 rounded-[6px] transition-all px-1 py-0.5',
              isActive && !readOnly ? 'bg-zinc-50/70 ring-1 ring-zinc-200/60' : 'hover:bg-zinc-50/40'
            )}
            onMouseEnter={() => !readOnly && setActiveBlockIndex(index)}
          >
            {/* ── Left Action Controls (Drag/Move/Type) ── */}
            {!readOnly && (
              <div className="opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center gap-0.5 pt-1.5 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => moveBlock(index, index - 1)}
                  disabled={index === 0}
                  title="Déplacer vers le haut"
                  className="p-0.5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/70 disabled:opacity-20 cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(index, index + 1)}
                  disabled={index === blocks.length - 1}
                  title="Déplacer vers le bas"
                  className="p-0.5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/70 disabled:opacity-20 cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => duplicateBlock(index)}
                  title="Dupliquer"
                  className="p-0.5 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/70 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteBlock(index)}
                  title="Supprimer le bloc"
                  className="p-0.5 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* ── Block Content by Type ── */}
            <div className="flex-1 min-w-0">
              {/* Heading 1 */}
              {block.type === 'heading_1' && (
                <div className="py-1">
                  <textarea
                    ref={(el) => { blockRefs.current[index] = el; }}
                    value={block.content}
                    disabled={readOnly}
                    placeholder="Titre principal (H1)…"
                    rows={1}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onChange={(e) => handleInputChange(e, index)}
                    onFocus={() => setActiveBlockIndex(index)}
                    className="w-full text-xl font-bold text-zinc-900 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-zinc-300 font-display tracking-tight"
                  />
                </div>
              )}

              {/* Heading 2 */}
              {block.type === 'heading_2' && (
                <div className="py-1">
                  <textarea
                    ref={(el) => { blockRefs.current[index] = el; }}
                    value={block.content}
                    disabled={readOnly}
                    placeholder="Titre de section (H2)…"
                    rows={1}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onChange={(e) => handleInputChange(e, index)}
                    onFocus={() => setActiveBlockIndex(index)}
                    className="w-full text-base font-semibold text-zinc-850 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-zinc-300"
                  />
                </div>
              )}

              {/* Heading 3 */}
              {block.type === 'heading_3' && (
                <div className="py-0.5">
                  <textarea
                    ref={(el) => { blockRefs.current[index] = el; }}
                    value={block.content}
                    disabled={readOnly}
                    placeholder="Sous-titre (H3)…"
                    rows={1}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onChange={(e) => handleInputChange(e, index)}
                    onFocus={() => setActiveBlockIndex(index)}
                    className="w-full text-[13.5px] font-semibold text-zinc-800 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-zinc-300"
                  />
                </div>
              )}

              {/* Paragraph */}
              {block.type === 'paragraph' && (
                <div className="py-0.5">
                  <textarea
                    ref={(el) => { blockRefs.current[index] = el; }}
                    value={block.content}
                    disabled={readOnly}
                    placeholder="Écrivez du texte ou tapez '/' pour insérer un bloc…"
                    rows={1}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onChange={(e) => handleInputChange(e, index)}
                    onFocus={() => setActiveBlockIndex(index)}
                    className="w-full text-[13px] leading-relaxed text-zinc-800 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-zinc-300"
                  />
                </div>
              )}

              {/* Todo List / Checklist */}
              {block.type === 'todo_list' && (
                <div className="flex items-start gap-2 py-0.5">
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => updateBlock(index, { checked: !block.checked })}
                    className={cn(
                      'mt-1 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors cursor-pointer shrink-0',
                      block.checked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-zinc-300 hover:border-zinc-500 bg-white'
                    )}
                  >
                    {block.checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                  <textarea
                    ref={(el) => { blockRefs.current[index] = el; }}
                    value={block.content}
                    disabled={readOnly}
                    placeholder="Tâche à faire…"
                    rows={1}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onChange={(e) => handleInputChange(e, index)}
                    onFocus={() => setActiveBlockIndex(index)}
                    className={cn(
                      'flex-1 text-[13px] leading-relaxed bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-zinc-300 transition-all',
                      block.checked ? 'line-through text-zinc-400' : 'text-zinc-800'
                    )}
                  />
                </div>
              )}

              {/* Bullet List */}
              {block.type === 'bullet_list' && (
                <div className="flex items-start gap-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 mt-2 shrink-0" />
                  <textarea
                    ref={(el) => { blockRefs.current[index] = el; }}
                    value={block.content}
                    disabled={readOnly}
                    placeholder="Élément de liste…"
                    rows={1}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onChange={(e) => handleInputChange(e, index)}
                    onFocus={() => setActiveBlockIndex(index)}
                    className="flex-1 text-[13px] leading-relaxed text-zinc-800 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-zinc-300"
                  />
                </div>
              )}

              {/* Numbered List */}
              {block.type === 'numbered_list' && (
                <div className="flex items-start gap-2 py-0.5">
                  <span className="text-[12px] font-bold text-zinc-500 mt-0.5 shrink-0 select-none tabular-nums">
                    {index + 1}.
                  </span>
                  <textarea
                    ref={(el) => { blockRefs.current[index] = el; }}
                    value={block.content}
                    disabled={readOnly}
                    placeholder="Élément ordonné…"
                    rows={1}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onChange={(e) => handleInputChange(e, index)}
                    onFocus={() => setActiveBlockIndex(index)}
                    className="flex-1 text-[13px] leading-relaxed text-zinc-800 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-zinc-300"
                  />
                </div>
              )}

              {/* Callout / Alert Box */}
              {block.type === 'callout' && (
                <div
                  className={cn(
                    'p-2.5 rounded-[6px] border my-1 flex items-start gap-2.5 text-[12.5px]',
                    block.calloutType === 'info' && 'bg-blue-50/70 border-blue-200 text-blue-900',
                    block.calloutType === 'warning' && 'bg-amber-50/70 border-amber-200 text-amber-900',
                    block.calloutType === 'tip' && 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
                    (!block.calloutType || block.calloutType === 'note') && 'bg-zinc-50 border-zinc-200 text-zinc-800'
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {block.calloutType === 'info' && <Info className="w-4 h-4 text-blue-600" />}
                    {block.calloutType === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                    {block.calloutType === 'tip' && <Lightbulb className="w-4 h-4 text-emerald-600" />}
                    {(!block.calloutType || block.calloutType === 'note') && <AlertCircle className="w-4 h-4 text-zinc-600" />}
                  </div>
                  <textarea
                    ref={(el) => { blockRefs.current[index] = el; }}
                    value={block.content}
                    disabled={readOnly}
                    placeholder="Note ou encadré d'information…"
                    rows={1}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onChange={(e) => handleInputChange(e, index)}
                    onFocus={() => setActiveBlockIndex(index)}
                    className="flex-1 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 leading-relaxed placeholder:text-zinc-400"
                  />
                </div>
              )}

              {/* Quote Block */}
              {block.type === 'quote' && (
                <div className="border-l-2 border-zinc-400 pl-3 py-1 my-1">
                  <textarea
                    ref={(el) => { blockRefs.current[index] = el; }}
                    value={block.content}
                    disabled={readOnly}
                    placeholder="Citation ou phrase clé…"
                    rows={1}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onChange={(e) => handleInputChange(e, index)}
                    onFocus={() => setActiveBlockIndex(index)}
                    className="w-full text-[13px] italic text-zinc-700 bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-zinc-300"
                  />
                </div>
              )}

              {/* Code Block */}
              {block.type === 'code_block' && (
                <div className="bg-zinc-900 text-zinc-100 rounded-[6px] p-3 my-1 relative group/code font-mono text-[12px]">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider">
                      {block.codeLanguage || 'Code'}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCode(block.id, block.content)}
                      className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCodeId === block.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCodeId === block.id ? 'Copié' : 'Copier'}</span>
                    </button>
                  </div>
                  <textarea
                    ref={(el) => { blockRefs.current[index] = el; }}
                    value={block.content}
                    disabled={readOnly}
                    placeholder="// Écrivez votre code ici…"
                    rows={3}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onChange={(e) => handleInputChange(e, index)}
                    onFocus={() => setActiveBlockIndex(index)}
                    className="w-full bg-transparent border-0 resize-y focus:outline-none focus:ring-0 font-mono text-[12px] text-emerald-300 placeholder:text-zinc-600 leading-relaxed"
                  />
                </div>
              )}

              {/* Table Block */}
              {block.type === 'table' && (
                <div className="my-2 overflow-x-auto border border-zinc-200 rounded-[6px] bg-white">
                  <table className="w-full text-[12px] border-collapse">
                    <tbody>
                      {(block.tableData || [['Titre 1', 'Titre 2'], ['Val 1', 'Val 2']]).map((row, rIdx) => (
                        <tr key={rIdx} className={cn(rIdx === 0 ? 'bg-zinc-50 font-semibold border-b border-zinc-200' : 'border-b border-zinc-100')}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-1.5 border-r border-zinc-100 last:border-r-0">
                              <input
                                type="text"
                                disabled={readOnly}
                                value={cell}
                                onChange={(e) => {
                                  const nextData = (block.tableData || []).map((r) => [...r]);
                                  if (nextData[rIdx]) {
                                    nextData[rIdx][cIdx] = e.target.value;
                                    updateBlock(index, { tableData: nextData });
                                  }
                                }}
                                className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-zinc-800"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!readOnly && (
                    <div className="flex items-center justify-between p-1.5 bg-zinc-50 border-t border-zinc-100 text-[11px] text-zinc-500">
                      <button
                        type="button"
                        onClick={() => {
                          const current = block.tableData || [['A', 'B']];
                          const cols = current[0].length;
                          const newRow = Array(cols).fill('');
                          updateBlock(index, { tableData: [...current, newRow] });
                        }}
                        className="px-1.5 py-0.5 rounded hover:bg-zinc-200 text-zinc-600 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Ligne
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const current = block.tableData || [['A']];
                          const next = current.map((r) => [...r, '']);
                          updateBlock(index, { tableData: next });
                        }}
                        className="px-1.5 py-0.5 rounded hover:bg-zinc-200 text-zinc-600 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Colonne
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Divider Block */}
              {block.type === 'divider' && (
                <div className="py-2">
                  <hr className="border-t border-zinc-200" />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* ── Quick Add Bottom Button ── */}
      {!readOnly && (
        <button
          type="button"
          onClick={() => addBlockAfter(blocks.length - 1, 'paragraph', '')}
          className="mt-2 text-xs font-medium text-zinc-400 hover:text-zinc-700 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter un bloc ou tapez &apos;/&apos;</span>
        </button>
      )}

      {/* ── Slash Commands Floating Menu ── */}
      {slashMenuOpen && !readOnly && (
        <div
          ref={slashMenuRef}
          className="absolute z-50 left-6 mt-1 w-72 bg-white border border-zinc-200 rounded-[6px] shadow-lg p-1 space-y-0.5 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 mb-1">
            Insérer un bloc ({filteredCommands.length})
          </div>
          {filteredCommands.length === 0 ? (
            <div className="px-2 py-2 text-xs text-zinc-400 text-center">Aucun bloc correspondant</div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === slashSelectedIndex;

              return (
                <button
                  key={`${cmd.type}-${cmd.calloutType || idx}`}
                  type="button"
                  onClick={() => applySlashCommand(cmd)}
                  onMouseEnter={() => setSlashSelectedIndex(idx)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[4px] text-left transition-colors cursor-pointer',
                    isSelected ? 'bg-emerald-50 text-emerald-950 font-medium' : 'hover:bg-zinc-50 text-zinc-700'
                  )}
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded flex items-center justify-center shrink-0 border',
                      isSelected ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] truncate">{cmd.label}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{cmd.desc}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
