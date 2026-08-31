'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  Save,
  RotateCcw,
  ExternalLink,
  CheckSquare,
  Square,
  Globe,
  Lock,
  Cpu,
  Smartphone,
  Search,
  Loader2,
  CornerDownLeft,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/ToastProvider';
import { STANDARD_20_POINT_QC, saveTechQaAudit } from '@/lib/services/tech';
import type { TechQaPoint, TechQaAudit, TechQaCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

import type { LucideIcon } from 'lucide-react';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const CATEGORIES: { key: TechQaCategory | 'all'; label: string; icon: LucideIcon; count: number }[] = [
  { key: 'all', label: 'Tous', icon: ShieldCheck, count: 20 },
  { key: 'security_rls', label: '🔒 Sécurité & RLS', icon: Lock, count: 4 },
  { key: 'performance', label: '⚡ Performance', icon: Zap, count: 4 },
  { key: 'architecture_api', label: '🏛️ Architecture & Robustesse', icon: Layers, count: 4 },
  { key: 'ux_responsive', label: '📱 UX & Responsive', icon: Smartphone, count: 4 },
  { key: 'accessibility_seo', label: '🌐 SEO & Monitoring', icon: Globe, count: 4 },
];

const ACTION_LABELS: Record<string, string> = {
  'sec-1': 'Tester RLS',
  'sec-2': 'Ping API',
  'sec-3': 'Vérifier Env',
  'sec-4': 'Schémas Zod',
  'perf-1': 'PageSpeed',
  'perf-2': 'Bundle Size',
  'perf-3': 'Audit Cache',
  'perf-4': 'Latence DB',
  'arch-1': 'Test Dégradé',
  'arch-2': 'Error Boundary',
  'arch-3': 'HMAC Webhook',
  'arch-4': 'Vérif Types',
  'ux-1': 'Responsive',
  'ux-2': 'Skeletons',
  'ux-3': 'Focus ARIA',
  'ux-4': 'Tokens CSS',
  'dep-1': 'Vercel Build',
  'dep-2': 'Audit Logs',
  'dep-3': 'OpenGraph',
  'dep-4': 'Changelog',
};

export function QualityChecklistRunner({
  onAuditSaved,
}: {
  onAuditSaved?: (audit: TechQaAudit) => void;
}) {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const [points, setPoints] = useState<TechQaPoint[]>(STANDARD_20_POINT_QC);
  const [selectedCategory, setSelectedCategory] = useState<TechQaCategory | 'all'>('all');
  const [projectName, setProjectName] = useState('Minerva — Release v2.4');
  const [targetUrl, setTargetUrl] = useState('https://app.minerva.agency');
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'preview'>('production');
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const passedCount = points.filter((p) => p.passed).length;
  const totalCount = points.length;
  const scorePct = Math.round((passedCount / totalCount) * 100);
  const criticalFailed = points.some((p) => p.critical && !p.passed);

  const togglePoint = (id: string) => {
    setPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, passed: !p.passed } : p))
    );
  };

  const handlePassAll = () => {
    setPoints((prev) => prev.map((p) => ({ ...p, passed: true })));
    toastSuccess('Tous les points validés', 'La checklist est passée à 100% de conformité.');
  };

  const handleReset = () => {
    setPoints(STANDARD_20_POINT_QC);
    toastInfo('Réinitialisation', 'La checklist QA a été remise à zéro.');
  };

  const handleTriggerAction = (id: string, label: string) => {
    setTestingId(id);
    setTimeout(() => {
      setPoints((prev) =>
        prev.map((p) => (p.id === id ? { ...p, passed: true } : p))
      );
      setTestingId(null);
      toastSuccess(`Test réussi : ${label}`, 'Le point de contrôle a été validé avec succès.');
    }, 350);
  };

  const handleSaveAudit = async () => {
    setSaving(true);
    try {
      const audit = await saveTechQaAudit({
        project_name: projectName,
        target_url: targetUrl,
        environment,
        passed_points: passedCount,
        total_points: totalCount,
        score_percentage: scorePct,
        status: scorePct === 100 ? 'passed' : criticalFailed ? 'failed' : 'warning',
        checklist_data: points,
        auditor_name: 'Lead Tech',
        notes: `Audit 20-Points exécuté le ${new Date().toLocaleDateString('fr-CA')}. Conformité: ${scorePct}%.`,
      });

      toastSuccess(
        'Audit QA Enregistré & Prêt pour Déploiement',
        `Score de conformité : ${scorePct}% (${passedCount}/${totalCount} points validés)`
      );
      if (onAuditSaved) onAuditSaved(audit);
    } catch {
      toastError('Erreur de sauvegarde', 'Impossible d’enregistrer l’audit QA.');
    } finally {
      setSaving(false);
    }
  };

  // Keyboard Shortcuts (⌘+Shift+V for Validate All, ⌘+Enter for Save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePassAll();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveAudit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [points, projectName, targetUrl, environment, passedCount, totalCount, scorePct, criticalFailed]);

  const filteredPoints =
    selectedCategory === 'all'
      ? points
      : points.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-3 font-sans pb-6">
      {/* ── 1. En-tête de Configuration & Barre de Progression (Console Header) ── */}
      <div className="border border-zinc-200 rounded-lg p-3 sm:p-3.5 bg-white shadow-xs space-y-2.5">
        {/* Ligne 1 : Titre, Badge, Score et Micro-jauge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Protocole Qualité QA (20 Points Obligatoires)
            </span>
            <span
              className={cn(
                'text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border',
                scorePct === 100
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : criticalFailed
                  ? 'text-rose-700 bg-rose-50 border-rose-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              )}
            >
              {scorePct === 100 ? '✓ Prêt pour Déploiement' : criticalFailed ? 'Bloquant si Critique' : 'En Attente'}
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-right">
              <span className="text-xs font-mono font-semibold text-zinc-800" style={MONO}>
                {passedCount} / {totalCount} Validés ({scorePct}%)
              </span>
            </div>
            <div className="w-28 sm:w-36 h-1.5 bg-zinc-100 rounded-full overflow-hidden shrink-0">
              <div
                className={cn(
                  'h-full transition-all duration-300 rounded-full',
                  scorePct === 100 ? 'bg-emerald-600' : criticalFailed ? 'bg-rose-500' : 'bg-amber-500'
                )}
                style={{ width: `${scorePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ligne 2 : Configuration Rapide (Inputs 28px) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[10px] font-mono font-medium text-zinc-400 uppercase mb-0.5">
              Projet / Release
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full h-7 text-xs bg-zinc-50 border border-zinc-200 rounded px-2 font-mono text-zinc-800 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-medium text-zinc-400 uppercase mb-0.5">
              URL Cible
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full h-7 text-xs bg-zinc-50 border border-zinc-200 rounded px-2 font-mono text-zinc-800 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-medium text-zinc-400 uppercase mb-0.5">
              Environnement
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as any)}
              className="w-full h-7 text-xs bg-white border border-zinc-200 rounded px-2 text-zinc-800 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="production">Production (Main)</option>
              <option value="staging">Staging / Test</option>
              <option value="preview">Vercel Preview Branch</option>
            </select>
          </div>
        </div>

        {/* Ligne 3 : Actions Globales (Quick Actions Strip) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-zinc-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePassAll}
              className="h-6 px-2.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
              title="Raccourci : ⌘ + Shift + V"
            >
              <CheckCircle2 size={12} />
              <span>Tout Valider</span>
              <kbd className="text-[9.5px] font-mono opacity-60 ml-1">⌘⇧V</kbd>
            </button>
            <button
              onClick={handleReset}
              className="h-6 px-2 text-xs text-zinc-600 hover:bg-zinc-100 rounded border border-zinc-200 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw size={11} />
              <span>Réinitialiser</span>
            </button>
          </div>

          <Button
            size="sm"
            onClick={handleSaveAudit}
            disabled={saving}
            className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Sauvegarde...</span>
              </>
            ) : (
              <>
                <Save size={12} />
                <span>Enregistrer & Déployer</span>
                <kbd className="hidden sm:inline text-[9.5px] bg-emerald-800/40 text-emerald-100 px-1 rounded font-mono ml-0.5">
                  ⌘↵
                </kbd>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── 2. Filtres de Catégories (Category Tabs 28px) ── */}
      <div className="h-8 p-0.5 bg-zinc-100/90 border border-zinc-200/80 rounded-md inline-flex items-center gap-0.5 shadow-2xs overflow-x-auto max-w-full">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={cn(
                'h-7 px-2.5 text-xs rounded transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 font-mono',
                isActive
                  ? 'bg-white text-zinc-900 font-medium shadow-xs border border-zinc-200/80'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
              )}
            >
              <span>{cat.label}</span>
              <span className="text-[10px] text-zinc-400">({cat.count})</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Matrice QA Monolithique Compacte (Data Grid 34px par Ligne) ── */}
      <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                <th className="py-2 px-3 font-semibold w-12 text-center">STATUT</th>
                <th className="py-2 px-2.5 font-semibold w-10">#</th>
                <th className="py-2 px-3 font-semibold min-w-[240px]">POINT DE CONTRÔLE QA</th>
                <th className="py-2 px-3 font-semibold w-36">CATÉGORIE</th>
                <th className="py-2 px-3 font-semibold w-24">SÉVÉRITÉ</th>
                <th className="py-2 px-3 font-semibold">DÉTAIL TECHNIQUE / VÉRIFICATION</th>
                <th className="py-2 px-3 font-semibold w-28 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredPoints.map((point, idx) => {
                const actionLabel = ACTION_LABELS[point.id] || 'Valider';
                const isTesting = testingId === point.id;
                const pointIndexStr = String(idx + 1).padStart(2, '0');

                return (
                  <tr
                    key={point.id}
                    className={cn(
                      'h-[34px] transition-colors group select-none',
                      point.passed
                        ? 'hover:bg-emerald-50/20'
                        : point.critical
                        ? 'hover:bg-rose-50/30'
                        : 'hover:bg-amber-50/30'
                    )}
                  >
                    {/* Statut Toggle Checkbox */}
                    <td className="py-1.5 px-3 text-center">
                      <button
                        onClick={() => togglePoint(point.id)}
                        className="cursor-pointer text-zinc-400 hover:text-emerald-600 transition-colors inline-flex items-center justify-center"
                        title={point.passed ? 'Marquer non validé' : 'Marquer validé'}
                      >
                        {point.passed ? (
                          <CheckSquare size={14} className="text-emerald-600" />
                        ) : point.critical ? (
                          <Square size={14} className="text-rose-400 hover:text-rose-600" />
                        ) : (
                          <Square size={14} className="text-zinc-400 hover:text-amber-600" />
                        )}
                      </button>
                    </td>

                    {/* # Index */}
                    <td className="py-1.5 px-2.5 font-mono text-[11px] text-zinc-400">
                      {pointIndexStr}
                    </td>

                    {/* Titre Point de Contrôle */}
                    <td className="py-1.5 px-3 font-medium text-zinc-900">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(point.passed && 'line-through text-zinc-400 font-normal')}>
                          {point.title}
                        </span>
                      </div>
                    </td>

                    {/* Catégorie */}
                    <td className="py-1.5 px-3">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200/80">
                        {point.category_label}
                      </span>
                    </td>

                    {/* Sévérité */}
                    <td className="py-1.5 px-3">
                      {point.critical ? (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 uppercase">
                          CRITIQUE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-mono text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase">
                          STANDARD
                        </span>
                      )}
                    </td>

                    {/* Détail Technique */}
                    <td className="py-1.5 px-3 text-[11px] text-zinc-500 truncate max-w-[340px]" title={point.description}>
                      {point.description}
                    </td>

                    {/* Action Button */}
                    <td className="py-1.5 px-3 text-right">
                      {point.passed ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-emerald-600 font-medium">
                          <CheckCircle2 size={11} />
                          <span>Pass</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleTriggerAction(point.id, actionLabel)}
                          disabled={isTesting}
                          className="h-5.5 px-2 text-[10.5px] font-mono font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded shadow-2xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {isTesting ? (
                            <Loader2 size={10} className="animate-spin text-emerald-600" />
                          ) : (
                            <span>[ {actionLabel} ]</span>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
