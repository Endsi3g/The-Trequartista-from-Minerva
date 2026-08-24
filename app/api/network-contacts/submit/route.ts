import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Lazily instantiated -- see app/api/leads/step-1/route.ts for why a
// module-scope createClient() with a `!` assertion isn't safe here.
function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const SubmitSchema = z
  .object({
    full_name: z.string().trim().min(1).max(120),
    company: z.string().trim().max(160).optional(),
    role_title: z.string().trim().max(160).optional(),
    sector: z.string().trim().max(80).optional(),
    email: z.string().trim().email().max(200).optional().or(z.literal('')),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    linkedin_url: z.string().trim().max(300).optional(),
    instagram_url: z.string().trim().max(300).optional(),
    facebook_url: z.string().trim().max(300).optional(),
    website_url: z.string().trim().max(300).optional(),
    met_at_event: z.string().trim().max(200).optional(),
    met_at_location: z.string().trim().max(200).optional(),
    how_can_i_help: z.string().trim().max(2000).optional(),
    biggest_problem: z.string().trim().max(2000).optional(),
    bio: z.string().trim().max(2000).optional(),
    avatar_url_preset: z.string().trim().url().max(500).optional(),
    open_to_collaborate: z.enum(['true', 'false']).optional(),
    preferred_contact_method: z.enum(['email', 'reseaux_sociaux', 'site_web', 'autre']).optional(),
    hp_field: z.string().optional(), // honeypot -- must stay empty
  })
  .refine((data) => Boolean(data.email) || Boolean(data.phone), {
    message: 'Un courriel ou un téléphone est requis.',
    path: ['email'],
  });

function nullIfEmpty(value: string | undefined): string | null {
  return value && value.trim() ? value.trim() : null;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { limited, retryAfterSeconds } = checkRateLimit(ip, 'network-contacts-submit', 10, 60_000);
  if (limited) {
    return NextResponse.json(
      { error: 'Trop de requêtes, réessayez plus tard.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const raw: Record<string, string> = {};
  for (const key of [
    'full_name', 'company', 'role_title', 'sector', 'email', 'phone',
    'linkedin_url', 'instagram_url', 'facebook_url', 'website_url',
    'met_at_event', 'met_at_location', 'how_can_i_help', 'biggest_problem',
    'bio', 'avatar_url_preset',
    'open_to_collaborate', 'preferred_contact_method', 'hp_field',
  ]) {
    const value = form.get(key);
    if (typeof value === 'string') raw[key] = value;
  }

  const parsed = SubmitSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Champs invalides', details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Honeypot: pretend success so bots don't learn to avoid the field.
  if (data.hp_field && data.hp_field.trim()) {
    return NextResponse.json({ id: 'ok' }, { status: 201 });
  }

  const supabase = getSupabase();

  let avatarUrl: string | null = data.avatar_url_preset || null;
  const photo = form.get('photo');
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json({ error: 'La photo doit être une image.' }, { status: 400 });
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: 'La photo dépasse 5 Mo.' }, { status: 400 });
    }
    const ext = (photo.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('contact-photos')
      .upload(path, photo, { contentType: photo.type, cacheControl: '3600' });
    if (uploadError) {
      console.error('[network-contacts/submit] Photo upload error:', uploadError);
    } else {
      avatarUrl = supabase.storage.from('contact-photos').getPublicUrl(path).data.publicUrl;
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert([{
      full_name: data.full_name,
      company: nullIfEmpty(data.company),
      role_title: nullIfEmpty(data.role_title),
      sector: nullIfEmpty(data.sector),
      email: nullIfEmpty(data.email),
      phone: nullIfEmpty(data.phone),
      linkedin_url: nullIfEmpty(data.linkedin_url),
      instagram_url: nullIfEmpty(data.instagram_url),
      facebook_url: nullIfEmpty(data.facebook_url),
      website_url: nullIfEmpty(data.website_url),
      met_at_event: nullIfEmpty(data.met_at_event),
      met_at_location: nullIfEmpty(data.met_at_location),
      met_at_date: today,
      bio: nullIfEmpty(data.bio),
      how_can_i_help: nullIfEmpty(data.how_can_i_help),
      biggest_problem: nullIfEmpty(data.biggest_problem),
      open_to_collaborate: data.open_to_collaborate === undefined ? null : data.open_to_collaborate === 'true',
      preferred_contact_method: data.preferred_contact_method || null,
      avatar_url: avatarUrl,
      status: 'a_contacter',
      source: 'self_submitted',
      created_by: null,
    }])
    .select('id')
    .single();

  if (error || !contact) {
    console.error('[network-contacts/submit] Insert error:', error);
    return NextResponse.json({ error: "Impossible d'enregistrer ce contact." }, { status: 500 });
  }

  return NextResponse.json({ id: contact.id }, { status: 201 });
}
