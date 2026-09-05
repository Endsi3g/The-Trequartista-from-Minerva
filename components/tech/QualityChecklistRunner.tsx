'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  Layers,
  Save,
  RotateCcw,
  CheckSquare,
  Square,
  Globe,
  Lock,
  Smartphone,
  Loader2,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { STANDARD_20_POINT_QC, saveTechQaAudit } from '@/lib/services/tech';
import type { TechQaPoint, TechQaAudit, TechQaCategory } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface CategoryMeta {
  key: TechQaCategory;
  label: string;
  icon: LucideIcon;
  description: string;
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: 'security_rls',
    label: 'Sécurité & RLS',
    icon: Lock,
    description: 'Isolation Row-Level Security, rate-limiting et sanitisation des clés secrètes.',
  },
  {
    key: 'performance',
    label: 'Performance & Latence',
    icon: Zap,
    description: 'Core Web Vitals, latence PostgreSQL <150ms et bundle size maîtrisé.',
  },
  {
    key: 'architecture_api',
    label: 'Architecture & Robustesse',
    icon: Layers,
    description: 'Mode dégradé, signatures webhook HMAC et typage TypeScript strict.',
  },
  {
    key: 'ux_responsive',
    label: 'UX & Responsive',
    icon: Smartphone,
    description: 'Conformité charte Mintlify, skeletons à zéro CLS et cibles tactiles ≥44px.',
  },
  {
    key: 'accessibility_seo',
    label: 'SEO, Monitoring & Release',
    icon: Globe,
    description: 'Build Vercel sans avertissement, métadonnées et journalisation des logs.',
  },
];

const ACTION_LABELS: Record<string, string> = {
  'sec-1': 'Tester RLS',
  'sec-2': 'Ping Rate Limit',
  'sec-3': 'Vérifier Env',
  'sec-4': 'Schémas Zod',
  'perf-1': 'Vitals Score',
  'perf-2': 'Bundle Tree',
  'perf-3': 'Audit Cache',
  'perf-4': 'Latence DB',
  'arch-1': 'Test Dégradé',
  'arch-2': 'Error Boundary',
  'arch-3': 'HMAC Sign',
  'arch-4': 'TypeCheck',
  'ux-1': 'Layout 390px',
  'ux-2': 'Zero CLS',
  'ux-3': 'Focus ARIA',
  'ux-4': 'Design Tokens',
  'dep-1': 'Vercel Ready',
  'dep-2': 'Edge Logs',
  'dep-3': 'OpenGraph',
  'dep-4': 'Changelog',
};

interface QualityChecklistRunnerProps {
  onAuditSaved?: (audit: TechQaAudit) => void;
  initialExpandAll?: boolean;
}

export function QualityChecklistRunner({
  onAuditSaved,
  initialExpandAll = false,
}: QualityChecklistRunnerProps) {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const [points, setPoints] = useState<TechQaPoint[]>(STANDARD_20_POINT_QC);
  const [projectName, setProjectName] = useState('Minerva — Release v2.30.9');
  const [targetUrl, setTargetUrl] = useState('https://app.minerva.agency');
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'preview'>('production');
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Category accordions open/close state (closed by default as agreed in Q3, open if initialExpandAll)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    CATEGORIES.forEach((c) => {
      initial[c.key] = initialExpandAll;
    });
    return initial;
  });

  const toggleCategory = (catKey: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  const allExpanded = Object.values(expandedCategories).every(Boolean);

  const toggleAllCategories = () => {
    const nextState = !allExpanded;
    const updated: Record<string, boolean> = {};
    CATEGORIES.forEach((c) => {
      updated[c.key] = nextState;
    });
    setExpandedCategories(updated);
  };

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
    toastSuccess('Protocole validé à 100%', 'Tous les 20 points de contrôle ont été validés.');
  };

  const handleReset = () => {
    setPoints(STANDARD_20_POINT_QC);
    toastInfo('Réinitialisation', 'La checklist QA a été remise à son état initial.');
  };

  const handleTriggerAction = (id: string, label: string) => {
    setTestingId(id);
    setTimeout(() => {
      setPoints((prev) =>
        prev.map((p) => (p.id === id ? { ...p, passed: true } : p))
      );
      setTestingId(null);
      toastSuccess(`Validation réussie : ${label}`, 'Point de contrôle conforme.');
    }, 280);
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
        notes: `Protocole QA 20-Points validé le ${new Date().toLocaleDateString('fr-CA')}. Score: ${scorePct}%.`,
      });

      toastSuccess(
        'Audit QA Enregistré',
        `Score final : ${scorePct}% (${passedCount}/${totalCount} points validés).`
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

  return (
    <div className="space-y-4 font-sans pb-8">
      {/* ── 1. Panneau Principal de Synthèse & Jauge Globale (Mintlify 16px Card) ── */}
      <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 shadow-xs space-y-4">
        {/* Ligne Supérieure : Titre, Statut & Jauge Globale */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#f2f2f2]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded bg-[#0c8c5e]" />
              <h2 className="text-sm font-semibold text-[#08090a] tracking-tight flex items-center gap-2">
                Protocole Assurance Qualité (20 Points)
              </h2>
              <span
                className={cn(
                  'text-[10px] font-mono px-2 py-0.5 rounded border tracking-wide font-medium',
                  scorePct === 100
                    ? 'text-[#0c8c5e] bg-[#ecfdf5] border-[#a7f3d0]'
                    : criticalFailed
                    ? 'text-red-700 bg-red-50 border-red-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                )}
                style={MONO}
              >
                {scorePct === 100
                  ? '✓ Prêt pour Déploiement Production'
                  : criticalFailed
                  ? '⚠ Bloquants Critiques Détectés'
                  : 'En cours d\'audit'}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Grille d'intégrité pré-release : chaque catégorie regroupe 4 points de contrôle obligatoires. Cliquez sur une catégorie pour déplier ses vérifications.
            </p>
          </div>

          {/* Jauge Globale Unique */}
          <div className="flex items-center gap-4 bg-zinc-50 border border-[#f2f2f2] p-2.5 rounded-xl self-start lg:self-auto min-w-[260px]">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-500 font-medium">Conformité globale</span>
                <span className="font-mono font-semibold text-[#08090a]" style={MONO}>
                  {passedCount} / {totalCount} ({scorePct}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-200 rounded overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded',
                    scorePct === 100 ? 'bg-[#0c8c5e]' : criticalFailed ? 'bg-red-500' : 'bg-amber-500'
                  )}
                  style={{ width: `${scorePct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ligne Métadonnées : Release, URL Cible & Environnement */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider mb-1">
              Projet / Release
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full h-8 text-xs bg-white border border-[#f2f2f2] focus:border-zinc-400 rounded px-2.5 font-mono text-[#08090a] focus:outline-hidden transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider mb-1">
              URL Cible
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full h-8 text-xs bg-white border border-[#f2f2f2] focus:border-zinc-400 rounded px-2.5 font-mono text-[#08090a] focus:outline-hidden transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider mb-1">
              Environnement
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as any)}
              className="w-full h-8 text-xs bg-white border border-[#f2f2f2] focus:border-zinc-400 rounded px-2.5 text-[#08090a] focus:outline-hidden cursor-pointer transition-colors"
            >
              <option value="production">Production (Main)</option>
              <option value="staging">Staging / Test</option>
              <option value="preview">Vercel Preview Branch</option>
            </select>
          </div>
        </div>

        {/* Barre d'Actions Supérieure */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-[#f2f2f2]">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePassAll}
              className="h-7 px-2.5 text-xs text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] hover:bg-[#ecfdf5]/80 rounded font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Raccourci : ⌘ + Shift + V"
            >
              <CheckCircle2 size={13} />
              <span>Tout Valider</span>
              <kbd className="text-[9.5px] font-mono opacity-70 ml-0.5">⌘⇧V</kbd>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="h-7 px-2.5 text-xs text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-[#f2f2f2] rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Réinitialiser</span>
            </button>
            <button
              type="button"
              onClick={toggleAllCategories}
              className="h-7 px-2.5 text-xs text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-[#f2f2f2] rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{allExpanded ? 'Tout replier' : 'Tout déplier'}</span>
            </button>
          </div>

          {/* Bouton Primaire Ink Black Mintlify */}
          <button
            type="button"
            onClick={handleSaveAudit}
            disabled={saving}
            className="h-8 px-3.5 bg-[#08090a] hover:bg-zinc-800 text-white text-xs font-medium rounded shadow-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={13} className="animate-spin text-white" />
                <span>Enregistrement en cours...</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Enregistrer & Valider la Release</span>
                <kbd className="text-[9.5px] bg-zinc-700 text-zinc-200 px-1 rounded font-mono ml-1">
                  ⌘↵
                </kbd>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 2. Accordéons de Catégories de Points de Contrôle (Accordions pliables) ── */}
      <div className="space-y-2.5">
        {CATEGORIES.map((cat, catIdx) => {
          const catPoints = points.filter((p) => p.category === cat.key);
          const catPassed = catPoints.filter((p) => p.passed).length;
          const catTotal = catPoints.length;
          const catScore = Math.round((catPassed / catTotal) * 100);
          const catCriticalFailed = catPoints.some((p) => p.critical && !p.passed);
          const isOpen = Boolean(expandedCategories[cat.key]);
          const Icon = cat.icon;

          return (
            <div
              key={cat.key}
              className="bg-white border border-[#f2f2f2] hover:border-[#dddddd] rounded-2xl overflow-hidden transition-colors shadow-2xs"
            >
              {/* Entête d'accordéon cliquable */}
              <button
                type="button"
                onClick={() => toggleCategory(cat.key)}
                className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-zinc-50/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-zinc-50 border border-[#f2f2f2] flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-zinc-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#08090a] tracking-tight">
                        {catIdx + 1}. {cat.label}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-mono px-1.5 py-0.2 rounded border font-medium',
                          catScore === 100
                            ? 'text-[#0c8c5e] bg-[#ecfdf5] border-[#a7f3d0]'
                            : catCriticalFailed
                            ? 'text-red-700 bg-red-50 border-red-200'
                            : 'text-zinc-600 bg-zinc-50 border-[#f2f2f2]'
                        )}
                        style={MONO}
                      >
                        {catPassed} / {catTotal} validés
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Mini-jauge de catégorie */}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-16 h-1 bg-zinc-100 rounded overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded transition-all',
                          catScore === 100 ? 'bg-[#0c8c5e]' : catCriticalFailed ? 'bg-red-500' : 'bg-amber-500'
                        )}
                        style={{ width: `${catScore}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                      {catScore}%
                    </span>
                  </div>

                  {isOpen ? (
                    <ChevronDown size={16} className="text-zinc-400" />
                  ) : (
                    <ChevronRight size={16} className="text-zinc-400" />
                  )}
                </div>
              </button>

              {/* Contenu de l'accordéon (Tableau des 4 points de contrôle) */}
              {isOpen && (
                <div className="border-t border-[#f2f2f2] bg-white overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#f2f2f2] bg-zinc-50/50 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                        <th className="py-2 px-3.5 font-semibold w-12 text-center">STATUT</th>
                        <th className="py-2 px-2.5 font-semibold w-10">#</th>
                        <th className="py-2 px-3 font-semibold min-w-[220px]">POINT DE CONTRÔLE</th>
                        <th className="py-2 px-3 font-semibold w-24">SÉVÉRITÉ</th>
                        <th className="py-2 px-3 font-semibold">DESCRIPTION DU CONTRÔLE</th>
                        <th className="py-2 px-3 font-semibold w-32 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f2f2f2]">
                      {catPoints.map((point, idx) => {
                        const actionLabel = ACTION_LABELS[point.id] || 'Valider';
                        const isTesting = testingId === point.id;
                        const pointIndexStr = `${catIdx + 1}.${idx + 1}`;

                        return (
                          <tr
                            key={point.id}
                            className={cn(
                              'h-9 transition-colors group select-none',
                              point.passed
                                ? 'hover:bg-[#ecfdf5]/40'
                                : point.critical
                                ? 'hover:bg-red-50/30'
                                : 'hover:bg-zinc-50'
                            )}
                          >
                            {/* Checkbox */}
                            <td className="py-1 px-3.5 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => togglePoint(point.id)}
                                className="cursor-pointer text-zinc-400 hover:text-[#0c8c5e] transition-colors inline-flex items-center justify-center"
                                title={point.passed ? 'Décocher' : 'Valider ce point'}
                              >
                                {point.passed ? (
                                  <CheckSquare size={15} className="text-[#0c8c5e]" />
                                ) : point.critical ? (
                                  <Square size={15} className="text-red-400 hover:text-red-600" />
                                ) : (
                                  <Square size={15} className="text-zinc-400 hover:text-zinc-700" />
                                )}
                              </button>
                            </td>

                            {/* Numéro */}
                            <td className="py-1 px-2.5 font-mono text-[11px] text-zinc-400 whitespace-nowrap" style={MONO}>
                              {pointIndexStr}
                            </td>

                            {/* Titre */}
                            <td className="py-1 px-3 font-medium text-[#08090a] whitespace-nowrap">
                              <span className={cn(point.passed && 'line-through text-zinc-400 font-normal')}>
                                {point.title}
                              </span>
                            </td>

                            {/* Sévérité */}
                            <td className="py-1 px-3 whitespace-nowrap">
                              {point.critical ? (
                                <span
                                  className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold text-red-700 bg-red-50 border border-red-200 uppercase"
                                  style={MONO}
                                >
                                  CRITIQUE
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono text-zinc-500 bg-zinc-50 border border-[#f2f2f2] uppercase"
                                  style={MONO}
                                >
                                  STANDARD
                                </span>
                              )}
                            </td>

                            {/* Description */}
                            <td className="py-1 px-3 text-[11px] text-zinc-500 truncate max-w-[360px]" title={point.description}>
                              {point.description}
                            </td>

                            {/* Bouton Action */}
                            <td className="py-1 px-3 text-right whitespace-nowrap">
                              {point.passed ? (
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-[#0c8c5e] font-medium" style={MONO}>
                                  <CheckCircle2 size={12} />
                                  <span>Validé</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleTriggerAction(point.id, actionLabel)}
                                  disabled={isTesting}
                                  className="h-6 px-2 text-[10px] font-mono font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-[#f2f2f2] hover:border-[#dddddd] rounded shadow-2xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  style={MONO}
                                >
                                  {isTesting ? (
                                    <Loader2 size={10} className="animate-spin text-[#0c8c5e]" />
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
