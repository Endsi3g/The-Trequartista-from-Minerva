'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  X,
  Play,
  Pause,
  Volume2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Send,
  Download,
  Share2,
  ExternalLink,
  Clock,
  DollarSign,
  TrendingUp,
  Tag,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/providers/ToastProvider';
import type { Audit, AuditWithFindings } from '@/lib/types';
import { fetchAuditWithFindings, addProposal } from '@/lib/services/supabase-data';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface Marker {
  timeSec: number;
  timeLabel: string;
  type: 'objection' | 'price' | 'need' | 'closing';
  label: string;
  color: string;
}

const DEFAULT_MARKERS: Marker[] = [
  { timeSec: 42, timeLabel: '00:42', type: 'need', label: 'Perte de leads non traités', color: 'bg-blue-500' },
  { timeSec: 114, timeLabel: '01:54', type: 'objection', label: 'Coût commissions 30%', color: 'bg-amber-500' },
  { timeSec: 198, timeLabel: '03:18', type: 'price', label: 'Budget 5 000 $ validé', color: 'bg-emerald-500' },
  { timeSec: 246, timeLabel: '04:06', type: 'closing', label: 'Demande offre sur-mesure', color: 'bg-purple-500' },
];

interface AuditDetailSideDrawerProps {
  audit: Audit | null;
  isOpen: boolean;
  onClose: () => void;
  onProposalCreated?: (auditId: string) => void;
}

export function AuditDetailSideDrawer({
  audit,
  isOpen,
  onClose,
  onProposalCreated,
}: AuditDetailSideDrawerProps) {
  const { toastSuccess, toastInfo, toastError } = useToast();
  const [details, setDetails] = useState<AuditWithFindings | null>(null);
  const [loading, setLoading] = useState(false);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const totalDurationSec = 252; // 04:12 min
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Proposal Generation State
  const [generatingProposal, setGeneratingProposal] = useState(false);

  useEffect(() => {
    if (audit?.id && isOpen) {
      setLoading(true);
      fetchAuditWithFindings(audit.id)
        .then((data) => setDetails(data))
        .finally(() => setLoading(false));
    }
  }, [audit?.id, isOpen]);

  // Audio Playback Simulation
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTimeSec((prev) => {
          if (prev >= totalDurationSec) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentTimeSec(0);
    }
  }, [isOpen]);

  const handleSeek = (secs: number) => {
    setCurrentTimeSec(secs);
    setIsPlaying(true);
    toastInfo('Lecture synchronisée', `Audio positionné à ${formatTime(secs)}.`);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleConvertToProposal = async () => {
    if (!audit) return;
    setGeneratingProposal(true);
    try {
      // Simulate proposal generation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toastSuccess(
        'Proposition commerciale générée !',
        `L'offre sur-mesure pour « ${audit.prospect_name} » est prête à être envoyée.`
      );
      if (onProposalCreated) onProposalCreated(audit.id);
    } catch {
      toastError('Erreur', 'Impossible de générer la proposition.');
    } finally {
      setGeneratingProposal(false);
    }
  };

  const handleCopyPublicLink = () => {
    if (!audit) return;
    const url = `${window.location.origin}/audit/view?token=${audit.view_token || audit.id}`;
    navigator.clipboard.writeText(url);
    toastSuccess('Lien d’audit copié', 'Lien interactif sécurisé prêt à partager au prospect.');
  };

  if (!isOpen || !audit) return null;

  const healthScore = 68;
  const annualOpportunity = 14800;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-zinc-200 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* ── Header ── */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 truncate font-display">
                  {audit.prospect_name}
                </h2>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                  Score {healthScore}/100
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono" style={MONO}>
                Diagnostic IA • Whisper + Claude 3.5
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyPublicLink}
              title="Copier le lien public interactif"
              className="w-7 h-7 rounded-md hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Drawer Body ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-zinc-50/30">

          {/* 1. Mini-Player Waveform Haute Précision (28px height) */}
          <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                </button>
                <div>
                  <span className="font-semibold text-zinc-900 text-xs">Enregistrement Diagnostic</span>
                  <div className="text-[10px] text-zinc-400 font-mono" style={MONO}>
                    Audio HD • {formatTime(currentTimeSec)} / {formatTime(totalDurationSec)}
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60" style={MONO}>
                {isPlaying ? '● Lecture' : 'Pause'}
              </span>
            </div>

            {/* Interactive Waveform Strip (28px) */}
            <div className="h-7 bg-zinc-50 rounded-lg border border-zinc-100 flex items-center gap-1 px-3 relative overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                handleSeek(Math.round(ratio * totalDurationSec));
              }}
            >
              {[...Array(38)].map((_, i) => {
                const progressRatio = currentTimeSec / totalDurationSec;
                const barRatio = i / 38;
                const isPassed = barRatio <= progressRatio;
                const heightPattern = [8, 16, 24, 12, 20, 26, 14, 18, 10, 22][i % 10];

                return (
                  <div
                    key={i}
                    style={{ height: `${heightPattern}px` }}
                    className={cn(
                      'w-1 rounded-full transition-colors',
                      isPassed ? 'bg-emerald-600' : 'bg-zinc-200'
                    )}
                  />
                );
              })}
            </div>

            {/* AI Time-Coded Markers */}
            <div className="space-y-1 pt-1">
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Marqueurs d&apos;IA Détectés
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {DEFAULT_MARKERS.map((m) => (
                  <button
                    key={m.timeLabel}
                    type="button"
                    onClick={() => handleSeek(m.timeSec)}
                    className="p-1.5 rounded-md bg-zinc-50 hover:bg-emerald-50/60 border border-zinc-200/70 hover:border-emerald-200 text-left flex items-center gap-2 transition-all cursor-pointer group"
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', m.color)} />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] font-bold text-zinc-500 group-hover:text-emerald-800" style={MONO}>
                        {m.timeLabel}
                      </div>
                      <div className="text-[10.5px] font-medium text-zinc-800 truncate">
                        {m.label}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Matrice d'Impact & Opportunités ($) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-zinc-500">Maturité Digitale</span>
              <div className="text-base font-extrabold text-zinc-900 font-mono" style={MONO}>
                {healthScore} / 100
              </div>
              <span className="text-[10.5px] text-amber-700 font-medium">Faible (Pertes récurrentes)</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-zinc-500">Opportunité Détectée</span>
              <div className="text-base font-extrabold text-emerald-700 font-mono" style={MONO}>
                +{annualOpportunity.toLocaleString('fr-CA')} $/an
              </div>
              <span className="text-[10.5px] text-emerald-600 font-medium">Potentiel de conversion</span>
            </div>
          </div>

          {/* 3. Recommandations Stratégiques IA */}
          <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>3 Recommandations Stratégiques</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Priorité Haute</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <div className="font-semibold text-zinc-900">Digitalisation Commande Directe (Minerva-Flow)</div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                    Élimination des 30% de commission DoorDash/UberEats via un portail de commande directe 0% avec passerelle Stripe.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <div className="font-semibold text-zinc-900">Agent Vocal de Qualification (Alex)</div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                    Capture automatique des réservations et appels hors-heures pour zéro perte de clients entrants.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <div className="font-semibold text-zinc-900">Campagnes Meta Ads &amp; Acquisition Locale</div>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                    Ciblage géographique rayon 5 km pour générer 150+ nouveaux clients récurrents par mois.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Verbatim Synchronisé */}
          <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Transcription de l&apos;Appel</span>
              <span className="font-mono text-[10px]">100% transcrits</span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100 text-xs text-zinc-700 leading-relaxed max-h-40 overflow-y-auto space-y-2 font-sans">
              <p>
                <span className="font-bold text-emerald-800">[00:15 - Consultant] :</span> Bonjour M. Tremblay, pouvez-vous m&apos;expliquer comment sont gérées vos commandes actuellement ?
              </p>
              <p>
                <span className="font-bold text-zinc-900">[00:42 - Prospect] :</span> On reçoit tout par téléphone ou sur UberEats, mais on perd un temps fou en cuisine et <mark className="bg-amber-100 text-amber-900 px-1 rounded">la commission de 30% nous étouffe</mark>.
              </p>
              <p>
                <span className="font-bold text-emerald-800">[01:54 - Consultant] :</span> C&apos;est exactement là où Minerva-Flow intervient. Vous encaissez 100% des montants directement via Stripe sans commission tierce.
              </p>
              <p>
                <span className="font-bold text-zinc-900">[03:18 - Prospect] :</span> <mark className="bg-emerald-100 text-emerald-900 px-1 rounded">On a un budget prévu d&apos;environ 5 000 $</mark> si la mise en place se fait rapidement.
              </p>
            </div>
          </div>

        </div>

        {/* ── Drawer Footer ── */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/90 flex flex-col gap-2">
          <Button
            onClick={handleConvertToProposal}
            disabled={generatingProposal}
            variant="primary"
            className="w-full h-9 text-xs font-bold gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>{generatingProposal ? 'Génération en cours…' : '✦ Convertir en Proposition Commerciale'}</span>
          </Button>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
            <Link
              href={`/audits/${audit.id}`}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
            >
              <span>Ouvrir le rapport complet</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="text-xs text-zinc-500 hover:text-zinc-800 cursor-pointer font-medium"
            >
              Fermer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
