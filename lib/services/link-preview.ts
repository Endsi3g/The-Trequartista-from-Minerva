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

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const platform = detectPlatform(url);
  if (platform === 'youtube') return fetchYouTubePreview(url);
  if (platform === 'tiktok') return fetchTikTokPreview(url);
  if (platform === 'instagram') return instagramPreviewStub(url);
  return {
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
}
