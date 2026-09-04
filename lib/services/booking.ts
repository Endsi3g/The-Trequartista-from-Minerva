// ============================================================================
// Minerva In-App & Public Booking Engine
// Manages weekly availabilities, slot generation, internal and public bookings
// ============================================================================

import { getSupabase } from '@/lib/supabase/client';

export interface MemberAvailabilitySlot {
  id: string;
  member_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time: string; // '09:00'
  end_time: string; // '17:00'
  slot_duration_minutes: number; // 15, 30, 45, 60
  buffer_minutes: number; // 10, 15
  is_active: boolean;
}

export interface MeetingBooking {
  id: string;
  created_at: string;
  host_id: string;
  host_name?: string;
  host_email?: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  guest_company?: string;
  guest_website_url?: string;
  meeting_type: 'internal_sync' | 'client_demo' | 'audit_review' | 'custom';
  meeting_title: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  status: 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  location_url?: string;
}

// Fallback in-memory/mock store for when Supabase tables are being initialized
const DEFAULT_WEEKLY_AVAILABILITIES: Omit<MemberAvailabilitySlot, 'id' | 'member_id'>[] = [
  { day_of_week: 1, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, buffer_minutes: 10, is_active: true },
  { day_of_week: 2, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, buffer_minutes: 10, is_active: true },
  { day_of_week: 3, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, buffer_minutes: 10, is_active: true },
  { day_of_week: 4, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, buffer_minutes: 10, is_active: true },
  { day_of_week: 5, start_time: '09:00', end_time: '16:00', slot_duration_minutes: 30, buffer_minutes: 10, is_active: true },
];

const LOCAL_STORAGE_AVAILABILITY_KEY = 'minerva_member_availabilities';
const LOCAL_STORAGE_BOOKINGS_KEY = 'minerva_meeting_bookings';

// Resolves host identifier (e.g. 'kael', 'minerva', email) to an actual Supabase profile UUID
export async function resolveHostProfile(
  hostIdentifier?: string
): Promise<{ id: string; full_name: string; email: string }> {
  const supabase = getSupabase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(hostIdentifier || '');

  if (isUuid) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', hostIdentifier!)
      .maybeSingle();
    if (data) return data;
  }

  // Fallback 1: Match by email if hostIdentifier contains @
  if (hostIdentifier && hostIdentifier.includes('@')) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .ilike('email', hostIdentifier)
      .maybeSingle();
    if (data) return data;
  }

  // Fallback 2: Match Kael Belceus (official primary admin)
  const { data: kael } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .ilike('email', 'kbelceus776@gmail.com')
    .maybeSingle();
  if (kael) return kael;

  // Fallback 3: Any admin profile
  const { data: admin } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();
  if (admin) return admin;

  return {
    id: '00000000-0000-0000-0000-000000000001',
    full_name: 'Kael Belceus',
    email: 'kbelceus776@gmail.com',
  };
}

export async function fetchMemberAvailabilities(memberId: string): Promise<MemberAvailabilitySlot[]> {
  try {
    const hostProfile = await resolveHostProfile(memberId);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('member_availabilities')
      .select('*')
      .eq('member_id', hostProfile.id)
      .order('day_of_week', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as MemberAvailabilitySlot[];
    }
  } catch (err) {
    console.warn('[Booking] Supabase table member_availabilities not reachable, using local fallback:', err);
  }

  // Local storage fallback
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_AVAILABILITY_KEY}_${memberId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
  }

  // Generate default weekly slots for member
  return DEFAULT_WEEKLY_AVAILABILITIES.map((slot, index) => ({
    ...slot,
    id: `default-slot-${memberId}-${index}`,
    member_id: memberId,
  }));
}

export async function saveMemberAvailabilities(
  memberId: string,
  slots: MemberAvailabilitySlot[]
): Promise<boolean> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${LOCAL_STORAGE_AVAILABILITY_KEY}_${memberId}`, JSON.stringify(slots));
  }

  try {
    const hostProfile = await resolveHostProfile(memberId);
    const supabase = getSupabase();
    // Try to delete and recreate slots in DB
    await supabase.from('member_availabilities').delete().eq('member_id', hostProfile.id);
    const { error } = await supabase.from('member_availabilities').insert(
      slots.map((s) => ({
        member_id: hostProfile.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        slot_duration_minutes: s.slot_duration_minutes,
        buffer_minutes: s.buffer_minutes,
        is_active: s.is_active,
      }))
    );
    if (error) {
      console.warn('[Booking] DB insert failed, saved to local cache:', error);
    }
    return true;
  } catch {
    return true;
  }
}

export async function fetchMemberBookings(memberId: string): Promise<MeetingBooking[]> {
  try {
    const hostProfile = await resolveHostProfile(memberId);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .or(`host_id.eq.${hostProfile.id},host_id.eq.${memberId}`)
      .order('start_time', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as MeetingBooking[];
    }
  } catch (err) {
    console.warn('[Booking] Supabase bookings table not reachable, using local fallback:', err);
  }

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_BOOKINGS_KEY}_${memberId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
  }

  return [];
}

export async function createBooking(
  booking: Omit<MeetingBooking, 'id' | 'created_at'>
): Promise<MeetingBooking> {
  const hostProfile = await resolveHostProfile(booking.host_id);
  const shortId = Math.random().toString(36).substring(2, 10);
  const locationUrl = booking.location_url || `https://meet.google.com/min-${shortId}`;

  const newBooking: MeetingBooking = {
    ...booking,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `book-${Date.now()}`,
    host_id: hostProfile.id,
    host_name: hostProfile.full_name || booking.host_name || 'Kael Belceus',
    host_email: hostProfile.email || booking.host_email || 'kbelceus776@gmail.com',
    location_url: locationUrl,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabase();

  // 1. Insert into Supabase bookings table
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([
        {
          id: newBooking.id,
          host_id: newBooking.host_id,
          host_name: newBooking.host_name,
          host_email: newBooking.host_email,
          guest_name: newBooking.guest_name,
          guest_email: newBooking.guest_email,
          guest_phone: newBooking.guest_phone || null,
          guest_company: newBooking.guest_company || null,
          meeting_type: newBooking.meeting_type,
          meeting_title: newBooking.meeting_title,
          start_time: newBooking.start_time,
          end_time: newBooking.end_time,
          status: newBooking.status,
          notes: newBooking.notes
            ? `${newBooking.notes}${newBooking.guest_website_url ? ` | Site: ${newBooking.guest_website_url}` : ''}`
            : newBooking.guest_website_url
            ? `Site: ${newBooking.guest_website_url}`
            : null,
          location_url: newBooking.location_url,
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn('[Booking] Supabase insert failed, saving to local cache:', error);
    } else if (data) {
      newBooking.id = data.id;
    }
  } catch (err) {
    console.warn('[Booking] Supabase insert error:', err);
  }

  // 2. Automate Lead creation in CRM Supabase (Option 1)
  try {
    const company = newBooking.guest_company || newBooking.guest_name;
    const startFormatted = new Date(newBooking.start_time).toLocaleString('fr-CA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    const leadPayload = {
      company_name: company,
      contact_name: newBooking.guest_name,
      contact_email: newBooking.guest_email,
      contact_phone: newBooking.guest_phone || null,
      source: 'Rendez-Vous Stratégique /book',
      status: 'qualifie',
      score: 85,
      notes: `Rendez-vous stratégique planifié le ${startFormatted}. Google Meet : ${newBooking.location_url}. ${
        newBooking.guest_website_url ? `Site : ${newBooking.guest_website_url}` : ''
      }`,
    };

    const { data: existingLead } = await supabase
      .from('leads')
      .select('id')
      .eq('contact_email', newBooking.guest_email)
      .maybeSingle();

    if (existingLead) {
      await supabase
        .from('leads')
        .update({
          status: 'qualifie',
          notes: leadPayload.notes,
        })
        .eq('id', existingLead.id);
    } else {
      await supabase.from('leads').insert([leadPayload]);
    }
  } catch (leadErr) {
    console.warn('[Booking] Lead automation warning:', leadErr);
  }

  // 3. Post Announcement in Team Chat (#annonces)
  try {
    const startFormatted = new Date(newBooking.start_time).toLocaleString('fr-CA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    const announcementBody = `📅 **Nouveau Rendez-Vous Stratégique Réservé !**\n\n- **Prospect :** ${newBooking.guest_name} (${newBooking.guest_company || 'Indépendant'})\n- **Courriel :** ${newBooking.guest_email}\n- **Date & Heure :** ${startFormatted} (HE)\n- **Site Actuel :** ${newBooking.guest_website_url || 'Non précisé'}\n- **Visioconférence Google Meet :** ${newBooking.location_url}\n\n👉 Fiche qualifiée créée automatiquement dans le CRM.`;

    await supabase.from('team_chat_messages').insert([
      {
        channel_type: 'topic',
        channel_id: '00000000-0000-0000-0000-000000000002', // Canal #annonces
        sender_id: null,
        body: announcementBody,
      },
    ]);
  } catch (chatErr) {
    console.warn('[Booking] Team chat announcement warning:', chatErr);
  }

  // Always save locally as fallback
  if (typeof window !== 'undefined') {
    const current = await fetchMemberBookings(booking.host_id);
    const updated = [...current, newBooking];
    localStorage.setItem(`${LOCAL_STORAGE_BOOKINGS_KEY}_${booking.host_id}`, JSON.stringify(updated));
  }

  return newBooking;
}

export async function updateBookingStatus(
  bookingId: string,
  hostId: string,
  status: MeetingBooking['status']
): Promise<boolean> {
  try {
    const supabase = getSupabase();
    await supabase.from('bookings').update({ status }).eq('id', bookingId);
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    const current = await fetchMemberBookings(hostId);
    const updated = current.map((b) => (b.id === bookingId ? { ...b, status } : b));
    localStorage.setItem(`${LOCAL_STORAGE_BOOKINGS_KEY}_${hostId}`, JSON.stringify(updated));
  }

  return true;
}

// Generates free time slots for a given date based on availability and existing bookings
export function generateDayTimeSlots(
  dateStr: string, // YYYY-MM-DD
  availability: MemberAvailabilitySlot,
  existingBookings: MeetingBooking[]
): { time: string; startIso: string; endIso: string; available: boolean }[] {
  if (!availability.is_active) return [];

  const slots: { time: string; startIso: string; endIso: string; available: boolean }[] = [];
  const [startH, startM] = availability.start_time.split(':').map(Number);
  const [endH, endM] = availability.end_time.split(':').map(Number);
  const duration = availability.slot_duration_minutes || 30;
  const buffer = availability.buffer_minutes || 0;

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + duration <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    const timeFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const slotStart = new Date(`${dateStr}T${timeFormatted}:00`);
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);

    // Check collision with existing confirmed bookings
    const isConflict = existingBookings.some((b) => {
      if (b.status === 'cancelled') return false;
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);
      return slotStart < bEnd && slotEnd > bStart;
    });

    // Also check if slot is in the past
    const isPast = slotStart.getTime() <= Date.now();

    slots.push({
      time: timeFormatted,
      startIso: slotStart.toISOString(),
      endIso: slotEnd.toISOString(),
      available: !isConflict && !isPast,
    });

    currentMinutes += duration + buffer;
  }

  return slots;
}
