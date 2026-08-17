'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchAppPermissions } from '@/lib/services/supabase-data';
import { useCurrentUser } from '@/hooks/use-current-user';

interface AppPermissionsContextValue {
  loading: boolean;
  /** True if the *signed-in user's role* is allowed to do `key` -- admins
   * always pass, clients never do, members depend on the stored toggle. */
  can: (key: string) => boolean;
  refresh: () => void;
}

const AppPermissionsContext = createContext<AppPermissionsContextValue>({
  loading: true,
  can: () => false,
  refresh: () => {},
});

export function AppPermissionsProvider({ children }: { children: React.ReactNode }) {
  const { role, loading: userLoading } = useCurrentUser();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setPermissions(await fetchAppPermissions());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const can = (key: string) => {
    if (role === 'admin') return true;
    if (role === 'client') return false;
    return permissions[key] === true;
  };

  return (
    <AppPermissionsContext.Provider value={{ loading: loading || userLoading, can, refresh: load }}>
      {children}
    </AppPermissionsContext.Provider>
  );
}

export function useAppPermissions() {
  return useContext(AppPermissionsContext);
}
