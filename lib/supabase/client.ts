import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

// Module-level singleton: createBrowserClient() being called on every
// import site (services, components, event handlers) produced dozens of
// independent GoTrueClient instances in the same browser context, each
// re-reading localStorage and racing on session refresh. One instance per
// page load is what Supabase expects.
let browserClient: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  if (!browserClient) {
    const { url, anonKey } = getSupabaseEnv();
    browserClient = createBrowserClient(url, anonKey);
  }
  return browserClient;
}
