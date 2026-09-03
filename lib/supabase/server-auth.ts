import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient as createLegacyClient } from '@supabase/supabase-js';
import { createSupabaseContext } from '@supabase/server';
import {
  createAdminClient,
  createContextClient,
  resolveEnv,
  verifyCredentials,
} from '@supabase/server/core';
import { createClient as createSsrClient } from '@/lib/supabase/server';
import { getSupabaseEnv } from '@/lib/supabase/env';
import type { Profile, Role } from '@/lib/types';

export type AuthMode = 'user' | 'secret' | 'publishable' | 'none';

export interface RouteHandlerAuthOptions {
  /**
   * Mode d'authentification requis :
   * - 'user' : jeton JWT utilisateur (Bearer ou session Cookie SSR)
   * - 'secret' : clé secrète (cron, machine-to-machine, webhook)
   * - 'publishable' : clé publiable anonyme
   * - 'none' : accès public sans authentification requise
   */
  auth: AuthMode | AuthMode[];

  /**
   * Rôle minimal requis pour accéder à la route (uniquement si auth inclut 'user')
   */
  requiredRole?: 'admin' | 'manager' | 'member';

  /**
   * Surcharge de clé secrète optionnelle (ex: CRON_SECRET)
   */
  secretKey?: string;
}

export interface SupabaseRouteContext<TParams = Record<string, string | string[]>> {
  supabase: SupabaseClient;
  supabaseAdmin: SupabaseClient;
  user: User | null;
  profile: Profile | null;
  authMode: AuthMode;
  params: TParams;
}

/**
 * Résout les variables d'environnement Supabase nettoyées pour @supabase/server
 */
export function getResolvedSupabaseEnv(overrideSecret?: string) {
  const { url, anonKey, serviceRoleKey } = getSupabaseEnv();
  const secretKey =
    overrideSecret ||
    process.env.SUPABASE_SECRET_KEY ||
    serviceRoleKey ||
    process.env.CRON_SECRET ||
    '';

  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    anonKey ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  return {
    url,
    publishableKeys: { default: publishableKey },
    secretKeys: { default: secretKey },
  };
}

/**
 * Client admin créé de secours si @supabase/server ne peut pas initialiser
 */
function getFallbackAdminClient(): SupabaseClient {
  const { url, serviceRoleKey, anonKey } = getSupabaseEnv();
  const key = process.env.SUPABASE_SECRET_KEY || serviceRoleKey || anonKey || 'placeholder-key';
  return createLegacyClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Crée le contexte Supabase pour une route Next.js Route Handler
 */
export async function createRouteHandlerContext<TParams = Record<string, string | string[]>>(
  req: Request,
  options: RouteHandlerAuthOptions,
  params: TParams = {} as TParams
): Promise<{ ctx: SupabaseRouteContext<TParams> | null; response: Response | null }> {
  const modes: AuthMode[] = Array.isArray(options.auth) ? options.auth : [options.auth];
  const envConfig = getResolvedSupabaseEnv(options.secretKey);
  const authHeader = req.headers.get('authorization') || '';
  const apiKeyHeader = req.headers.get('apikey') || '';

  // 1. Si mode 'none' autorisé et aucun en-tête d'auth présent
  if (modes.includes('none') && !authHeader && !apiKeyHeader) {
    const adminClient = getFallbackAdminClient();
    return {
      ctx: {
        supabase: adminClient,
        supabaseAdmin: adminClient,
        user: null,
        profile: null,
        authMode: 'none',
        params,
      },
      response: null,
    };
  }

  // 2. Traitement du mode 'secret' (machine-to-machine, crons)
  if (modes.includes('secret')) {
    const secretCandidate =
      apiKeyHeader ||
      (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '');

    const expectedSecrets = [
      process.env.SUPABASE_SECRET_KEY,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      process.env.CRON_SECRET,
      options.secretKey,
    ].filter(Boolean) as string[];

    if (secretCandidate && expectedSecrets.some((s) => s === secretCandidate)) {
      const adminClient = getFallbackAdminClient();
      return {
        ctx: {
          supabase: adminClient,
          supabaseAdmin: adminClient,
          user: null,
          profile: null,
          authMode: 'secret',
          params,
        },
        response: null,
      };
    }
  }

  // 3. Traitement du mode 'user' (Bearer JWT ou Cookies SSR)
  if (modes.includes('user')) {
    let resolvedUser: User | null = null;
    let userClient: SupabaseClient | null = null;

    // 3.1 Essayer d'abord avec @supabase/server via Bearer JWT
    if (authHeader.startsWith('Bearer ')) {
      try {
        const { data: serverCtx, error: serverErr } = await createSupabaseContext(req, {
          auth: 'user',
          env: envConfig,
        });

        if (!serverErr && serverCtx) {
          userClient = serverCtx.supabase;
          // Reconstituer l'utilisateur à partir des claims
          resolvedUser = {
            id: serverCtx.userClaims?.id || '',
            email: serverCtx.userClaims?.email || '',
            app_metadata: (serverCtx.userClaims?.appMetadata as Record<string, any>) || {},
            user_metadata: (serverCtx.userClaims?.userMetadata as Record<string, any>) || {},
            aud: (serverCtx.jwtClaims?.aud as string) || 'authenticated',
            created_at: new Date().toISOString(),
          } as User;
        }
      } catch (e) {
        // En cas d'échec sur le Bearer, on continue vers le fallback cookie
      }
    }

    // 3.2 Si non résolu, se rabattre sur les cookies de session SSR
    if (!resolvedUser) {
      try {
        const ssr = await createSsrClient();
        const { data: { user } } = await ssr.auth.getUser();
        if (user) {
          resolvedUser = user;
          userClient = ssr;
        }
      } catch (cookieErr) {
        // Cookies absents ou expirés
      }
    }

    if (resolvedUser && userClient) {
      const adminClient = getFallbackAdminClient();

      // Récupération du profil Minerva pour vérification RBAC
      let profile: Profile | null = null;
      try {
        const { data: profileData } = await adminClient
          .from('profiles')
          .select('*')
          .eq('id', resolvedUser.id)
          .single();
        if (profileData) profile = profileData as Profile;
      } catch (err) {
        // Profil absent
      }

      // Vérification du rôle requis
      if (options.requiredRole) {
        const userRole = profile?.role || 'member';
        const isAuthorized =
          options.requiredRole === 'member'
            ? true
            : options.requiredRole === 'manager'
            ? userRole === 'admin' || (userRole as string) === 'manager'
            : options.requiredRole === 'admin'
            ? userRole === 'admin'
            : false;

        if (!isAuthorized) {
          return {
            ctx: null,
            response: NextResponse.json(
              { error: `Accès refusé : rôle '${options.requiredRole}' requis.` },
              { status: 403 }
            ),
          };
        }
      }

      return {
        ctx: {
          supabase: userClient,
          supabaseAdmin: adminClient,
          user: resolvedUser,
          profile,
          authMode: 'user',
          params,
        },
        response: null,
      };
    }
  }

  // 4. Si mode 'none' est autorisé en dernier ressort
  if (modes.includes('none')) {
    const adminClient = getFallbackAdminClient();
    return {
      ctx: {
        supabase: adminClient,
        supabaseAdmin: adminClient,
        user: null,
        profile: null,
        authMode: 'none',
        params,
      },
      response: null,
    };
  }

  // Rejet si aucune méthode n'a abouti
  return {
    ctx: null,
    response: NextResponse.json(
      { error: 'Non authentifié. Jeton ou clé API invalide.' },
      { status: 401 }
    ),
  };
}

/**
 * Wrapper de Route Handler unifié pour Next.js App Router
 * Injecte `ctx.supabase`, `ctx.supabaseAdmin`, `ctx.user`, `ctx.profile` et `ctx.authMode`.
 */
export function withSupabaseRouteHandler<TParams = Record<string, string | string[]>>(
  options: RouteHandlerAuthOptions,
  handler: (req: Request, ctx: SupabaseRouteContext<TParams>) => Promise<Response>
) {
  return async (
    req: Request,
    routeCtx?: { params?: Promise<TParams> | TParams }
  ): Promise<Response> => {
    let resolvedParams = {} as TParams;
    if (routeCtx?.params) {
      resolvedParams =
        routeCtx.params instanceof Promise ? await routeCtx.params : routeCtx.params;
    }

    const { ctx, response } = await createRouteHandlerContext(req, options, resolvedParams);
    if (response) {
      return response;
    }

    return handler(req, ctx!);
  };
}
