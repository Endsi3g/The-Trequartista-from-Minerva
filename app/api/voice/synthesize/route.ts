import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { synthesizeSpeech } from '@/lib/services/elevenlabs';

export const runtime = 'nodejs';

// Generates a voiceover clip (for Reel scripts, etc.) and stores it in the
// same client-assets bucket Reels video uploads already use.
export async function POST(req: Request) {
  const authed = await createServerClient();
  const { data: { user } } = await authed.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: { text?: string; voiceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const text = body.text?.trim();
  const voiceId = body.voiceId?.trim();
  if (!text || !voiceId) {
    return NextResponse.json({ error: 'text et voiceId requis' }, { status: 400 });
  }
  if (text.length > 5000) {
    return NextResponse.json({ error: 'Texte trop long (5000 caractères max).' }, { status: 400 });
  }

  const { audio, error } = await synthesizeSpeech(text, voiceId);
  if (!audio) {
    return NextResponse.json({ error: error ?? 'Erreur inconnue' }, { status: 502 });
  }

  const storagePath = `voice-tts/${user.id}/${Date.now()}.mp3`;
  const { error: uploadError } = await authed.storage.from('client-assets').upload(storagePath, audio, {
    contentType: 'audio/mpeg',
    upsert: true,
  });
  if (uploadError) {
    return NextResponse.json({ error: `Échec du téléversement audio: ${uploadError.message}` }, { status: 500 });
  }

  const { data } = authed.storage.from('client-assets').getPublicUrl(storagePath);
  return NextResponse.json({ url: data.publicUrl });
}
