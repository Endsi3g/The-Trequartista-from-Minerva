import { createClient } from '@supabase/supabase-js';

export interface InstagramProfileData {
  username: string;
  fullName: string | null;
  biography: string | null;
  avatarUrl: string | null;
  websiteUrl: string | null;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  isVerified?: boolean;
}

/**
 * Extracts a clean Instagram username from a URL, @handle, or raw string.
 * Examples:
 * - "https://instagram.com/kaelbelceus" -> "kaelbelceus"
 * - "@kaelbelceus" -> "kaelbelceus"
 * - "kaelbelceus" -> "kaelbelceus"
 */
export function parseInstagramUsername(input: string): string | null {
  if (!input) return null;
  let clean = input.trim();
  clean = clean.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '');
  clean = clean.replace(/^@/, '');
  clean = clean.split('/')[0].split('?')[0].split('#')[0].trim();
  // Valid Instagram usernames: 1-30 characters, alphanumeric, periods, underscores
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(clean)) {
    return null;
  }
  return clean.toLowerCase();
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Downloads an image from an external URL and permanently stores it into
 * the Supabase Storage 'contact-photos' bucket so the URL doesn't expire.
 */
async function persistAvatarToSupabase(externalImageUrl: string, username: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return externalImageUrl;

  try {
    const res = await fetch(externalImageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) {
      console.warn(`[Instagram Fetch] Failed to download avatar from ${externalImageUrl} (status ${res.status})`);
      return externalImageUrl;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const filename = `instagram/${username}-${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('contact-photos')
      .upload(filename, buffer, {
        contentType,
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      console.warn('[Instagram Fetch] Supabase storage upload warning:', uploadError);
      return externalImageUrl;
    }

    const { data } = supabase.storage.from('contact-photos').getPublicUrl(filename);
    return data?.publicUrl || externalImageUrl;
  } catch (err) {
    console.warn('[Instagram Fetch] Error persisting avatar:', err);
    return externalImageUrl;
  }
}

/**
 * Scrapes a public Instagram profile using Apify's instagram-profile-scraper actor.
 * Sync endpoint returns items directly without polling.
 */
export async function fetchInstagramProfile(input: string): Promise<InstagramProfileData> {
  const username = parseInstagramUsername(input);
  if (!username) {
    throw new Error('Nom d\'utilisateur ou lien Instagram invalide.');
  }

  const apiKey = process.env.APIFY_API_KEY || process.env.APIFY_TOKEN;
  if (!apiKey) {
    throw new Error('APIFY_API_KEY_MISSING: La clé API Apify n\'est pas configurée dans les variables d\'environnement.');
  }

  // Apify Actor: apify/instagram-profile-scraper
  const apifyEndpoint = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apiKey}&timeout=60`;

  const payload = {
    usernames: [username],
  };

  const response = await fetch(apifyEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('[Apify Instagram] Request failed:', response.status, errorText);
    if (response.status === 401 || response.status === 403) {
      throw new Error('Clé API Apify invalide ou quota dépassé.');
    }
    throw new Error(`Erreur lors de la récupération du profil Instagram (${response.status}).`);
  }

  const dataset: any[] = await response.json();
  if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
    throw new Error(`Aucun profil Instagram trouvé pour @${username}.`);
  }

  const profile = dataset[0];
  if (profile.error || profile.status === 'error') {
    throw new Error(profile.message || `Impossible d'accéder au profil Instagram @${username}.`);
  }

  const rawPicUrl = profile.profilePicUrlHD || profile.profilePicUrl || null;
  let finalAvatarUrl: string | null = null;

  if (rawPicUrl) {
    finalAvatarUrl = await persistAvatarToSupabase(rawPicUrl, username);
  }

  return {
    username,
    fullName: profile.fullName?.trim() || username,
    biography: profile.biography?.trim() || null,
    avatarUrl: finalAvatarUrl,
    websiteUrl: profile.externalUrl?.trim() || null,
    followersCount: typeof profile.followersCount === 'number' ? profile.followersCount : undefined,
    followsCount: typeof profile.followsCount === 'number' ? profile.followsCount : undefined,
    postsCount: typeof profile.postsCount === 'number' ? profile.postsCount : undefined,
    isVerified: Boolean(profile.isVerified),
  };
}
