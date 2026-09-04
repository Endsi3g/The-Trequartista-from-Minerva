'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Check,
  Send,
  RefreshCw,
  Layers,
  FileText,
  Video,
  Download,
  Sparkles,
  MessageSquare,
  ChevronRight,
  Maximize2,
  X,
  History,
} from 'lucide-react';
import type { ClientDeliverable, DeliverableVersion, DeliverableRevisionComment } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface DeliverableApprovalStudioProps {
  deliverables: ClientDeliverable[];
  onApprove: (id: string) => Promise<void>;
  onRequestRevision: (id: string, notes: string) => Promise<void>;
  submittingAction: string | null;
  token: string;
}

export function DeliverableApprovalStudio({
  deliverables,
  onApprove,
  onRequestRevision,
  submittingAction,
  token,
}: DeliverableApprovalStudioProps) {
  const [selectedId, setSelectedId] = useState<string>(
    deliverables.find((d) => d.status === 'pending_review')?.id || deliverables[0]?.id || ''
  );
  const [revisionNotes, setRevisionNotes] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [activeVersionNumber, setActiveVersionNumber] = useState<number | null>(null);

  const activeDeliverable = useMemo(() => {
    return deliverables.find((d) => d.id === selectedId) || deliverables[0] || null;
  }, [deliverables, selectedId]);

  const versions: DeliverableVersion[] = useMemo(() => {
    if (!activeDeliverable) return [];
    if (activeDeliverable.version_history && activeDeliverable.version_history.length > 0) {
      return activeDeliverable.version_history;
    }
    return [
      {
        version: activeDeliverable.version || 1,
        asset_url: activeDeliverable.asset_url || '',
        created_at: activeDeliverable.created_at,
        notes: activeDeliverable.description || 'Version initiale',
      },
    ];
  }, [activeDeliverable]);

  const currentVersion = useMemo(() => {
    if (activeVersionNumber !== null) {
      return versions.find((v) => v.version === activeVersionNumber) || versions[versions.length - 1];
    }
    return versions[versions.length - 1];
  }, [versions, activeVersionNumber]);

  const currentAssetUrl = currentVersion?.asset_url || activeDeliverable?.asset_url;

  const isPending = activeDeliverable?.status === 'pending_review';
  const isApproved = activeDeliverable?.status === 'approved';
  const isRevision = activeDeliverable?.status === 'revision_requested';

  const handleApprove = async () => {
    if (!activeDeliverable) return;
    await onApprove(activeDeliverable.id);
  };

  const handleRevisionSubmit = async () => {
    if (!activeDeliverable || !revisionNotes.trim()) return;
    await onRequestRevision(activeDeliverable.id, revisionNotes.trim());
    setRevisionNotes('');
    setShowRevisionForm(false);
  };

  if (!activeDeliverable) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg p-12 text-center shadow-2xs space-y-2">
        <Layers className="w-8 h-8 text-zinc-300 mx-auto" />
        <p className="text-xs font-semibold text-zinc-700">Aucun livrable disponible</p>
        <p className="text-[11px] text-zinc-400">Votre équipe Minerva déposera bientôt les premiers assets.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
      {/* ── COLONNE GAUCHE : Sélecteur de Livrables (4 colonnes) ── */}
      <div className="lg:col-span-4 flex flex-col justify-between bg-zinc-50/40">
        <div>
          {/* Header de la liste */}
          <div className="h-10 px-3.5 border-b border-zinc-200 bg-zinc-50/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-900">
              Livrables en Production ({deliverables.length})
            </span>
            <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
              Sélectionnez un item
            </span>
          </div>

          {/* Liste interactive des livrables */}
          <div className="divide-y divide-zinc-100 max-h-[560px] overflow-y-auto">
            {deliverables.map((del) => {
              const isSelected = del.id === activeDeliverable.id;
              const delPending = del.status === 'pending_review';
              const delApproved = del.status === 'approved';
              const delRevision = del.status === 'revision_requested';

              return (
                <button
                  key={del.id}
                  onClick={() => {
                    setSelectedId(del.id);
                    setActiveVersionNumber(null);
                    setShowRevisionForm(false);
                  }}
                  className={cn(
                    'w-full text-left p-3 transition-all cursor-pointer flex items-start gap-2.5 group',
                    isSelected
                      ? 'bg-white border-l-3 border-emerald-600 shadow-2xs'
                      : 'hover:bg-zinc-100/60 border-l-3 border-transparent'
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {delApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : delRevision ? (
                      <RefreshCw className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[9.5px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-200 text-zinc-600" style={MONO}>
                        {del.type}
                      </span>
                      {del.version && (
                        <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" style={MONO}>
                          v{del.version}
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-[9.5px] font-mono px-1.5 py-0.2 rounded border ml-auto',
                          delApproved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : delRevision
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                        )}
                        style={MONO}
                      >
                        {delApproved ? 'Validé' : delRevision ? 'Retouches' : 'À valider'}
                      </span>
                    </div>

                    <h4
                      className={cn(
                        'text-xs font-semibold leading-snug truncate',
                        isSelected ? 'text-zinc-900' : 'text-zinc-700'
                      )}
                    >
                      {del.title}
                    </h4>

                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {del.description || 'Prêt pour validation client'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pied de liste d'information */}
        <div className="p-3 border-t border-zinc-200 bg-white text-[11px] text-zinc-500 font-mono flex items-center justify-between" style={MONO}>
          <span>Assistance technique :</span>
          <span className="text-emerald-700 font-medium">Réponse &lt; 2h</span>
        </div>
      </div>

      {/* ── COLONNE DROITE : Studio de Visionnage & Validation (8 colonnes) ── */}
      <div className="lg:col-span-8 flex flex-col justify-between bg-white">
        {/* Header du Studio */}
        <div className="p-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/20">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold" style={MONO}>
                {activeDeliverable.type}
              </span>
              <span
                className={cn(
                  'text-[10px] font-mono px-2 py-0.2 rounded border font-semibold flex items-center gap-1',
                  isApproved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isRevision
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                )}
                style={MONO}
              >
                {isApproved ? (
                  <>
                    <Check className="w-2.5 h-2.5" />
                    <span>Livrable Homologué</span>
                  </>
                ) : isRevision ? (
                  <>
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>Ajustements Demandés</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-2.5 h-2.5" />
                    <span>Validation Client Requise</span>
                  </>
                )}
              </span>
            </div>

            <h3 className="text-sm font-bold text-zinc-900 leading-snug">
              {activeDeliverable.title}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {activeDeliverable.description || 'Livrable prêt pour votre revue finale.'}
            </p>
          </div>

          {/* Versions Selector Pills */}
          {versions.length > 1 && (
            <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 rounded-md p-0.5 text-xs self-start sm:self-auto shrink-0">
              <span className="text-[10px] text-zinc-400 font-mono px-1.5" style={MONO}>
                Versions :
              </span>
              {versions.map((v) => {
                const isActive = currentVersion?.version === v.version;
                return (
                  <button
                    key={v.version}
                    onClick={() => setActiveVersionNumber(v.version)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer font-semibold',
                      isActive
                        ? 'bg-white text-zinc-900 shadow-2xs border border-zinc-200/60'
                        : 'text-zinc-500 hover:text-zinc-900'
                    )}
                    style={MONO}
                  >
                    v{v.version}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Visionneuse Principale Responsive */}
        <div className="p-4 flex-1 flex flex-col justify-center items-center min-h-[340px] max-h-[480px] bg-zinc-950/5 relative overflow-hidden group">
          {activeDeliverable.type === 'video' ? (
            <div className="w-full max-w-xl aspect-video bg-black rounded-lg overflow-hidden shadow-md flex items-center justify-center relative">
              {currentAssetUrl && currentAssetUrl.endsWith('.mp4') ? (
                <video
                  src={currentAssetUrl}
                  controls
                  className="w-full h-full object-contain"
                  poster={activeDeliverable.preview_image_url || undefined}
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <Video className="w-10 h-10 text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-300 font-medium">
                    Lecteur Vidéo Haute Définition
                  </p>
                  {currentAssetUrl && (
                    <a
                      href={currentAssetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-semibold transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Visionner en plein écran</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : activeDeliverable.type === 'document' ? (
            <div className="w-full max-w-md p-6 bg-white border border-zinc-200 rounded-lg shadow-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900">{activeDeliverable.title}</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">Document PDF exécutif haute résolution</p>
              </div>
              {currentAssetUrl && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <a
                    href={currentAssetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-3 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Consulter le PDF</span>
                  </a>
                  <a
                    href={currentAssetUrl}
                    download
                    className="h-8 px-3 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Télécharger</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            /* Design / Framer / Image */
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              {currentAssetUrl ? (
                <div className="relative max-w-2xl max-h-[380px] rounded-lg overflow-hidden border border-zinc-200 shadow-sm bg-white">
                  <img
                    src={currentAssetUrl}
                    alt={activeDeliverable.title}
                    className="w-full h-full object-contain max-h-[380px]"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={currentAssetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-7 px-2.5 rounded-md bg-black/70 hover:bg-black text-white text-xs font-mono flex items-center gap-1 backdrop-blur-xs transition-colors"
                      style={MONO}
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Zoom Plein Écran</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <Layers className="w-8 h-8 text-zinc-400 mx-auto" />
                  <p className="text-xs text-zinc-600 font-semibold">Aperçu en cours de rendu</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Note de Version si disponible */}
        {currentVersion?.notes && (
          <div className="px-4 py-2 bg-zinc-50/60 border-t border-zinc-200 text-xs text-zinc-600 flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="font-mono text-[10px] text-zinc-400" style={MONO}>
              Note v{currentVersion.version} :
            </span>
            <span className="truncate">{currentVersion.notes}</span>
          </div>
        )}

        {/* ── Fil de Révision Horodaté Inline ── */}
        {activeDeliverable.revision_comments && activeDeliverable.revision_comments.length > 0 && (
          <div className="px-4 py-3 border-t border-zinc-200 bg-white space-y-2 max-h-36 overflow-y-auto">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block font-mono" style={MONO}>
              Historique des Échanges &amp; Retouches
            </span>
            <div className="space-y-1.5">
              {activeDeliverable.revision_comments.map((c) => {
                const isClient = c.role === 'client';
                return (
                  <div
                    key={c.id}
                    className={cn(
                      'p-2 rounded-md text-xs leading-relaxed border',
                      isClient
                        ? 'bg-amber-50/40 border-amber-200 text-zinc-900'
                        : 'bg-emerald-50/30 border-emerald-200 text-zinc-900'
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-0.5" style={MONO}>
                      <span className="font-semibold text-zinc-700">{c.author}</span>
                      <span>{new Date(c.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <p className="text-[11.5px] text-zinc-700">{c.comment}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Actions d'Approbation & Formulaire de Révision ── */}
        <div className="p-4 border-t border-zinc-200 bg-white">
          {showRevisionForm ? (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-800">
                  Précisez vos demandes de retouches pour l'équipe Minerva :
                </label>
                <button
                  onClick={() => setShowRevisionForm(false)}
                  className="text-zinc-400 hover:text-zinc-700 text-xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Ex : Pourriez-vous éclaircir le fond, ajuster la typographie sur mobile et ajouter le logo en haut à droite ?"
                rows={3}
                className="w-full p-2.5 text-xs bg-white border border-zinc-200 rounded-md focus:bg-white focus:border-amber-600 focus:outline-none resize-none"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRevisionForm(false)}
                  className="h-8 px-3 rounded-md text-xs font-medium text-zinc-600 hover:bg-zinc-200/60 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleRevisionSubmit}
                  disabled={submittingAction === activeDeliverable.id || !revisionNotes.trim()}
                  className="h-8 px-4 rounded-md bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  {submittingAction === activeDeliverable.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Transmettre la demande de révision</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-zinc-500">
                {isApproved ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Ce livrable a été validé et homologué pour production.</span>
                  </span>
                ) : (
                  <span>
                    Examinez attentivement le livrable avant de valider l'accord de conformité.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {currentAssetUrl && (
                  <a
                    href={currentAssetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-3 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Lien direct</span>
                  </a>
                )}

                {!isApproved && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRevisionForm(true)}
                      className="h-8 px-3 rounded-md border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Demander un ajustement</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={submittingAction === activeDeliverable.id}
                      className="h-8 px-4 rounded-md bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      {submittingAction === activeDeliverable.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Approuver ce livrable</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
