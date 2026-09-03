'use client';

import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  DollarSign,
  ExternalLink,
  Pencil,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Utensils,
  Check,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Client, TrialMilestoneItem } from '@/lib/types';
import {
  startClientTrial,
  convertClientTrial,
  updateClient,
  createDefaultTrialMilestones,
} from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface TrialLifecycleTrackerProps {
  client: Client;
  onClientUpdated: (updated: Client) => void;
}

export function TrialLifecycleTracker({ client, onClientUpdated }: TrialLifecycleTrackerProps) {
  const { toastSuccess, toastError } = useToast();
  const confirmDialog = useConfirm();
  const currentUser = useCurrentUser();

  const [isStarting, setIsStarting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isUpdatingMilestone, setIsUpdatingMilestone] = useState(false);
  const [editingMetrics, setEditingMetrics] = useState(false);

  const [ordersCount, setOrdersCount] = useState<number>(client.trial_direct_orders_count || 0);
  const [directVolume, setDirectVolume] = useState<number>(client.trial_direct_volume_cad || 0);
  const [targetMrr, setTargetMrr] = useState<number>(client.mrr || 149);

  // Compute countdown & days remaining
  const trialEndDate = client.trial_end_date ? new Date(client.trial_end_date) : null;
  const trialStartDate = client.trial_start_date ? new Date(client.trial_start_date) : null;

  const now = new Date();
  const daysRemaining = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 14;

  const daysElapsed = trialStartDate
    ? Math.min(14, Math.max(0, Math.floor((now.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24))))
    : 0;

  const progressPct = Math.min(100, Math.max(0, Math.round((daysElapsed / 14) * 100)));

  // Estimate net margin saved (28% average commission saved on delivery platforms)
  const estimatedMarginSaved = Math.round(directVolume * 0.28);

  const milestones: TrialMilestoneItem[] =
    client.trial_milestones && client.trial_milestones.length > 0
      ? client.trial_milestones
      : createDefaultTrialMilestones();

  const completedMilestonesCount = milestones.filter((m) => m.completed).length;

  // 1. Start Trial Handler
  const handleStartTrial = async () => {
    const ok = await confirmDialog({
      title: 'Activer l’Essai Accompagné 14 Jours ?',
      message: `L'essai Minerva Flow de 14 jours sera activé pour ${client.name} avec l'ensemble des 5 jalons d'installation à Montréal.`,
      confirmLabel: 'Lancer l’Essai 14 Jours',
      variant: 'default',
    });
    if (!ok) return;

    setIsStarting(true);
    try {
      const updated = await startClientTrial(client.id);
      if (updated) {
        onClientUpdated(updated);
        toastSuccess('Essai 14 jours activé !', `Période active jusqu'au ${new Date(updated.trial_end_date!).toLocaleDateString('fr-CA')}`);
      } else {
        throw new Error("Impossible d'activer l'essai.");
      }
    } catch (err: any) {
      toastError('Erreur', err.message);
    } finally {
      setIsStarting(false);
    }
  };

  // 2. Toggle Milestone Handler
  const handleToggleMilestone = async (stepNumber: number) => {
    setIsUpdatingMilestone(true);
    try {
      const nextMilestones = milestones.map((m) => {
        if (m.step === stepNumber) {
          const nextCompleted = !m.completed;
          return {
            ...m,
            completed: nextCompleted,
            completed_at: nextCompleted ? new Date().toISOString() : null,
          };
        }
        return m;
      });

      const updated = await updateClient(client.id, {
        trial_milestones: nextMilestones,
      });

      if (updated) {
        onClientUpdated(updated);
        toastSuccess('Jalon mis à jour');
      }
    } catch (err: any) {
      toastError('Erreur', err.message);
    } finally {
      setIsUpdatingMilestone(false);
    }
  };

  // 3. Save Metrics Handler
  const handleSaveMetrics = async () => {
    try {
      const updated = await updateClient(client.id, {
        trial_direct_orders_count: Number(ordersCount) || 0,
        trial_direct_volume_cad: Number(directVolume) || 0,
        trial_net_margin_saved_cad: estimatedMarginSaved,
      });

      if (updated) {
        onClientUpdated(updated);
        setEditingMetrics(false);
        toastSuccess('Métriques de marge mises à jour');
      }
    } catch (err: any) {
      toastError('Erreur', err.message);
    }
  };

  // 4. Convert Trial to Active Paid Subscription
  const handleConvertTrial = async () => {
    const ok = await confirmDialog({
      title: 'Valider la Conversion en Abonnement Payant ?',
      message: `${client.name} passera en statut "Actif" avec un abonnement récurrent de ${targetMrr} $ CAD/mois.`,
      confirmLabel: 'Confirmer la conversion',
      variant: 'default',
    });
    if (!ok) return;

    setIsConverting(true);
    try {
      const updated = await convertClientTrial(client.id, targetMrr, currentUser?.id);
      if (updated) {
        onClientUpdated(updated);
        toastSuccess('Client converti avec succès !', `Abonnement actif à ${targetMrr} $ CAD/mois`);
      }
    } catch (err: any) {
      toastError('Erreur de conversion', err.message);
    } finally {
      setIsConverting(false);
    }
  };

  // ── Render Case A: Not in Trial ──
  if (!client.trial_status || client.trial_status === 'none') {
    return (
      <div className="bg-mv-surface border border-mv-border rounded-xl p-5 shadow-mv-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-mv-green/10 border border-mv-green/20 flex items-center justify-center text-mv-green shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-mv-ink">Essai Accompagné 14 Jours (Minerva Flow)</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                Non démarré
              </span>
            </div>
            <p className="text-xs text-mv-ink-soft mt-0.5">
              Installation sur place à Montréal, imprimante de cuisine 80mm, 50 chevalets QR codes et commande directe 0% commission
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStartTrial}
          disabled={isStarting}
          className="px-3.5 py-2 rounded-lg bg-mv-green hover:bg-mv-green-dark text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all shrink-0 disabled:opacity-50"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>{isStarting ? 'Activation…' : 'Démarrer l’Essai 14 Jours'}</span>
        </button>
      </div>
    );
  }

  // ── Render Case B: Converted ──
  if (client.trial_status === 'converted') {
    return (
      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 shadow-mv-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-mv-green/20 border border-mv-green/30 flex items-center justify-center text-mv-green shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-emerald-950">Essai 14 Jours Converti en Abonnement Actif</h4>
              <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-mv-green/15 text-mv-green border border-mv-green/30">
                Client Abonné ({client.mrr} $ / mois)
              </span>
            </div>
            <p className="text-[11px] text-emerald-800/80 mt-0.5">
              Toutes les étapes d'installation à Montréal et de fidélisation ont été homologuées avec succès.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded bg-white border border-emerald-200 text-xs font-bold font-mono text-emerald-900" style={MONO}>
            + {((client.trial_net_margin_saved_cad || estimatedMarginSaved) || 0).toLocaleString('fr-CA')} $ CAD préservés
          </div>
        </div>
      </div>
    );
  }

  // ── Render Case C: Active 14-Day Trial ──
  return (
    <div className="bg-mv-surface border border-mv-border rounded-xl overflow-hidden shadow-mv-sm space-y-0">
      {/* ── Header Ribbon & Countdown ── */}
      <div className="p-4 bg-mv-cream-soft/60 border-b border-mv-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mv-green/15 border border-mv-green/30 flex items-center justify-center text-mv-green shrink-0 shadow-2xs">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-mv-ink">
                Essai Accompagné 14 Jours — En Cours
              </h3>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold font-mono',
                  daysRemaining <= 3
                    ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse'
                    : daysRemaining <= 7
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                )}
                style={MONO}
              >
                {daysRemaining === 0 ? 'Dernier jour !' : `J-${daysRemaining} (${daysRemaining} jours restants)`}
              </span>
              <span className="text-[11px] text-mv-ink-faint font-mono">
                {completedMilestonesCount}/5 jalons validés
              </span>
            </div>
            <p className="text-[11.5px] text-mv-ink-soft mt-0.5">
              Installation sur place à Montréal • Commande directe 0% • Échéance :{' '}
              <strong className="text-mv-ink">{trialEndDate ? trialEndDate.toLocaleDateString('fr-CA') : 'J+14'}</strong>
            </p>
          </div>
        </div>

        {/* Action Button: Convert */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-mono text-mv-ink font-semibold">
            <span>MRR :</span>
            <input
              type="number"
              value={targetMrr}
              onChange={(e) => setTargetMrr(Number(e.target.value) || 0)}
              className="w-16 px-1.5 py-0.5 rounded bg-white border border-mv-border text-center text-xs font-bold"
              style={MONO}
            />
            <span>$ / mois</span>
          </div>

          <button
            type="button"
            onClick={handleConvertTrial}
            disabled={isConverting}
            className="px-3.5 py-1.5 rounded-lg bg-mv-green hover:bg-mv-green-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
            title="Convertir le client en abonnement payant actif"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isConverting ? 'Conversion…' : 'Convertir en Abonnement'}</span>
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-zinc-100 h-1.5">
        <div
          className="bg-mv-green h-1.5 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left 2 Columns: The 5 Operational Milestones ── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft">
              Jalons Opérationnels de l'Essai (Montréal) :
            </span>
            <span className="text-[11px] font-mono text-mv-ink-faint">
              Cocher au fur et à mesure des interventions
            </span>
          </div>

          <div className="space-y-2">
            {milestones.map((m) => (
              <div
                key={m.step}
                className={cn(
                  'p-3 rounded-xl border transition-all flex items-start gap-3',
                  m.completed
                    ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-950'
                    : 'bg-mv-cream-soft/40 border-mv-border text-mv-ink'
                )}
              >
                <button
                  type="button"
                  onClick={() => handleToggleMilestone(m.step)}
                  disabled={isUpdatingMilestone}
                  className="mt-0.5 text-mv-green hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                >
                  {m.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-mv-green" />
                  ) : (
                    <Circle className="w-4 h-4 text-zinc-300 hover:text-zinc-500" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold',
                        m.completed ? 'bg-mv-green/15 text-mv-green' : 'bg-zinc-200/80 text-zinc-700'
                      )}
                      style={MONO}
                    >
                      {m.target_day}
                    </span>
                    <span className={cn('text-xs font-bold truncate', m.completed && 'line-through text-mv-ink/70')}>
                      {m.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-mv-ink-soft mt-0.5 leading-relaxed">
                    {m.description}
                  </p>
                  {m.completed_at && (
                    <span className="text-[9.5px] font-mono text-mv-ink-faint mt-1 block">
                      Validé le {new Date(m.completed_at).toLocaleDateString('fr-CA')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Column: Net Margin ROI Calculator ── */}
        <div className="p-4 rounded-xl bg-mv-cream-soft/70 border border-mv-border space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-mv-ink-soft">
                ROI Marge Nette Protégée (Direct)
              </span>
              <button
                type="button"
                onClick={() => setEditingMetrics(!editingMetrics)}
                className="text-[10.5px] font-semibold text-mv-green hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>{editingMetrics ? 'Fermer' : 'Ajuster'}</span>
              </button>
            </div>

            {/* Big Margin Number */}
            <div className="mt-2.5">
              <div className="text-2xl font-bold text-mv-green font-mono tracking-tight" style={MONO}>
                + {(client.trial_net_margin_saved_cad || estimatedMarginSaved).toLocaleString('fr-CA')} $ CAD
              </div>
              <p className="text-[10.5px] text-mv-ink-faint mt-0.5">
                Marge nette conservée en cuisine (0% commission vs plateformes à 28%)
              </p>
            </div>

            {/* Metrics Breakdown */}
            {editingMetrics ? (
              <div className="mt-3.5 p-3 rounded-lg bg-white border border-mv-border space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-mv-ink-soft mb-1">
                    Commandes directes enregistrées
                  </label>
                  <input
                    type="number"
                    value={ordersCount}
                    onChange={(e) => setOrdersCount(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-mv-cream-soft border border-mv-border text-xs font-mono"
                    style={MONO}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-mv-ink-soft mb-1">
                    Volume d'affaires direct ($ CAD)
                  </label>
                  <input
                    type="number"
                    value={directVolume}
                    onChange={(e) => setDirectVolume(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-mv-cream-soft border border-mv-border text-xs font-mono"
                    style={MONO}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveMetrics}
                  className="w-full py-1.5 rounded bg-mv-green text-white text-xs font-bold hover:bg-mv-green-dark transition-colors cursor-pointer"
                >
                  Sauvegarder les métriques
                </button>
              </div>
            ) : (
              <div className="mt-3.5 space-y-2 pt-2 border-t border-mv-border/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-mv-ink-soft">Commandes directes :</span>
                  <span className="font-bold font-mono text-mv-ink" style={MONO}>
                    {client.trial_direct_orders_count || ordersCount} commandes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-mv-ink-soft">Ventes directes sans tiers :</span>
                  <span className="font-bold font-mono text-mv-ink" style={MONO}>
                    {(client.trial_direct_volume_cad || directVolume).toLocaleString('fr-CA')} $ CAD
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-mv-border/80 flex items-center justify-between text-[11px] text-mv-ink-soft">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-mv-green" />
              <span>Garantie 0% commission</span>
            </span>
            <a
              href="https://minervaflow.framer.website/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mv-green font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Minerva Flow</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
