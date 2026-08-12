'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { useOnboardingChecklist } from '@/hooks/use-onboarding-checklist';
import { cn } from '@/lib/utils';

export function OnboardingChecklist() {
  const { steps, doneCount, total, loading } = useOnboardingChecklist();

  if (loading || total === 0) return null;

  const complete = doneCount === total;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div className="bg-white border border-mv-border rounded-2xl p-6 shadow-mv-sm">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-mv-green" />
        <h3 className="text-base font-extrabold text-mv-ink font-display">
          {complete ? 'Configuration terminée' : 'Bien démarrer sur Minerva'}
        </h3>
      </div>
      <p className="text-xs text-mv-ink-soft mb-4">
        {complete ? 'Ton compte est prêt.' : `${doneCount} sur ${total} étapes complétées.`}
      </p>

      <div className="h-1.5 bg-mv-cream-soft rounded-full overflow-hidden mb-4">
        <div className="h-full bg-mv-green rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.key}>
            <Link
              href={step.href}
              className={cn(
                'flex items-center gap-2.5 text-xs rounded-lg px-2 py-1.5 -mx-2 transition-colors',
                step.done ? 'text-mv-ink-faint' : 'text-mv-ink hover:bg-mv-cream-soft'
              )}
            >
              {step.done ? (
                <CheckCircle2 className="w-4 h-4 text-mv-green shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-mv-ink-faint shrink-0" />
              )}
              <span className={cn(step.done && 'line-through')}>{step.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
