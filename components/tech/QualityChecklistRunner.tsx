'use client';

import React, { useState } from 'react';
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
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/ToastProvider';
import { STANDARD_20_POINT_QC, saveTechQaAudit } from '@/lib/services/tech';
import type { TechQaPoint, TechQaAudit, TechQaCategory } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const CATEGORIES: { key: TechQaCategory | 'all'; label: string; icon: any }[] = [
  { key: 'all', label: 'Tous les 20 points', icon: ShieldCheck },
  { key: 'security_rls', label: 'Sécurité & RLS', icon: ShieldCheck },
  { key: 'performance', label: 'Performance', icon: Zap },
  { key: 'architecture_api', label: 'Architecture & API', icon: Layers },
  { key: 'ux_responsive', label: 'UX & Responsive', icon: Sparkles },
  { key: 'accessibility_seo', label: 'Accessibilité & SEO', icon: Sparkles },
];

export function QualityChecklistRunner({
  onAuditSaved,
}: {
  onAuditSaved?: (audit: TechQaAudit) => void;
}) {
  const { toastSuccess, toastError } = useToast();
  const [points, setPoints] = useState<TechQaPoint[]>(STANDARD_20_POINT_QC);
  const [selectedCategory, setSelectedCategory] = useState<TechQaCategory | 'all'>('all');
  const [projectName, setProjectName] = useState('Minerva Trequartista — Release v2.4');
  const [targetUrl, setTargetUrl] = useState('https://app.minerva.agency');
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'preview'>('production');
  const [saving, setSaving] = useState(false);

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
        'Audit QA Enregistré',
        `Score de conformité : ${scorePct}% (${passedCount}/${totalCount} points validés)`
      );
      if (onAuditSaved) onAuditSaved(audit);
    } catch {
      toastError('Erreur de sauvegarde', 'Impossible d’enregistrer l’audit QA.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPoints =
    selectedCategory === 'all'
      ? points
      : points.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* ── Control Bar & Score Summary ── */}
      <Card className="p-5 bg-mv-surface border-mv-border rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-mv-green" />
              <h3 className="text-base font-bold font-display text-mv-ink">
                Protocole Qualité 20-Points Obligatoire
              </h3>
              <Badge
                variant={scorePct === 100 ? 'green' : criticalFailed ? 'red' : 'amber'}
                className="font-medium text-xs ml-1"
              >
                {scorePct === 100 ? 'Prêt pour Déploiement' : criticalFailed ? 'Bloquant (Échecs Critiques)' : 'Attention'}
              </Badge>
            </div>
            <p className="text-xs text-mv-ink-soft">
              Grille d’assurance qualité Minerva validant la sécurité RLS, les performances, l’accessibilité et la résilience.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-mv-ink" style={MONO}>
                {scorePct}%
              </div>
              <p className="text-[11px] text-mv-ink-faint">
                {passedCount} / {totalCount} validés
              </p>
            </div>
            <div className="w-28 h-2.5 bg-black/[0.06] rounded-full overflow-hidden shrink-0">
              <div
                className={cn(
                  'h-full transition-all duration-300 rounded-full',
                  scorePct === 100 ? 'bg-mv-green' : criticalFailed ? 'bg-red-500' : 'bg-amber-500'
                )}
                style={{ width: `${scorePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Project details configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-mv-border">
          <div>
            <label className="block text-[10.5px] font-bold text-mv-ink-faint uppercase mb-1">
              Nom du Projet / Release
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border focus:outline-none focus:border-mv-green"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-bold text-mv-ink-faint uppercase mb-1">
              URL Cible
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border focus:outline-none focus:border-mv-green"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-bold text-mv-ink-faint uppercase mb-1">
              Environnement
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as any)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border focus:outline-none focus:border-mv-green cursor-pointer"
            >
              <option value="production">Production (Main)</option>
              <option value="staging">Staging / Test</option>
              <option value="preview">Vercel Preview Branch</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-mv-border">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePassAll}
              className="text-xs cursor-pointer gap-1.5"
            >
              <CheckCircle2 size={13} className="text-mv-green" />
              <span>Tout valider</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-xs cursor-pointer text-mv-ink-soft gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Réinitialiser</span>
            </Button>
          </div>

          <Button
            onClick={handleSaveAudit}
            disabled={saving}
            className="bg-mv-green hover:bg-mv-green/90 text-white text-xs gap-1.5 cursor-pointer"
          >
            <Save size={13} />
            <span>{saving ? 'Sauvegarde...' : 'Enregistrer l’Audit QA'}</span>
          </Button>
        </div>
      </Card>

      {/* ── Category Filters ── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-mv-border pb-2">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.key;
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                isActive
                  ? 'bg-mv-green text-white shadow-xs'
                  : 'text-mv-ink-soft hover:bg-black/[0.04] hover:text-mv-ink'
              )}
            >
              <Icon size={13} className={isActive ? 'text-white' : 'opacity-60'} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Checklist Items Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredPoints.map((point) => {
          return (
            <div
              key={point.id}
              onClick={() => togglePoint(point.id)}
              className={cn(
                'p-3.5 rounded-xl border transition-all cursor-pointer select-none space-y-2 shadow-xs',
                point.passed
                  ? 'bg-mv-surface border-mv-border hover:border-mv-green/50'
                  : point.critical
                  ? 'bg-red-50/50 border-red-200 hover:border-red-300'
                  : 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={cn(
                      'mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors',
                      point.passed
                        ? 'bg-emerald-100 text-emerald-700'
                        : point.critical
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {point.passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-mv-ink">{point.title}</span>
                      {point.critical && (
                        <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 uppercase tracking-wider">
                          Critique
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-mv-ink-soft leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={point.passed ? 'green' : 'neutral'}
                  className="text-[10px] shrink-0 font-medium"
                >
                  {point.category_label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
