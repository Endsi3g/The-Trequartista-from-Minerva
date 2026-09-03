'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, ShieldCheck, Sparkles, Loader2, Camera, UserCheck, Wrench, FileText } from 'lucide-react';
import type { InterventionChecklistItem } from '@/lib/leads/scoring';
import { getInitialInterventionChecklist } from '@/lib/leads/scoring';
import { useToast } from '@/components/providers/ToastProvider';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface Props {
  leadId: string;
  initialChecklist?: InterventionChecklistItem[] | null;
  onStatusChange?: (newStatus: string) => void;
}

export function InterventionChecklistCard({ leadId, initialChecklist, onStatusChange }: Props) {
  const { toastSuccess, toastError } = useToast();
  const [checklist, setChecklist] = useState<InterventionChecklistItem[]>(() => {
    if (initialChecklist && Array.isArray(initialChecklist) && initialChecklist.length > 0) {
      return initialChecklist;
    }
    return getInitialInterventionChecklist();
  });
  const [updatingStepId, setUpdatingStepId] = useState<string | null>(null);

  const completedCount = checklist.filter((c) => c.completed).length;
  const totalCount = checklist.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  const handleToggle = async (item: InterventionChecklistItem) => {
    const nextCompleted = !item.completed;
    setUpdatingStepId(item.id);

    try {
      const res = await fetch(`/api/leads/${leadId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: item.id,
          completed: nextCompleted,
          completedBy: 'Technicien Minerva',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur mise à jour');
      }

      setChecklist(data.checklist);
      toastSuccess(`Étape "${item.title}" ${nextCompleted ? 'validée' : 'décochée'}`);

      if (data.allCompleted) {
        toastSuccess('🎉 Protocole 45-60 min terminé ! Lead passé en statut Qualifié / Trial Active');
        if (onStatusChange) onStatusChange(data.status);
      }
    } catch (err: any) {
      toastError(err.message || 'Impossible de mettre à jour cette étape');
    } finally {
      setUpdatingStepId(null);
    }
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 2:
        return <Wrench className="w-4 h-4 text-emerald-600" />;
      case 3:
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 4:
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 5:
        return <Camera className="w-4 h-4 text-emerald-600" />;
      case 6:
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Checklist d&apos;Intervention sur Place (45-60 min)
            </h3>
            <p className="text-xs text-zinc-500">
              Protocole d&apos;installation terrain sans interruption de service
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400" style={MONO}>
            {completedCount} / {totalCount} terminées ({progressPct}%)
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {allDone && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
          Protocole complété ! L&apos;établissement est maintenant en essai actif (trial_active).
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-2 pt-2">
        {checklist.map((item) => {
          const isUpdating = updatingStepId === item.id;
          return (
            <div
              key={item.id}
              onClick={() => !isUpdating && handleToggle(item)}
              className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${
                item.completed
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  disabled={isUpdating}
                  className="mt-0.5 text-zinc-400 hover:text-emerald-600 transition-colors"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      {getStepIcon(item.step)}
                      {item.title}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      <Clock className="w-2.5 h-2.5" />
                      {item.estimatedMinutes}m
                    </span>
                  </div>
                  <p className="text-zinc-500 leading-relaxed text-[11px]">{item.description}</p>
                </div>
              </div>

              {item.completed && item.completedAt && (
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 shrink-0 text-right" style={MONO}>
                  ✓ Fait le {new Date(item.completedAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
