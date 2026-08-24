'use client';

import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  GitBranch,
  Layers,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sliders,
  Flame,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type {
  FeatureRequest,
  FeatureRequestCategory,
  FeatureRequestRepo,
  FeatureRequestPriority,
} from '@/lib/types';
import { cn } from '@/lib/utils';

const REPOS: { id: FeatureRequestRepo; label: string; desc: string }[] = [
  { id: 'Minerva-Flow', label: 'Minerva-Flow', desc: 'Commande directe, caisse 0% & cuisine' },
  { id: 'The-Trequartista', label: 'The-Trequartista', desc: 'Tableau de bord & portail agence' },
  { id: 'Minerva-Voice-AI', label: 'Minerva Voice AI', desc: 'Standardiste & agent téléphonique IA' },
  { id: 'Minerva-OS', label: 'Minerva-OS', desc: 'Automatisations & infrastructure interne' },
  { id: 'API & Intégrations', label: 'API & Intégrations', desc: 'POS, Stripe, Resend & Webhooks' },
];

const CATEGORIES: { id: FeatureRequestCategory; label: string }[] = [
  { id: 'feature', label: '✨ Nouvelle fonctionnalité' },
  { id: 'ui_ux', label: '🎨 Design & Ergonomie UX' },
  { id: 'integration', label: '🔌 Intégration tierce / POS' },
  { id: 'automation', label: '⚡ Automatisation & IA' },
  { id: 'optimization', label: '🚀 Performance & Rapidité' },
  { id: 'bug', label: '🛠️ Signalement & Correction' },
];

const PRIORITIES: { id: FeatureRequestPriority; label: string; color: string }[] = [
  { id: 'low', label: 'Basse', color: 'border-zinc-200 text-zinc-600' },
  { id: 'medium', label: 'Moyenne', color: 'border-blue-200 text-blue-700 bg-blue-50/50' },
  { id: 'high', label: 'Haute', color: 'border-amber-200 text-amber-700 bg-amber-50/50' },
  { id: 'urgent', label: 'Critique / Urgent', color: 'border-red-200 text-red-700 bg-red-50/50' },
];

const PRESETS = [
  {
    title: 'Impression automatique des tickets cuisine via imprimante thermique Bluetooth',
    repo: 'Minerva-Flow' as FeatureRequestRepo,
    category: 'feature' as FeatureRequestCategory,
    priority: 'high' as FeatureRequestPriority,
    description: 'Imprimer automatiquement le bon de commande dès validation du paiement sans devoir cliquer manuellement.',
  },
  {
    title: 'Programme de fidélité points & remises automatiques pour les clients récurrents',
    repo: 'Minerva-Flow' as FeatureRequestRepo,
    category: 'feature' as FeatureRequestCategory,
    priority: 'medium' as FeatureRequestPriority,
    description: 'Accorder un plat offert ou 10% de rabais après 5 commandes directes sur notre plateforme.',
  },
  {
    title: 'Export Excel / CSV comptable mensuel des économies de commissions',
    repo: 'The-Trequartista' as FeatureRequestRepo,
    category: 'optimization' as FeatureRequestCategory,
    priority: 'medium' as FeatureRequestPriority,
    description: 'Télécharger en 1 clic le grand livre des commandes et la ventilation TVA pour notre expert-comptable.',
  },
];

interface FeatureRequestFormProps {
  clientId?: string;
  clientName?: string;
  authorName?: string;
  onSubmit: (
    data: Omit<FeatureRequest, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<FeatureRequest | null>;
  onSuccess?: () => void;
  className?: string;
}

export function FeatureRequestForm({
  clientId,
  clientName,
  authorName,
  onSubmit,
  onSuccess,
  className,
}: FeatureRequestFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repo, setRepo] = useState<FeatureRequestRepo>('Minerva-Flow');
  const [category, setCategory] = useState<FeatureRequestCategory>('feature');
  const [priority, setPriority] = useState<FeatureRequestPriority>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const applyPreset = (p: typeof PRESETS[0]) => {
    setTitle(p.title);
    setRepo(p.repo);
    setCategory(p.category);
    setPriority(p.priority);
    setDescription(p.description);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    const created = await onSubmit({
      client_id: clientId || 'c1b2c3d4-0000-0000-0000-000000000001',
      client_name: clientName || undefined,
      author_name: authorName || 'Client Portail',
      title: title.trim(),
      description: description.trim(),
      repo,
      category,
      priority,
      status: 'under_review',
      estimated_delivery: null,
      admin_notes: null,
    });

    setSubmitting(false);

    if (created) {
      setSubmittedSuccess(true);
      setTitle('');
      setDescription('');
      setTimeout(() => {
        setSubmittedSuccess(false);
        onSuccess?.();
      }, 2500);
    }
  };

  return (
    <Card className={cn('overflow-hidden border-zinc-200/80 bg-white shadow-sm', className)}>
      {/* ── Header ── */}
      <div className="p-5 sm:p-6 border-b border-zinc-100 bg-gradient-to-r from-zinc-50 via-white to-zinc-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 font-display">
              Demander une fonctionnalité
            </h2>
            <p className="text-xs text-zinc-500">
              Proposez une évolution ou une intégration. Votre demande est enregistrée directement dans notre backlog technique.
            </p>
          </div>
        </div>

        {/* Quick Suggestion Presets */}
        <div className="mt-4 pt-3 border-t border-zinc-200/60">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>Exemples de demandes fréquentes (cliquez pour pré-remplir) :</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 font-medium transition-colors cursor-pointer text-left truncate max-w-xs"
              >
                + {preset.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
        {submittedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <div className="font-bold">Demande enregistrée avec succès !</div>
              <div>Elle apparaît désormais dans votre onglet <strong>Statut de mes demandes</strong>.</div>
            </div>
          </div>
        )}

        {/* 1. Titre */}
        <div className="space-y-1.5">
          <label htmlFor="fr-title" className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
            Titre de la fonctionnalité <span className="text-red-500">*</span>
          </label>
          <input
            id="fr-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex. Mode sombre sur l'interface de commande / Export comptable CSV"
            className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-xs sm:text-sm bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 transition-all placeholder:text-zinc-400"
          />
        </div>

        {/* 2. Repo / Module Cible & Catégorie */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Repo */}
          <div className="space-y-1.5">
            <label htmlFor="fr-repo" className="block text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
              <span>Module / Repo concerné</span>
            </label>
            <select
              id="fr-repo"
              value={repo}
              onChange={(e) => setRepo(e.target.value as FeatureRequestRepo)}
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-xs sm:text-sm bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 cursor-pointer"
            >
              {REPOS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label} — {r.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Catégorie */}
          <div className="space-y-1.5">
            <label htmlFor="fr-cat" className="block text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <span>Type de demande</span>
            </label>
            <select
              id="fr-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as FeatureRequestCategory)}
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-xs sm:text-sm bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Priorité souhaitée */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
            Niveau de priorité souhaité
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRIORITIES.map((p) => {
              const selected = priority === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={cn(
                    'h-9 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer',
                    selected
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20 font-bold shadow-2xs'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 bg-white'
                  )}
                >
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Description détaillée */}
        <div className="space-y-1.5">
          <label htmlFor="fr-desc" className="block text-xs font-bold text-zinc-800 uppercase tracking-wider">
            Description & Bénéfice attendu <span className="text-red-500">*</span>
          </label>
          <textarea
            id="fr-desc"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez précisément votre besoin, le comportement attendu et la valeur ajoutée pour votre activité..."
            className="w-full p-3 rounded-lg border border-zinc-200 text-xs sm:text-sm bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-zinc-900 transition-all placeholder:text-zinc-400"
          />
        </div>

        {/* ── Submit Button & Realtime Notice ── */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11.5px] text-zinc-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Votre demande sera synchronisée en direct avec l&apos;équipe de développement.</span>
          </div>

          <Button
            type="submit"
            disabled={submitting || !title.trim() || !description.trim()}
            className="w-full sm:w-auto h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Transmission...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Envoyer la demande</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
