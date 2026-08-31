'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchOnboardingStepSopIds, fetchCompletedSopIds } from '@/lib/services/supabase-data';

export interface OnboardingStep {
  key: string;
  label: string;
  done: boolean;
  href: string;
}

export function useOnboardingChecklist() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setLoading(false);
        return;
      }

      const [{ data: profile }, { data: notion }, onboardingSopIds, completedSopIds] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),
        supabase.from('notion_config').select('id').eq('user_id', user.id).maybeSingle(),
        fetchOnboardingStepSopIds(),
        fetchCompletedSopIds(user.id),
      ]);

      const notifGranted =
        typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';

      // Scoped to the curated onboarding path (academy_sops.is_onboarding_step)
      // rather than every SOP in the library -- most SOPs are role-specific
      // (AI engineering, prospection scripts, etc.) and shouldn't gate
      // onboarding completion for a member who'll never touch that role.
      // onboardingSopIds is null on a real fetch error/timeout (as opposed
      // to a genuinely empty list) -- treated as "not done" rather than
      // silently marking the step complete for a member who's read nothing.
      const sopsAllDone =
        onboardingSopIds !== null &&
        (onboardingSopIds.length === 0 || onboardingSopIds.every((id) => completedSopIds.includes(id)));

      if (cancelled) return;
      setSteps([
        {
          key: 'profile',
          label: 'Compléter ton profil (nom et photo)',
          done: !!(profile?.full_name && profile?.avatar_url),
          href: '/profil',
        },
        {
          key: 'notifications',
          label: 'Activer les notifications',
          done: notifGranted,
          href: '#topbar-notif-btn',
        },
        {
          key: 'notion',
          label: 'Connecter Notion',
          done: !!notion,
          href: '/integrations',
        },
        {
          key: 'sops',
          label: 'Compléter le parcours d’intégration de l’Académie',
          done: sopsAllDone,
          href: '/academy',
        },
      ]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const doneCount = steps.filter((s) => s.done).length;
  return { steps, doneCount, total: steps.length, loading };
}
