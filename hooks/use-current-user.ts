'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CurrentUser {
  fullName: string;
  email: string;
  avatarUrl: string;
  role: string;
  loading: boolean;
}

export function useCurrentUser(): CurrentUser {
  const [state, setState] = useState<CurrentUser>({
    fullName: '',
    email: '',
    avatarUrl: '',
    role: 'member',
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      const fullName = profile?.full_name || user.user_metadata?.full_name || '';
      setState({
        fullName,
        email: user.email || '',
        avatarUrl:
          profile?.avatar_url ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || user.email || 'MV')}&backgroundColor=1E4B33&fontColor=ffffff`,
        role: profile?.role || 'member',
        loading: false,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
