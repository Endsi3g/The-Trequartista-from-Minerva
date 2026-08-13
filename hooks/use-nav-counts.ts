'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface NavCounts {
  leads: number | null;
  clients: number | null;
  projects: number | null;
  myTasks: number | null;
}

export function useNavCounts(): NavCounts {
  const [counts, setCounts] = useState<NavCounts>({ leads: null, clients: null, projects: null, myTasks: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [leads, clients, projects, myTasks] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).neq('status', 'Gagné').neq('status', 'Perdu'),
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        user
          ? supabase
              .from('tasks')
              .select('*', { count: 'exact', head: true })
              .eq('assignee_id', user.id)
              .neq('status', 'done')
          : Promise.resolve({ count: null }),
      ]);
      if (cancelled) return;
      setCounts({
        leads: leads.count ?? null,
        clients: clients.count ?? null,
        projects: projects.count ?? null,
        myTasks: myTasks.count ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return counts;
}
