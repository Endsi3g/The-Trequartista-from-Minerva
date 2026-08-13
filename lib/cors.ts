// CORS handling for the Framer-facing intake endpoints. FRAMER_ORIGIN is a
// comma-separated allowlist (e.g. "https://minerva.com,https://xxx.framer.website")
// left unset until the real production domain is confirmed -- requests are
// rejected (no Access-Control-Allow-Origin header) rather than defaulting
// to a permissive "*", which would let any site relay traffic to a public
// write endpoint.
function allowedOrigins(): string[] {
  return (process.env.FRAMER_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = allowedOrigins();
  if (origin && allowed.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    };
  }
  return {};
}

export function handleCorsPreflight(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}
