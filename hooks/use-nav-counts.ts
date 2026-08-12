'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface NavCounts {
  leads: number | null;
  clients: number | null;
  projects: number | null;
}

export function useNavCounts(): NavCounts {
  const [counts, setCounts] = useState<NavCounts>({ leads: null, clients: null, projects: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [leads, clients, projects] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).neq('status', 'Gagné').neq('status', 'Perdu'),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
      ]);
      if (cancelled) return;
      setCounts({
        leads: leads.count ?? null,
        clients: clients.count ?? null,
        projects: projects.count ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return counts;
}
