import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createOpusClipProject } from '@/lib/services/opus-clip';
import { requireTeamMember } from '@/lib/server/permissions';

export const runtime = 'nodejs';

// Kicks off an Opus Clip project for a video the team already uploaded
// (Supabase Storage public URL). The webhook URL carries this job's own
// id as a query param -- that's how the completion webhook finds its way
// back to the right row, rather than trusting field names in Opus
// Clip's webhook body that we couldn't fully confirm ahead of time (see
// lib/services/opus-clip.ts).
export async function POST(req: Request) {
  const authed = await createServerClient();
  const guard = await requireTeamMember(authed);
  if (guard.error) return guard.error;
  const { user } = guard;

  let body: { videoUrl?: string; title?: string; contentItemId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }
  const { videoUrl, title, contentItemId } = body;
  if (!videoUrl || !title) {
    return NextResponse.json({ error: 'videoUrl et title sont requis.' }, { status: 400 });
  }

  const { data: job, error: insertError } = await authed
    .from('opus_clip_jobs')
    .insert([{
      source_content_item_id: contentItemId || null,
      source_video_url: videoUrl,
      title,
      status: 'pending',
      created_by: user.id,
    }])
    .select('*')
    .single();
  if (insertError || !job) {
    return NextResponse.json({ error: "Impossible de créer le job Opus Clip." }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    await authed.from('opus_clip_jobs').update({
      status: 'failed',
      error_message: "NEXT_PUBLIC_APP_URL n'est pas configurée -- impossible de recevoir le webhook de fin de traitement.",
    }).eq('id', job.id);
    return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL n'est pas configurée." }, { status: 500 });
  }
  const webhookUrl = `${appUrl}/api/webhooks/opus-clip?jobId=${job.id}`;

  const result = await createOpusClipProject(videoUrl, title, webhookUrl);
  if ('error' in result) {
    await authed.from('opus_clip_jobs').update({ status: 'failed', error_message: result.error }).eq('id', job.id);
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  await authed.from('opus_clip_jobs').update({
    status: 'processing',
    opus_project_id: result.projectId,
  }).eq('id', job.id);

  return NextResponse.json({ jobId: job.id, projectId: result.projectId });
}
