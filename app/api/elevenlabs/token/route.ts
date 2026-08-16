import { NextResponse } from 'next/server';
import { getConversationToken } from '@/lib/services/elevenlabs';

export async function GET() {
  const result = await getConversationToken();
  if (!result.token) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ token: result.token });
}
