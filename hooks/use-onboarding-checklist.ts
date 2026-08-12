'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchAcademySops, fetchCompletedSopIds } from '@/lib/services/supabase-data';

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

      const [{ data: profile }, { data: notion }, allSops, completedSopIds] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),
        supabase.from('notion_config').select('id').eq('user_id', user.id).maybeSingle(),
        fetchAcademySops(),
        fetchCompletedSopIds(user.id),
      ]);

      const notifGranted =
        typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';

      // No SOPs published yet -> nothing to require. Once there are some,
      // this only counts as done when every one of them has been completed.
      // Real scoping to "SOPs tied to your specific tasks" needs task
      // delegation (chantier équipe) to exist first — for now it's all SOPs.
      const sopsAllDone = allSops.length === 0 || allSops.every((s) => completedSopIds.includes(s.id));

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
          label: 'Terminer les SOPs liées à tes tâches',
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
