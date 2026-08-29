import { NextResponse } from 'next/server';
import { handlePlaneWebhookPayload, verifyPlaneWebhookSignature } from '@/lib/services/plane';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const signatureHeader = req.headers.get('x-plane-signature') || req.headers.get('x-signature') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (process.env.PLANE_WEBHOOK_SECRET && !verifyPlaneWebhookSignature(signatureHeader)) {
    return NextResponse.json({ error: 'Signature webhook non autorisée.' }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const result = await handlePlaneWebhookPayload(payload, signatureHeader);

    if (!result.success && result.action === 'auth_failed') {
      return NextResponse.json({ error: result.message }, { status: 401 });
    }

    return NextResponse.json({
      received: true,
      action: result.action,
      message: result.message,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON payload';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
