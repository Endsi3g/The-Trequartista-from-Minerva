'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GitBranch,
  Calendar,
  Layers,
  ArrowRight,
  MessageSquare,
  Radio,
  Flame,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FeatureRequest, FeatureRequestStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export const STEPS: { status: FeatureRequestStatus; label: string; desc: string }[] = [
  { status: 'under_review', label: 'En revue', desc: 'Analyse de faisabilité' },
  { status: 'planned', label: 'Planifié', desc: 'Inscrit dans le sprint' },
  { status: 'in_progress', label: 'En développement', desc: 'Codage & intégration' },
  { status: 'testing', label: 'En test', desc: 'Validation & QA' },
  { status: 'delivered', label: 'Livré', desc: 'En production' },
];

function getStepIndex(status: FeatureRequestStatus): number {
  switch (status) {
    case 'submitted':
    case 'under_review':
      return 0;
    case 'planned':
      return 1;
    case 'in_progress':
    case 'in_development':
      return 2;
    case 'testing':
    case 'in_qa':
      return 3;
    case 'delivered':
      return 4;
    case 'declined':
      return -1;
    default:
      return 0;
  }
}

interface FeatureRequestStatusCardProps {
  requests: FeatureRequest[];
  isRealtimeConnected?: boolean;
  onStatusChange?: (id: string, nextStatus: FeatureRequestStatus) => void;
  className?: string;
}

export function FeatureRequestStatusCard({
  requests,
  isRealtimeConnected = true,
  onStatusChange,
  className,
}: FeatureRequestStatusCardProps) {
  // Active requests (not declined, sorted with in_progress/planned first)
  const activeRequests = requests.filter((r) => r.status !== 'declined');

  return (
    <Card className={cn('overflow-hidden border-zinc-200/80 bg-white shadow-sm', className)}>
      {/* ── Header ── */}
      <div className="p-5 sm:p-6 border-b border-zinc-100 bg-gradient-to-r from-zinc-50 via-white to-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-xs">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 font-display">
              Statut de mes demandes
            </h2>
          </div>
          <p className="text-xs text-zinc-500">
            Suivez l&apos;avancement étape par étape de vos demandes en cours de réalisation.
          </p>
        </div>

        {/* Realtime Connection Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs shrink-0 self-start sm:self-auto">
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
            )}
          />
          <span className="font-semibold text-zinc-700">
            {isRealtimeConnected ? 'Temps réel actif' : 'Hors-ligne'}
          </span>
        </div>
      </div>

      {/* ── Requests List ── */}
      {activeRequests.length === 0 ? (
        <div className="py-12 px-6 text-center space-y-2">
          <Clock className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="text-sm font-semibold text-zinc-800">Aucune demande en cours</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Utilisez le formulaire ci-dessus pour soumettre une nouvelle idée ou fonctionnalité pour vos outils Minerva.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {activeRequests.map((req) => {
            const stepIndex = getStepIndex(req.status);
            const isDelivered = req.status === 'delivered';

            return (
              <div key={req.id} className="p-5 sm:p-6 space-y-5 hover:bg-zinc-50/40 transition-colors">
                {/* Top: Title & Repo */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-zinc-900 text-white font-mono" style={MONO}>
                        {req.repo || req.target_repo || 'Minerva-Flow'}
                      </span>

                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10.5px] font-semibold border',
                          req.priority === 'urgent'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : req.priority === 'high'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : req.priority === 'medium'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        )}
                      >
                        Priorité {req.priority === 'urgent' ? 'Urgente' : req.priority === 'high' ? 'Haute' : req.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </span>

                      {req.estimated_delivery && (
                        <span className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium" style={MONO}>
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          <span>Livraison estimée : {new Date(req.estimated_delivery).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-zinc-900">{req.title}</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">{req.description}</p>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs',
                        isDelivered
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : req.status === 'in_progress' || req.status === 'in_development'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : req.status === 'testing' || req.status === 'in_qa'
                          ? 'bg-purple-50 text-purple-800 border-purple-300'
                          : req.status === 'planned'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      )}
                    >
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          isDelivered
                            ? 'bg-emerald-600'
                            : req.status === 'in_progress' || req.status === 'in_development'
                            ? 'bg-blue-600 animate-pulse'
                            : req.status === 'testing' || req.status === 'in_qa'
                            ? 'bg-purple-600'
                            : req.status === 'planned'
                            ? 'bg-indigo-600'
                            : 'bg-amber-600'
                        )}
                      />
                      <span>
                        {STEPS.find((s) => s.status === req.status)?.label || req.status}
                      </span>
                    </span>
                  </div>
                </div>

                {/* ── 5-Step Visual Stepper ── */}
                <div className="pt-2 pb-1">
                  <div className="relative">
                    {/* Background line */}
                    <div className="absolute top-3.5 left-3 right-3 h-0.5 bg-zinc-200 -z-0" />
                    {/* Active filled line */}
                    <div
                      className="absolute top-3.5 left-3 h-0.5 bg-emerald-500 transition-all duration-500 -z-0"
                      style={{
                        width: `${Math.max(0, (stepIndex / (STEPS.length - 1)) * 100)}%`,
                      }}
                    />

                    <div className="grid grid-cols-5 gap-1 relative z-10">
                      {STEPS.map((step, idx) => {
                        const isDone = idx < stepIndex;
                        const isCurrent = idx === stepIndex;
                        const isPending = idx > stepIndex;

                        return (
                          <div key={step.status} className="flex flex-col items-center text-center">
                            <div
                              className={cn(
                                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2',
                                isDone
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : isCurrent
                                  ? 'bg-white text-emerald-600 border-emerald-600 ring-4 ring-emerald-100 shadow-xs'
                                  : 'bg-white text-zinc-400 border-zinc-300'
                              )}
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>
                            <span
                              className={cn(
                                'mt-1.5 text-[11px] font-semibold tracking-tight',
                                isCurrent
                                  ? 'text-zinc-900 font-bold'
                                  : isDone
                                  ? 'text-zinc-700'
                                  : 'text-zinc-400'
                              )}
                            >
                              {step.label}
                            </span>
                            <span className="hidden sm:inline text-[9.5px] text-zinc-400">
                              {step.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Team Admin Feedback Note */}
                {req.admin_notes && (
                  <div className="p-3 rounded-lg bg-zinc-100/70 border border-zinc-200/80 flex items-start gap-2.5 text-xs text-zinc-700">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-zinc-900">Note de l&apos;équipe Minerva : </span>
                      <span>{req.admin_notes}</span>
                    </div>
                  </div>
                )}

                {/* Optional Status Switcher for Testing / Admin */}
                {onStatusChange && (
                  <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-100">
                    <span>Simuler changement de statut (Test Realtime) :</span>
                    <div className="flex items-center gap-1">
                      {STEPS.map((s) => (
                        <button
                          key={s.status}
                          type="button"
                          onClick={() => onStatusChange(req.id, s.status)}
                          className={cn(
                            'px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors cursor-pointer',
                            req.status === s.status
                              ? 'bg-zinc-900 text-white font-bold'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
