'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface LatestChangelogEntry {
  id: string;
  title: string;
  version: string | null;
}

// Powers the auto changelog banner -- the single most recent published
// entry, or null if none exist yet (no fictional placeholder entry).
export function useLatestChangelogEntry(): LatestChangelogEntry | null {
  const [entry, setEntry] = useState<LatestChangelogEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('changelog_entries')
        .select('id, title, version')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) setEntry(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return entry;
}
