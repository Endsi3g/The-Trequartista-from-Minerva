'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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

      const [{ data: profile }, { data: notion }] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),
        supabase.from('notion_config').select('id').eq('user_id', user.id).maybeSingle(),
      ]);

      const notifGranted =
        typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
      const academyVisited =
        typeof window !== 'undefined' && localStorage.getItem('mv-visited-academy') === '1';

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
          key: 'academy',
          label: "Explorer l'Académie",
          done: academyVisited,
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
