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

export async function fetchMemberAvailabilities(memberId: string): Promise<MemberAvailabilitySlot[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('member_availabilities')
      .select('*')
      .eq('member_id', memberId)
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
    const supabase = getSupabase();
    // Try to delete and recreate slots in DB
    await supabase.from('member_availabilities').delete().eq('member_id', memberId);
    const { error } = await supabase.from('member_availabilities').insert(
      slots.map((s) => ({
        member_id: memberId,
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
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('host_id', memberId)
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

export async function createBooking(booking: Omit<MeetingBooking, 'id' | 'created_at'>): Promise<MeetingBooking> {
  const newBooking: MeetingBooking = {
    ...booking,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `book-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('bookings').insert([newBooking]).select().single();
    if (!error && data) {
      return data as MeetingBooking;
    }
  } catch (err) {
    console.warn('[Booking] Supabase insert failed, saving to local cache:', err);
  }

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
