'use client';

import React, { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, ShieldCheck, Sparkles, Rocket, RefreshCw, Zap } from 'lucide-react';
import { fetchLaunchChecklist, saveLaunchChecklist, fetchProjects, updateProjectStage, logAuditEvent } from '@/lib/services/supabase-data';
import { invokeLaunchCheckValidator } from '@/lib/services/edge-functions';
import { LaunchCheckItem, Project } from '@/lib/types';
import confetti from 'canvas-confetti';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirm } from '@/components/providers/ConfirmProvider';


export default function LaunchCheckPage() {
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { toastSuccess, toastError } = useToast();
  const confirmDialog = useConfirm();

  const [project, setProject] = useState<Project | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [items, setItems] = useState<LaunchCheckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [edgeValidation, setEdgeValidation] = useState<{ isReadyForProduction: boolean; validatedAt?: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    async function loadChecklist() {
      setLoading(true);
      const [data, projects] = await Promise.all([
        fetchLaunchChecklist(projectId as string),
        fetchProjects(),
      ]);
      setItems(data);
      setProject(projects.find((p) => p.id === projectId) || null);
      setLoading(false);
    }
    loadChecklist();
  }, [projectId]);

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length || 20;
  const scorePct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const isComplete = checkedCount === totalCount && totalCount > 0;

  const toggleCheck = async (id: number) => {
    if (!projectId) return;
    const targetItem = items.find(i => i.id === id);
    const newCheckedState = !targetItem?.checked;

    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, checked: newCheckedState };
      }
      return item;
    });

    setItems(updated);
    const saved = await saveLaunchChecklist(projectId, updated);
    if (!saved) {
      setItems(items);
      toastError('Erreur de sauvegarde', "Impossible d'enregistrer ce changement sur la checklist.");
      return;
    }

    // Call Supabase Edge Function to validate payload
    setIsValidating(true);
    const result = await invokeLaunchCheckValidator(projectId, updated);
    setEdgeValidation(result);
    setIsValidating(false);

    // Log operational audit event
    await logAuditEvent(
      `Validation du critère #${id} (${targetItem?.title}): ${newCheckedState ? 'Coché [OK]' : 'Décoché'}`,
      'project_launch_checks',
      projectId,
      { scorePct: result.scorePct, checkedCount: result.checkedCount }
    );

    if (result.isReadyForProduction || (result.checkedCount === totalCount && totalCount > 0)) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#34d399', '#ffffff'],
      });
      setIsModalOpen(true);
    }
  };

  const resetAll = async () => {
    if (!projectId) return;
    const ok = await confirmDialog({
      title: 'Réinitialiser la checklist ?',
      message: 'Les 20 points seront décochés. Cette action ne peut pas être annulée.',
      confirmLabel: 'Réinitialiser',
      variant: 'danger',
    });
    if (!ok) return;
    const previousItems = items;
    const resetItems = items.map((i) => ({ ...i, checked: false }));
    setItems(resetItems);
    const saved = await saveLaunchChecklist(projectId, resetItems);
    if (!saved) {
      setItems(previousItems);
      toastError('Erreur', "Impossible de réinitialiser la checklist.");
      return;
    }
    await logAuditEvent(
      'Réinitialisation complète de la checklist 20-points',
      'project_launch_checks',
      projectId
    );

  };

  if (!loading && !project) {
    return (
      <div className="p-12 text-center space-y-2">
        <p className="text-sm font-bold text-mv-ink">Projet introuvable.</p>
        <p className="text-xs text-mv-ink-soft">Ce projet n'existe pas ou a été retiré.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner & Score */}
      <div className="bg-mv-surface border border-mv-border rounded-xl p-6 shadow-mv-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-extrabold text-mv-ink font-display">
              Checklist Qualité 20-Points
            </h1>
            <Badge variant={isComplete ? 'green' : 'amber'}>
              {isComplete ? '● 100% Conforme' : '● Validation en cours'}
            </Badge>
          </div>
          <p className="text-xs text-mv-ink-soft mt-1">
            Projet : <strong>{loading ? '...' : `${project?.client_name} — ${project?.name}`}</strong>. Synchronisation des cases cochées en temps réel.
          </p>
        </div>

        {/* Dynamic Radial Gauge Chart */}
        <div className="flex items-center gap-6">
          <GaugeChart score={checkedCount} total={totalCount} label="Qualité Certifiée" />
        </div>

      </div>

      {/* 20 Checkbox Items List */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-mv-green" />
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                Critères d'Excellence Minerva (20 Points)
              </h3>
            </div>
            <button
              onClick={resetAll}
              className="text-xs text-mv-ink-soft hover:text-mv-red flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="h-4 shimmer-bg rounded w-3/4 mx-auto animate-mv-shimmer" />
            <div className="h-4 shimmer-bg rounded w-1/2 mx-auto animate-mv-shimmer" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                  item.checked
                    ? 'bg-mv-green-tint/60 border-mv-green/40'
                    : 'bg-mv-cream-soft border-mv-border hover:border-mv-border/80'
                }`}
              >
                {/* Animated Checkbox */}
                <div
                  className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                    item.checked
                      ? 'bg-mv-green border-mv-green text-mv-warm animate-mv-check-pop'
                      : 'border-mv-ink-mute bg-mv-surface'
                  }`}
                >
                  {item.checked && <CheckCircle2 className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold transition-colors ${
                        item.checked ? 'text-mv-ink line-through opacity-80' : 'text-mv-ink'
                      }`}
                    >
                      {item.id}. {item.title}
                    </span>
                    <span className="text-[10px] font-semibold text-mv-ink-faint px-2 py-0.5 rounded bg-mv-surface border border-mv-border shrink-0">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-mv-ink-soft mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Action Footer */}
      <div className="flex items-center justify-between p-6 bg-mv-surface border border-mv-border rounded-xl">
        <div className="flex items-center gap-3">
          <AlertCircle className={`w-5 h-5 ${isComplete ? 'text-mv-green' : 'text-mv-amber'}`} />
          <span className="text-xs text-mv-ink-soft">
            {isComplete
              ? 'Tous les 20 critères sont validés. Vous pouvez débloquer la mise en production.'
              : `Il reste ${totalCount - checkedCount} critère(s) obligatoire(s) à valider.`}
          </span>
        </div>

        <Button
          variant={isComplete ? 'lime' : 'secondary'}
          size="lg"
          disabled={!isComplete}
          onClick={() => setIsModalOpen(true)}
          icon={<Rocket className="w-4 h-4" />}
        >
          Valider et Publier le Projet
        </Button>
      </div>

      {/* Modal Confirmation 20/20 (mv-scale-in) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-mv-surface border border-mv-green/50 rounded-2xl p-8 max-w-md w-full shadow-mv-lg animate-mv-scale-in text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-mv-green-tint border border-mv-green flex items-center justify-center mx-auto text-mv-green">
              <Sparkles className="w-8 h-8 animate-mv-leaf-breathe" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-mv-ink font-display">
                Projet Prêt pour la Production !
              </h3>
              <p className="text-xs text-mv-ink-soft mt-2 leading-relaxed">
                Les 20 critères de qualité Minerva ont été certifiés et sauvegardés dans la base de données.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setIsModalOpen(false)}>
                Fermer
              </Button>
              <Button
                variant="lime"
                className="flex-1"
                disabled={publishing}
                onClick={async () => {
                  if (!projectId) return;
                  setPublishing(true);
                  const success = await updateProjectStage(projectId, 'Live Production');
                  setPublishing(false);
                  if (!success) {
                    toastError('Erreur', "Impossible de mettre à jour l'étape du projet.");
                    return;
                  }
                  setProject((prev) => (prev ? { ...prev, current_stage: 'Live Production' } : prev));
                  await logAuditEvent(
                    `Projet "${project?.name}" passé en Live Production après validation de la checklist 20-points`,
                    'project_launch_checks',
                    projectId
                  );
                  toastSuccess('Projet publié', 'Le projet est maintenant en Live Production.');
                  setIsModalOpen(false);
                }}
              >
                {publishing ? 'Publication…' : 'Confirmer la Publication'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
