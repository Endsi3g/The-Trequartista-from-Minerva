'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, AlertCircle, ShieldCheck, Sparkles, Rocket, RefreshCw } from 'lucide-react';
import { INITIAL_LAUNCH_CHECKITEMS } from '@/lib/mock-data';
import confetti from 'canvas-confetti';

export default function LaunchCheckPage() {
  const [items, setItems] = useState(INITIAL_LAUNCH_CHECKITEMS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const scorePct = Math.round((checkedCount / totalCount) * 100);
  const isComplete = checkedCount === totalCount;

  const toggleCheck = (id: number) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        const nextState = !item.checked;
        return { ...item, checked: nextState };
      }
      return item;
    });

    setItems(updated);

    const newCheckedCount = updated.filter((i) => i.checked).length;
    if (newCheckedCount === totalCount) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1c9a6f', '#dfff5f', '#ffffff'],
      });
      setIsModalOpen(true);
    }
  };

  const resetAll = () => {
    setItems(items.map((i) => ({ ...i, checked: false })));
  };

  return (
    <div className="space-y-8">
      {/* Header Banner & Score */}
      <div className="bg-mv-surface border border-mv-border rounded-xl p-6 shadow-mv-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-extrabold text-mv-ink font-display">
              Checklist Qualité 20-Points (Launch Standards)
            </h1>
            <Badge variant={isComplete ? 'green' : 'amber'}>
              {isComplete ? '● 100% Conforme' : '● Validation en cours'}
            </Badge>
          </div>
          <p className="text-xs text-mv-ink-soft mt-1">
            Projet : <strong>Apex Roofing — Refonte Framer</strong>. Validation obligatoire avant le passage en production.
          </p>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-mv-ink font-mono tracking-tight">
              {scorePct}%
            </span>
            <span className="text-xs text-mv-ink-soft font-semibold">
              ({checkedCount}/{totalCount} Valides)
            </span>
          </div>

          <div className="w-56 h-3 bg-mv-border rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isComplete ? 'bg-mv-lime' : 'bg-mv-green'
              }`}
              style={{ width: `${scorePct}%` }}
            />
          </div>
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
                    ? 'bg-mv-green border-mv-green text-mv-lime animate-mv-check-pop'
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
            <div className="w-16 h-16 rounded-full bg-mv-green-tint border border-mv-green flex items-center justify-center mx-auto text-mv-lime">
              <Sparkles className="w-8 h-8 animate-mv-leaf-breathe" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-mv-ink font-display">
                Projet Prêt pour la Production !
              </h3>
              <p className="text-xs text-mv-ink-soft mt-2 leading-relaxed">
                Les 20 critères de qualité Minerva ont été vérifiés et certifiés pour <strong>Apex Roofing</strong>. Le site est officiellement autorisé à être publié.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-mv-green-tint border border-mv-green/30 text-xs text-mv-green font-bold">
              ✔ Conformité Loi 25 • Temps de chargement &lt; 1.8s • SEO & Analytics OK
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setIsModalOpen(false)}
              >
                Fermer
              </Button>
              <Button
                variant="lime"
                className="flex-1"
                onClick={() => {
                  alert('Publication en cours via Vercel / Framer Webhooks...');
                  setIsModalOpen(false);
                }}
              >
                Confirmer la Publication
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
