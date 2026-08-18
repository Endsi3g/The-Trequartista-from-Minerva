'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Calendar,
  DollarSign,
  CheckCircle2,
  ListChecks,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

interface CoPilotageTrackerProps {
  clientId: string;
  clientName: string;
  initialMrr?: number;
}

interface ReviewSession {
  id: string;
  date: string;
  durationMin: number;
  author: string;
  metricNotes: string;
  nextLever: string;
}

export function CoPilotageTracker({ clientId, clientName, initialMrr = 300 }: CoPilotageTrackerProps) {
  const { toastSuccess } = useToast();

  const [tier, setTier] = useState<'300' | '500' | 'custom' | 'none'>(
    initialMrr >= 500 ? '500' : initialMrr >= 300 ? '300' : '300'
  );
  const [customPrice, setCustomPrice] = useState(initialMrr || 400);
  const [nextSessionDate, setNextSessionDate] = useState('2026-09-02');

  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    step1: true,
    step2: true,
    step3: false,
    step4: false,
  });

  const [sessions, setSessions] = useState<ReviewSession[]>([
    {
      id: 'session-1',
      date: '2026-08-05',
      durationMin: 60,
      author: 'Direction Minerva',
      metricNotes: 'Temps de réponse formulaire réduit de 4h à 3 min. Taux de conversion devis passé de 12% à 24%.',
      nextLever: 'Activer le rappel automatique SMS (Missed-Call Text-Back) pour récupérer ~6 leads perdus/semaine.',
    },
  ]);

  const [newNotes, setNewNotes] = useState('');
  const [newLever, setNewLever] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotes && !newLever) return;

    const newEntry: ReviewSession = {
      id: `session-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      durationMin: 60,
      author: 'Équipe Minerva',
      metricNotes: newNotes || 'Revue mensuelle des métriques et stabilité des automatisations.',
      nextLever: newLever || 'Poursuite de l’optimisation du tunnel de conversion.',
    };

    setSessions([newEntry, ...sessions]);
    setNewNotes('');
    setNewLever('');
    setShowAddForm(false);
    toastSuccess('Session enregistrée', 'La revue mensuelle de co-pilotage a été consignée.');
  };

  const monthlyPrice = tier === '300' ? 300 : tier === '500' ? 500 : tier === 'custom' ? customPrice : 0;

  return (
    <div className="bg-mv-surface border border-mv-border rounded-[8px] p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[5px] bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <span>Co-Pilotage Mensuel & Suivi de Valeur</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.2 rounded border border-emerald-200">
                {monthlyPrice > 0 ? `${monthlyPrice} $/mois` : 'Inactif'}
              </span>
            </h3>
            <p className="text-[11.5px] text-zinc-500">
              1 heure/mois d’audit des métriques, ajustements légers et identification du prochain levier (Pilier 3 Agence).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as any)}
            className="h-7 px-2 text-[11px] font-medium bg-zinc-50 border border-zinc-200 rounded text-zinc-700 cursor-pointer"
          >
            <option value="300">Formule Starter (300 $/m)</option>
            <option value="500">Formule Croissance (500 $/m)</option>
            <option value="custom">Tarif Personnalisé</option>
            <option value="none">Désactivé</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-[6px] bg-zinc-50 border border-zinc-200/80 space-y-1">
          <span className="text-[10.5px] font-medium text-zinc-500 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span>Récurrence mensuelle</span>
          </span>
          <p className="text-base font-bold text-zinc-900">{monthlyPrice} $ CAD <span className="text-xs text-zinc-400 font-normal">/ mois</span></p>
        </div>

        <div className="p-3 rounded-[6px] bg-zinc-50 border border-zinc-200/80 space-y-1">
          <span className="text-[10.5px] font-medium text-zinc-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>Format d’accompagnement</span>
          </span>
          <p className="text-base font-bold text-zinc-900">1h / mois <span className="text-xs text-zinc-400 font-normal">(Visio/Loom)</span></p>
        </div>

        <div className="p-3 rounded-[6px] bg-zinc-50 border border-zinc-200/80 space-y-1">
          <span className="text-[10.5px] font-medium text-zinc-500 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-600" />
            <span>Prochaine revue planifiée</span>
          </span>
          <input
            type="date"
            value={nextSessionDate}
            onChange={(e) => setNextSessionDate(e.target.value)}
            className="text-xs font-semibold text-zinc-800 bg-transparent border-0 p-0 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Standard 4-Step Monthly Review Checklist */}
      <div className="bg-emerald-50/40 border border-emerald-200/70 rounded-[6px] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
          <span className="flex items-center gap-1.5">
            <ListChecks className="w-3.5 h-3.5 text-emerald-700" />
            <span>Protocole Revue Mensuelle (Checklist 1-Heure)</span>
          </span>
          <span className="text-[11px] font-mono text-emerald-800">
            {Object.values(checklist).filter(Boolean).length}/4 étapes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { key: 'step1', label: '1. Revue métriques clés (leads, commandes, temps économisé)' },
            { key: 'step2', label: '2. Audit santé technique & stabilité des automatisations' },
            { key: 'step3', label: '3. Application d’un ajustement mineur immédiat' },
            { key: 'step4', label: '4. Identification & cadrage du prochain levier de croissance' },
          ].map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2 p-1.5 rounded bg-white border border-emerald-100 cursor-pointer hover:bg-emerald-50/60 transition-colors"
            >
              <input
                type="checkbox"
                checked={checklist[key]}
                onChange={(e) => setChecklist((prev) => ({ ...prev, [key]: e.target.checked }))}
                className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
              />
              <span className={cn('text-[11.5px] font-medium text-zinc-700', checklist[key] && 'text-emerald-900')}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Review Sessions History */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
            <span>Historique des Revues Mensuelles ({sessions.length})</span>
          </h4>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>{showAddForm ? 'Fermer' : 'Consigner une revue 1h'}</span>
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddSession} className="p-3 bg-zinc-50 border border-zinc-200 rounded-[6px] space-y-2.5 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-700">Faits saillants & Métriques observées</label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Ex: Taux de conversion augmenté de 15%, 8 heures économisées sur la saisie..."
                rows={2}
                className="w-full p-2 text-xs bg-white border border-zinc-200 rounded focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-700">Prochain levier d’optimisation identifié</label>
              <input
                type="text"
                value={newLever}
                onChange={(e) => setNewLever(e.target.value)}
                placeholder="Ex: Mise en place du module de relance SMS automatique..."
                className="w-full h-8 px-2 text-xs bg-white border border-zinc-200 rounded focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded text-xs"
              >
                Enregistrer la revue
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {sessions.map((session) => (
            <div key={session.id} className="p-3 rounded-[6px] border border-zinc-200/80 bg-white space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="font-semibold text-zinc-800">{session.date} • Revue 60 min</span>
                <span>{session.author}</span>
              </div>
              <p className="text-zinc-700 leading-relaxed text-[11.5px]">{session.metricNotes}</p>
              {session.nextLever && (
                <div className="pt-1 border-t border-zinc-100 flex items-start gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/50 p-1.5 rounded">
                  <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Prochain levier :</strong> {session.nextLever}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
