import Composio from '@composio/client';

// Single fixed "entity" for every Composio connection -- Minerva
// Trequartista is an internal agency tool (one shared company account per
// app), not a multi-tenant product connecting on behalf of end users, so
// every connection is scoped to this one constant rather than per-profile.
export const COMPOSIO_ENTITY_ID = 'minerva-team';

// The apps the agency actually uses, confirmed against the connected
// Composio account (2026-08-15) -- source of truth for what renders on
// /integrations, grouped the same way Settings Integrations 8 groups them.
export const COMPOSIO_APPS: Array<{ slug: string; name: string; category: string; description: string }> = [
  { slug: 'gmail', name: 'Gmail', category: 'Communication', description: 'Envoyer et lire des courriels professionnels.' },
  { slug: 'googlecalendar', name: 'Google Calendar', category: 'Communication', description: 'Synchroniser les rendez-vous et rencontres client.' },
  { slug: 'granola_mcp', name: 'Granola', category: 'Communication', description: "Notes de réunion et transcriptions d'appels." },
  { slug: 'googledrive', name: 'Google Drive', category: 'Stockage', description: 'Stocker et partager des fichiers.' },
  { slug: 'googledocs', name: 'Google Docs', category: 'Stockage', description: 'Documents collaboratifs.' },
  { slug: 'notion', name: 'Notion', category: 'Stockage', description: 'Base de connaissances et SOPs internes.' },
  { slug: 'github', name: 'GitHub', category: 'Développement', description: 'Hébergement de code et collaboration technique.' },
  { slug: 'supabase', name: 'Supabase', category: 'Développement', description: 'Base de données et backend de production.' },
  { slug: 'stripe', name: 'Stripe', category: 'Paiements', description: 'Facturation et liens de paiement client.' },
  { slug: 'brevo', name: 'Brevo', category: 'Marketing', description: 'Envoi de courriels transactionnels et propositions.' },
  { slug: 'calendly', name: 'Calendly', category: 'Marketing', description: 'Réservation de rendez-vous prospects.' },
  { slug: 'facebook', name: 'Facebook', category: 'Marketing', description: 'Publication et gestion de page.' },
  { slug: 'linkedin', name: 'LinkedIn', category: 'Marketing', description: 'Publication et prospection B2B.' },
  { slug: 'youtube', name: 'YouTube', category: 'Marketing', description: 'Publication de contenu vidéo.' },
  { slug: 'google_search_console', name: 'Search Console', category: 'Marketing', description: 'Suivi du référencement des sites clients.' },
  { slug: 'apify', name: 'Apify', category: 'Automatisation', description: "Scraping et automatisation web pour l'acquisition." },
  { slug: 'elevenlabs', name: 'ElevenLabs', category: 'Automatisation', description: 'Synthèse vocale et agent IA conversationnel.' },
];

let client: Composio | null = null;

export function getComposioClient(): Composio {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error('Composio non configuré : la variable d’environnement COMPOSIO_API_KEY est manquante ou invalide.');
  }
  if (!client) {
    client = new Composio({ apiKey });
  }
  return client;
}

export interface ComposioConnectionStatus {
  connected: boolean;
  connectedAccountId: string | null;
  status: string | null;
}

// Real status for every app in COMPOSIO_APPS -- never returns a fabricated
// "connected" state; a Composio API failure (bad key, network) surfaces as
// an honest error string instead of silently reporting everything
// disconnected.
export async function fetchConnectionStatuses(): Promise<
  { statuses: Record<string, ComposioConnectionStatus>; error?: string }
> {
  const empty: Record<string, ComposioConnectionStatus> = {};
  for (const app of COMPOSIO_APPS) {
    empty[app.slug] = { connected: false, connectedAccountId: null, status: null };
  }

  let composio: Composio;
  try {
    composio = getComposioClient();
  } catch (err) {
    return { statuses: empty, error: err instanceof Error ? err.message : 'Composio non configuré' };
  }

  try {
    const result = await composio.connectedAccounts.list({
      user_ids: [COMPOSIO_ENTITY_ID],
      toolkit_slugs: COMPOSIO_APPS.map((a) => a.slug),
      statuses: ['ACTIVE', 'INITIATED', 'INITIALIZING'],
    });
    for (const item of result.items) {
      const slug = item.toolkit.slug;
      if (empty[slug]) {
        empty[slug] = { connected: item.status === 'ACTIVE', connectedAccountId: item.id, status: item.status };
      }
    }
    return { statuses: empty };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return { statuses: empty, error: `Composio a refusé la demande : ${message}` };
  }
}

// Ensures a managed auth config exists for this toolkit (creating one via
// Composio's default managed OAuth app if none exists yet), then initiates
// a connection and returns the redirect URL for the admin to complete
// OAuth in a new tab.
export async function initiateConnection(
  toolkitSlug: string,
  callbackUrl: string
): Promise<{ redirectUrl: string | null; error?: string }> {
  const app = COMPOSIO_APPS.find((a) => a.slug === toolkitSlug);
  if (!app) {
    return { redirectUrl: null, error: `App inconnue : ${toolkitSlug}` };
  }

  let composio: Composio;
  try {
    composio = getComposioClient();
  } catch (err) {
    return { redirectUrl: null, error: err instanceof Error ? err.message : 'Composio non configuré' };
  }

  try {
    const existingConfigs = await composio.authConfigs.list({ toolkit_slug: toolkitSlug, limit: 1 });
    let authConfigId = existingConfigs.items?.[0]?.id;

    if (!authConfigId) {
      const created = await composio.authConfigs.create({ toolkit: { slug: toolkitSlug } });
      authConfigId = created.auth_config.id;
    }

    const connection = await composio.connectedAccounts.create({
      auth_config: { id: authConfigId },
      connection: { user_id: COMPOSIO_ENTITY_ID, callback_url: callbackUrl },
    });

    return { redirectUrl: connection.redirect_url };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return { redirectUrl: null, error: `Composio a refusé la connexion à ${app.name} : ${message}` };
  }
}

export async function disconnectConnection(connectedAccountId: string): Promise<{ success: boolean; error?: string }> {
  let composio: Composio;
  try {
    composio = getComposioClient();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Composio non configuré' };
  }

  try {
    await composio.connectedAccounts.delete(connectedAccountId, { revoke_on_delete: true });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return { success: false, error: `Composio a refusé la déconnexion : ${message}` };
  }
}
