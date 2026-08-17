import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  verifyOpusClipWebhookSignature,
  fetchOpusClipClips,
} from '@/lib/services/opus-clip';
import { uploadFileToGoogleDrive } from '@/lib/services/composio';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export const runtime = 'nodejs';

// Receives Opus Clip's project-completion webhook. jobId comes from our
// own query param (set when the project was created, see
// app/api/opus-clip/create/route.ts) rather than parsed out of Opus
// Clip's body -- more robust than trusting field names in a payload
// shape we couldn't fully confirm against their docs ahead of time.
export async function POST(req: Request) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId');
  const rawBody = await req.text();
  const signature = req.headers.get('x-opus-signature');
  const salt = req.headers.get('x-opus-salt');

  if (!verifyOpusClipWebhookSignature(rawBody, signature, salt)) {
    return NextResponse.json({ error: 'Signature invalide ou webhook non configuré.' }, { status: 401 });
  }
  if (!jobId) {
    return NextResponse.json({ error: 'jobId manquant.' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: job, error: jobError } = await supabase.from('opus_clip_jobs').select('*').eq('id', jobId).maybeSingle();
  if (jobError || !job) {
    return NextResponse.json({ error: 'Job introuvable.' }, { status: 404 });
  }

  let payload: { status?: string; success?: boolean; error?: string } = {};
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // Some conclusion-action calls may not carry a JSON body -- fall
    // through and treat receipt as success, since we still re-fetch
    // clips from the API rather than trusting this body's contents.
  }
  const failed = payload.status === 'failed' || payload.success === false;
  if (failed) {
    await supabase.from('opus_clip_jobs').update({
      status: 'failed',
      error_message: payload.error || 'Opus Clip a signalé un échec de traitement.',
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);
    return NextResponse.json({ received: true });
  }

  if (!job.opus_project_id) {
    return NextResponse.json({ error: 'opus_project_id manquant sur ce job.' }, { status: 400 });
  }

  const clipsResult = await fetchOpusClipClips(job.opus_project_id);
  if ('error' in clipsResult) {
    await supabase.from('opus_clip_jobs').update({
      status: 'failed',
      error_message: clipsResult.error,
      updated_at: new Date().toISOString(),
    }).eq('id', jobId);
    return NextResponse.json({ error: clipsResult.error }, { status: 502 });
  }

  const driveFolderId = process.env.GOOGLE_DRIVE_OPUS_CLIP_FOLDER_ID || undefined;
  const uploaded = [];
  for (const clip of clipsResult.clips) {
    const fileName = `${clip.title || 'clip'}-${clip.id}.mp4`.replace(/[^a-zA-Z0-9.\-_ ]/g, '_');
    const driveResult = await uploadFileToGoogleDrive(clip.videoUrl, fileName, driveFolderId);
    uploaded.push({
      id: clip.id,
      title: clip.title,
      video_url: clip.videoUrl,
      drive_file_id: 'fileId' in driveResult ? driveResult.fileId : null,
      drive_view_url: 'webViewLink' in driveResult ? driveResult.webViewLink : null,
    });
    if ('error' in driveResult) {
      console.error('[webhooks/opus-clip] Drive upload failed for clip', clip.id, driveResult.error);
    }
  }

  const anyDriveFailure = uploaded.some((c) => !c.drive_file_id);
  await supabase.from('opus_clip_jobs').update({
    status: anyDriveFailure ? 'failed' : 'done',
    error_message: anyDriveFailure ? "Un ou plusieurs clips n'ont pas pu être envoyés vers Google Drive -- voir les logs." : null,
    clips: uploaded,
    updated_at: new Date().toISOString(),
  }).eq('id', jobId);

  return NextResponse.json({ received: true, clips: uploaded.length });
}
