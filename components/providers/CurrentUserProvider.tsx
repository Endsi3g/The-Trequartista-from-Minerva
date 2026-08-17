'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface CurrentUserState {
  fullName: string;
  email: string;
  avatarUrl: string;
  role: string;
  loading: boolean;
  refresh: () => void;
}

const CurrentUserContext = createContext<CurrentUserState | null>(null);

// Single shared fetch for the signed-in profile, instead of every
// useCurrentUser() call site (sidebar, topbar, ~14 pages) running its own
// independent, fetch-once-on-mount query. Without this, updating your
// avatar/name on /profil never reached the topbar or sidebar's own copies
// of the profile -- they simply never re-fetched. Any page that mutates
// the current user's profile should call refresh() afterwards.
export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<CurrentUserState, 'refresh'>>({
    fullName: '',
    email: '',
    avatarUrl: '',
    role: 'member',
    loading: true,
  });

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    const fullName = profile?.full_name || user.user_metadata?.full_name || '';
    setState({
      fullName,
      email: user.email || '',
      avatarUrl:
        profile?.avatar_url ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || user.email || 'MV')}&backgroundColor=059669&fontColor=ffffff`,
      role: profile?.role || 'member',
      loading: false,
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <CurrentUserContext.Provider value={{ ...state, refresh: load }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUserState {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider');
  }
  return ctx;
}
