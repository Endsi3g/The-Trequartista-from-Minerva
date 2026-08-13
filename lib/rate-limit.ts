// In-memory rate limiter for public, unauthenticated API routes (Framer
// webhooks) that can't rely on proxy.ts's matcher-scoped limiter or any
// shared secret (a browser POST from a marketing site has no session and
// nothing to keep confidential). Per-instance only -- acceptable for
// abuse-dampening on a single Vercel Fluid Compute instance, not a
// distributed guarantee.
const store = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  key: string,
  maxRequests: number,
  windowMs: number
): { limited: boolean; retryAfterSeconds: number } {
  const storeKey = `${ip}:${key}`;
  const now = Date.now();
  const entry = store.get(storeKey);

  if (!entry || now > entry.resetAt) {
    store.set(storeKey, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    return { limited: true, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
