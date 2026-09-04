export type LinkPreviewPlatform = 'youtube' | 'tiktok' | 'instagram' | 'other';

export interface LinkPreview {
  platform: LinkPreviewPlatform;
  url: string;
  title: string | null;
  description: string | null;
  authorName: string | null;
  thumbnailUrl: string | null;
  viewCount: number | null;
  durationSeconds: number | null;
  // Honest signal for the UI: true once we've actually fetched real
  // metadata (oEmbed/API) for this URL; false means "recognized platform,
  // but no preview data available" (e.g. Instagram without an app token) --
  // never fabricate title/thumbnail/etc. to fill this gap.
  available: boolean;
}

function detectPlatform(url: string): LinkPreviewPlatform {
  let hostname = '';
  try {
    hostname = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'other';
  }
  if (hostname === 'youtube.com' || hostname === 'youtu.be' || hostname === 'm.youtube.com') return 'youtube';
  if (hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com')) return 'tiktok';
  if (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) return 'instagram';
  return 'other';
}

function extractYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1) || null;
    if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null;
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}

// Parses an ISO 8601 duration ("PT1M32S") into seconds, as returned by the
// YouTube Data API's contentDetails.duration.
function parseIso8601Duration(iso: string): number | null {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return null;
  const [, h, m, s] = match;
  return (Number(h || 0) * 3600) + (Number(m || 0) * 60) + Number(s || 0);
}

async function fetchYouTubePreview(url: string): Promise<LinkPreview> {
  const base: LinkPreview = {
    platform: 'youtube',
    url,
    title: null,
    description: null,
    authorName: null,
    thumbnailUrl: null,
    viewCount: null,
    durationSeconds: null,
    available: false,
  };

  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      base.title = oembed.title ?? null;
      base.authorName = oembed.author_name ?? null;
      base.thumbnailUrl = oembed.thumbnail_url ?? null;
      base.available = true;
    }
  } catch {
    // oEmbed failure isn't fatal -- the Data API call below can still fill in.
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  const videoId = extractYouTubeVideoId(url);
  if (apiKey && videoId) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
      );
      if (res.ok) {
        const data = await res.json();
        const item = data.items?.[0];
        if (item) {
          base.title = item.snippet?.title ?? base.title;
          base.description = item.snippet?.description ? item.snippet.description.slice(0, 280) : base.description;
          base.authorName = item.snippet?.channelTitle ?? base.authorName;
          base.thumbnailUrl = item.snippet?.thumbnails?.high?.url ?? base.thumbnailUrl;
          base.viewCount = item.statistics?.viewCount ? Number(item.statistics.viewCount) : null;
          base.durationSeconds = item.contentDetails?.duration ? parseIso8601Duration(item.contentDetails.duration) : null;
          base.available = true;
        }
      }
    } catch {
      // Data API failure just means no view count/duration -- oEmbed data (if any) still stands.
    }
  }

  return base;
}

async function fetchTikTokPreview(url: string): Promise<LinkPreview> {
  const base: LinkPreview = {
    platform: 'tiktok',
    url,
    title: null,
    description: null,
    authorName: null,
    thumbnailUrl: null,
    viewCount: null,
    durationSeconds: null,
    available: false,
  };
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      base.title = data.title ?? null;
      base.authorName = data.author_name ?? null;
      base.thumbnailUrl = data.thumbnail_url ?? null;
      base.available = true;
    }
  } catch {
    // Degrade honestly below -- no view count is available from public oEmbed either way.
  }
  return base;
}

// Instagram's public, unauthenticated oEmbed was retired in 2020 -- a real
// preview requires a Meta app + access token, which isn't configured here.
// Rather than fake it, this returns available: false so the UI shows a
// plain "open on Instagram" link instead of fabricated metadata.
function instagramPreviewStub(url: string): LinkPreview {
  return {
    platform: 'instagram',
    url,
    title: null,
    description: null,
    authorName: null,
    thumbnailUrl: null,
    viewCount: null,
    durationSeconds: null,
    available: false,
  };
}

async function fetchGenericWebPreview(url: string): Promise<LinkPreview> {
  const base: LinkPreview = {
    platform: 'other',
    url,
    title: null,
    description: null,
    authorName: null,
    thumbnailUrl: null,
    viewCount: null,
    durationSeconds: null,
    available: false,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();

      // Match og:image or twitter:image
      const ogImgMatch =
        html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
      if (ogImgMatch?.[1]) {
        let img = ogImgMatch[1];
        if (img.startsWith('/')) {
          try {
            const u = new URL(url);
            img = `${u.origin}${img}`;
          } catch {}
        }
        base.thumbnailUrl = img;
        base.available = true;
      }

      // Match og:title or <title>
      const ogTitleMatch =
        html.match(/<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (ogTitleMatch?.[1]) {
        base.title = ogTitleMatch[1].replace(/&amp;/g, '&').trim();
        base.available = true;
      }

      // Match og:description or meta description
      const ogDescMatch =
        html.match(/<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:description|description)["']/i);
      if (ogDescMatch?.[1]) {
        base.description = ogDescMatch[1].replace(/&amp;/g, '&').trim();
        base.available = true;
      }
    }
  } catch {
    // Non-blocking fallback
  }

  return base;
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  // Official Minerva Reach override to guarantee clean French OpenGraph metadata
  if (url.includes('minerva-os-lite-desktop') || url.includes('minerva-reach')) {
    return {
      platform: 'other',
      url,
      title: 'Minerva Reach — Prospection Commerciale & Routine /today',
      description:
        'Application de prospection commerciale terrain et qualification express de fiches commerces pour l’équipe Ventes de Minerva.',
      authorName: 'Minerva',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
      viewCount: null,
      durationSeconds: null,
      available: true,
    };
  }

  const platform = detectPlatform(url);
  if (platform === 'youtube') return fetchYouTubePreview(url);
  if (platform === 'tiktok') return fetchTikTokPreview(url);
  if (platform === 'instagram') return instagramPreviewStub(url);
  return fetchGenericWebPreview(url);
}
