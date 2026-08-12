import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const { videoUrl } = await req.json();

    if (!videoUrl || typeof videoUrl !== 'string') {
      return NextResponse.json({ error: 'Valid videoUrl parameter is required' }, { status: 400 });
    }

    // Honest placeholder: real video ingestion (yt-dlp/ffmpeg) needs a
    // binary that isn't available in the Vercel Node serverless runtime.
    // This used to silently return a fixed sample MP4 and report
    // success=true without uploading anything to Supabase Storage — every
    // caller believed the import worked. Failing loudly is safer than a
    // fake success until a real ingestion worker is provisioned.
    return NextResponse.json(
      {
        success: false,
        error: 'L’import automatique de vidéo (yt-dlp) n’est pas encore disponible sur cet environnement. Téléversez le fichier manuellement.',
      },
      { status: 501 }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error during video processing';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
