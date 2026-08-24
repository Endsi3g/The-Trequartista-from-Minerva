'use client';

import React, { useState } from 'react';
import {
  History,
  X,
  RotateCcw,
  Plus,
  Clock,
  User,
  Check,
  AlertCircle,
  Eye,
  FileText,
} from 'lucide-react';
import { DocumentVersion } from '@/lib/types';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface DocumentVersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DocumentVersion[];
  currentVersionNumber?: number;
  onRestore: (version: DocumentVersion) => Promise<void>;
  onCreateSnapshot: () => Promise<void>;
}

export function DocumentVersionHistory({
  isOpen,
  onClose,
  versions,
  currentVersionNumber,
  onRestore,
  onCreateSnapshot,
}: DocumentVersionHistoryProps) {
  const confirm = useConfirm();
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setCreating(true);
    try {
      await onCreateSnapshot();
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreClick = async (version: DocumentVersion) => {
    const ok = await confirm({
      title: `Restaurer la Version ${version.version_number} ?`,
      message: `Le contenu actuel du document sera remplacé par l'état sauvegardé le ${new Date(version.created_at).toLocaleString('fr-CA')}.`,
      confirmLabel: 'Restaurer',
      variant: 'default',
    });
    if (!ok) return;

    setRestoringId(version.id);
    try {
      await onRestore(version);
      onClose();
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/20 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-zinc-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-zinc-900">Historique des Versions</h2>
            <span style={MONO} className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-semibold">
              {versions.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snapshot trigger */}
        <div className="p-3 border-b border-zinc-100 bg-white">
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="w-full h-8 rounded-[4px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{creating ? 'Création du snapshot…' : 'Créer un snapshot maintenant'}</span>
          </button>
        </div>

        {/* Version List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {versions.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Clock className="w-8 h-8 text-zinc-300 mx-auto" />
              <p className="text-xs font-semibold text-zinc-700">Aucune version antérieure</p>
              <p className="text-[11px] text-zinc-400">
                Créez un premier snapshot pour verrouiller une étape clé de rédaction.
              </p>
            </div>
          ) : (
            versions.map((ver) => {
              const isSelected = selectedVersion?.id === ver.id;
              const dateStr = new Date(ver.created_at).toLocaleDateString('fr-CA', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={ver.id}
                  className={cn(
                    'p-3 rounded-[6px] border transition-all space-y-2',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-400/40'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        style={MONO}
                        className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-white"
                      >
                        v{ver.version_number}
                      </span>
                      <span className="text-xs font-semibold text-zinc-800 truncate max-w-[180px]">
                        {ver.title}
                      </span>
                    </div>
                    <span style={MONO} className="text-[10.5px] text-zinc-400">
                      {dateStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-zinc-400" />
                      <span className="truncate max-w-[120px]">
                        {ver.creator_name || 'Équipe Minerva'}
                      </span>
                    </div>
                    <span style={MONO} className="text-[10px] text-zinc-400">
                      {(ver.content_json?.blocks?.length || 0)} blocs
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedVersion(isSelected ? null : ver)}
                      className="flex-1 h-7 rounded border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-zinc-400" />
                      <span>{isSelected ? 'Masquer aperçu' : 'Aperçu'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRestoreClick(ver)}
                      disabled={restoringId === ver.id}
                      className="flex-1 h-7 rounded bg-zinc-900 hover:bg-black text-white text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{restoringId === ver.id ? 'Restauration…' : 'Restaurer'}</span>
                    </button>
                  </div>

                  {/* Inline Preview */}
                  {isSelected && (
                    <div className="mt-2 p-2.5 rounded bg-zinc-50 border border-zinc-200 text-[11px] max-h-40 overflow-y-auto space-y-1">
                      <p className="font-semibold text-zinc-800 border-b border-zinc-200 pb-1 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-zinc-500" /> Aperçu du contenu
                      </p>
                      <p className="text-zinc-600 whitespace-pre-wrap leading-relaxed font-mono text-[10.5px]">
                        {ver.content_text || 'Aucun texte extrait'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
