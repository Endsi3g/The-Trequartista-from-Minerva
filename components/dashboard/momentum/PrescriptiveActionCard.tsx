'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  PhoneCall,
  UserCheck,
} from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface PrescriptiveAction {
  id: string;
  category: 'Acquisition' | 'Rétention' | 'Tech';
  title: string;
  rationale: string;
  impactScore: string;
  actionLabel: string;
  actionHref?: string;
  onExecute?: () => void;
  urgent?: boolean;
}

interface PrescriptiveActionCardProps {
  primaryAction?: PrescriptiveAction;
  secondaryActions?: PrescriptiveAction[];
}

export function PrescriptiveActionCard({
  primaryAction,
  secondaryActions,
}: PrescriptiveActionCardProps) {
  const router = useRouter();

  const defaultPrimary: PrescriptiveAction = primaryAction || {
    id: 'primary-1',
    category: 'Acquisition',
    title: 'Relancer les 6 prospects chauds ayant consulté leur devis (<48h)',
    rationale: 'Le taux de closing chute de 65% après le 3ème jour sans contact. 3 devis représentent 8 400 $ CAD de valeur imminente.',
    impactScore: '+14% Closing',
    actionLabel: 'Démarrer la Session de Prospection (P)',
    actionHref: '/overview?workspace=prospection',
    urgent: true,
  };

  const defaultSecondaries: PrescriptiveAction[] = secondaryActions || [
    {
      id: 'sec-1',
      category: 'Rétention',
      title: 'Check-in préventif : Trattoria Bella Napoli (J+11 sans contact)',
      rationale: 'Le score de rétention du restaurant est passé à 88%. Un message de courtoisie évite tout sentiment d’abandon.',
      impactScore: 'Risque Churn Évité',
      actionLabel: 'Ouvrir Fiche Client',
      actionHref: '/clients',
    },
    {
      id: 'sec-2',
      category: 'Tech',
      title: 'Exécuter le protocole QA 20-points sur la release de production',
      rationale: 'Toutes les Edge Functions sont opérationnelles. L’audit de conformité valide la prochaine mise en ligne.',
      impactScore: '100% Fiabilité',
      actionLabel: 'Lancer l’Audit QA',
      actionHref: '/tech?tab=qa',
    },
  ];

  const handleExecute = (action: PrescriptiveAction) => {
    triggerHaptic('medium');
    if (action.onExecute) {
      action.onExecute();
    } else if (action.actionHref) {
      router.push(action.actionHref);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-[#f2f2f2] shadow-xs flex flex-col justify-between gap-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block" style={MONO}>
            PRESCRIPTIVE INSIGHTS (MOBBIN PATTERN 1)
          </span>
          <h3 className="text-sm font-semibold text-[#08090a]">Ce qu&apos;il faut faire maintenant</h3>
        </div>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#ecfdf5] border border-[#a7f3d0] text-[#0c8c5e]" style={MONO}>
          Priorité Calculée par l&apos;IA
        </span>
      </div>

      {/* ── Top Priority Hero Action ── */}
      <div className="p-4 rounded-xl border border-[#dddddd] bg-zinc-50/70 space-y-3 relative overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-[10px] font-mono px-2 py-0.5 rounded font-medium',
                defaultPrimary.category === 'Acquisition'
                  ? 'bg-[#ecfdf5] border border-[#a7f3d0] text-[#0c8c5e]'
                  : 'bg-blue-50 border border-blue-200 text-blue-700'
              )}
              style={MONO}
            >
              {defaultPrimary.category}
            </span>
            {defaultPrimary.urgent && (
              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded flex items-center gap-1" style={MONO}>
                <Clock size={10} />
                <span>Urgence Haute</span>
              </span>
            )}
          </div>
          <span className="text-xs font-mono font-semibold text-[#0c8c5e]" style={MONO}>
            {defaultPrimary.impactScore}
          </span>
        </div>

        <div>
          <h4 className="text-xs font-bold text-[#08090a] leading-snug">
            {defaultPrimary.title}
          </h4>
          <p className="text-[11px] text-zinc-600 mt-1.5 leading-relaxed">
            <strong className="text-zinc-800">Pourquoi maintenant :</strong> {defaultPrimary.rationale}
          </p>
        </div>

        {/* Ink Black Primary Action Button (4px radius) */}
        <button
          type="button"
          onClick={() => handleExecute(defaultPrimary)}
          className="w-full h-8 px-3 rounded bg-[#08090a] hover:bg-zinc-800 text-white text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
        >
          <span>{defaultPrimary.actionLabel}</span>
          <ArrowRight size={13} className="text-white" />
        </button>
      </div>

      {/* ── Secondary Actions Quick Wins ── */}
      <div className="space-y-2 pt-1 border-t border-[#f2f2f2]">
        <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider" style={MONO}>
          ACTIONS SECONDAIRES RECOMMANDÉES
        </div>
        {defaultSecondaries.map((sec) => (
          <div
            key={sec.id}
            className="p-2.5 rounded-lg border border-[#f2f2f2] hover:border-[#dddddd] bg-white transition-colors flex items-center justify-between gap-3 text-xs"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9.5px] font-mono text-zinc-500 uppercase" style={MONO}>
                  [{sec.category}]
                </span>
                <span className="font-medium text-[#08090a] truncate">{sec.title}</span>
              </div>
              <p className="text-[10.5px] text-zinc-500 truncate mt-0.5">{sec.rationale}</p>
            </div>

            <button
              type="button"
              onClick={() => handleExecute(sec)}
              className="h-6 px-2 text-[10.5px] font-medium text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-[#f2f2f2] rounded transition-colors cursor-pointer shrink-0 flex items-center gap-1"
            >
              <span>Exécuter</span>
              <ArrowRight size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
