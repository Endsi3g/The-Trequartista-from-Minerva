'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  MapPin,
  Check,
  Calendar as CalendarIcon,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Globe,
  CornerDownLeft,
} from 'lucide-react';
import {
  fetchMemberAvailabilities,
  fetchMemberBookings,
  createBooking,
  generateDayTimeSlots,
  resolveHostProfile,
  type MemberAvailabilitySlot,
  type MeetingBooking,
} from '@/lib/services/booking';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface PublicBookingExperienceProps {
  hostId?: string;
  defaultHostName?: string;
}

const MONTH_NAMES_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const WEEKDAY_NAMES_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export function PublicBookingExperience({
  hostId = 'kael',
  defaultHostName = 'Kael Belceus',
}: PublicBookingExperienceProps) {
  const [hostInfo, setHostInfo] = useState<{ id: string; full_name: string; email: string }>({
    id: hostId,
    full_name: defaultHostName,
    email: 'kbelceus776@gmail.com',
  });

  const [availabilities, setAvailabilities] = useState<MemberAvailabilitySlot[]>([]);
  const [existingBookings, setExistingBookings] = useState<MeetingBooking[]>([]);

  // Calendar Month State (starts at current month)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Selected Date (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    // Default to tomorrow or next business day
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 6) d.setDate(d.getDate() + 2); // Saturday -> Monday
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Sunday -> Monday
    return d.toISOString().slice(0, 10);
  });

  // Selected Time Slot
  const [selectedSlot, setSelectedSlot] = useState<{
    time: string;
    startIso: string;
    endIso: string;
  } | null>(null);

  // Slide-in Form Step (true when user has clicked a slot to confirm details)
  const [isFormActive, setIsFormActive] = useState(false);

  // Contact Form Fields
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestWebsiteUrl, setGuestWebsiteUrl] = useState('');
  const [guestCompany, setGuestCompany] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<MeetingBooking | null>(null);

  // Fetch Host Profile and Availability
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const resolved = await resolveHostProfile(hostId);
        if (!isMounted) return;
        setHostInfo(resolved);

        const [aData, bData] = await Promise.all([
          fetchMemberAvailabilities(resolved.id),
          fetchMemberBookings(resolved.id),
        ]);
        if (!isMounted) return;
        setAvailabilities(aData);
        setExistingBookings(bData);
      } catch {
        // graceful fallback
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [hostId]);

  // Compute available slots for selected date
  const daySlots = useMemo(() => {
    const targetDate = new Date(`${selectedDate}T12:00:00`);
    const dayOfWeek = targetDate.getDay();
    const dayAvail = availabilities.find((a) => a.day_of_week === dayOfWeek);

    if (!dayAvail || !dayAvail.is_active) {
      return [];
    }

    return generateDayTimeSlots(selectedDate, dayAvail, existingBookings);
  }, [selectedDate, availabilities, existingBookings]);

  // Find next available business day if current selected date has no slots
  const nextAvailableDateStr = useMemo(() => {
    if (daySlots.length > 0) return null;
    const cur = new Date(`${selectedDate}T12:00:00`);
    for (let i = 1; i <= 14; i++) {
      const nextD = new Date(cur);
      nextD.setDate(cur.getDate() + i);
      const dow = nextD.getDay();
      const avail = availabilities.find((a) => a.day_of_week === dow);
      if (avail && avail.is_active) {
        const dateString = nextD.toISOString().slice(0, 10);
        const slots = generateDayTimeSlots(dateString, avail, existingBookings);
        if (slots.some((s) => s.available)) {
          return dateString;
        }
      }
    }
    return null;
  }, [selectedDate, daySlots, availabilities, existingBookings]);

  // Month Calendar Navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate 7x5 or 7x6 calendar grid cells
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    // In French/European calendar, Monday = 0, Sunday = 6
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = new Date().toISOString().slice(0, 10);

    const cells: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      isToday: boolean;
      isSelected: boolean;
      hasAvailability: boolean;
    }> = [];

    // Prev month padding
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = prevDate.toISOString().slice(0, 10);
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isPast: true,
        isToday: false,
        isSelected: false,
        hasAvailability: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isPast = dateStr < todayStr;
      const dayOfWeek = d.getDay();
      const avail = availabilities.find((a) => a.day_of_week === dayOfWeek);
      const hasAvailability = Boolean(avail && avail.is_active && !isPast);

      cells.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
        isPast,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        hasAvailability,
      });
    }

    // Next month padding to fill grid
    const remaining = 35 - cells.length > 0 ? 35 - cells.length : 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(year, month + 1, day);
      const dateStr = nextDate.toISOString().slice(0, 10);
      cells.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: false,
        isPast: false,
        isToday: false,
        isSelected: false,
        hasAvailability: false,
      });
    }

    return cells;
  }, [year, month, selectedDate, availabilities]);

  // Form Submission
  const handleBookingSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSlot || !guestName.trim() || !guestEmail.trim() || submitting) return;

    setSubmitting(true);
    try {
      const booking = await createBooking({
        host_id: hostInfo.id,
        host_name: hostInfo.full_name,
        host_email: hostInfo.email,
        guest_name: guestName.trim(),
        guest_email: guestEmail.trim(),
        guest_company: guestCompany.trim() || undefined,
        guest_website_url: guestWebsiteUrl.trim() || undefined,
        meeting_type: 'client_demo',
        meeting_title: `Cadrage Stratégique — ${guestName.trim()}`,
        start_time: selectedSlot.startIso,
        end_time: selectedSlot.endIso,
        status: 'confirmed',
        notes: guestWebsiteUrl ? `URL fournie : ${guestWebsiteUrl}` : undefined,
      });

      setConfirmedBooking(booking);
    } catch {
      // handled gracefully in createBooking fallback
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard shortcut: ⌘ + Enter to submit form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (isFormActive && selectedSlot && guestName && guestEmail) {
          e.preventDefault();
          handleBookingSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormActive, selectedSlot, guestName, guestEmail]);

  // Formatted date string for selected day
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const weekday = WEEKDAY_NAMES_FR[d.getDay()];
    const day = parts[2];
    const m = MONTH_NAMES_FR[parts[1] - 1];
    return `${weekday} ${day} ${m}`;
  }, [selectedDate]);

  // Next available date human text
  const nextAvailableText = useMemo(() => {
    if (!nextAvailableDateStr) return null;
    const parts = nextAvailableDateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const weekday = WEEKDAY_NAMES_FR[d.getDay()];
    const day = parts[2];
    const m = MONTH_NAMES_FR[parts[1] - 1];
    return `${weekday} ${day} ${m}`;
  }, [nextAvailableDateStr]);

  // Google Calendar URL generation for confirmation screen
  const googleCalendarUrl = useMemo(() => {
    if (!confirmedBooking) return '#';
    const start = new Date(confirmedBooking.start_time).toISOString().replace(/-|:|\.\d+/g, '');
    const end = new Date(confirmedBooking.end_time).toISOString().replace(/-|:|\.\d+/g, '');
    const title = encodeURIComponent(confirmedBooking.meeting_title);
    const details = encodeURIComponent(
      `Rendez-vous stratégique en visioconférence avec l'équipe Minerva Studio.\nLien Google Meet : ${confirmedBooking.location_url}`
    );
    const location = encodeURIComponent(confirmedBooking.location_url || 'Google Meet');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  }, [confirmedBooking]);

  // ── Render Confirmation View ───────────────────────────────────────────────
  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 font-sans text-zinc-900">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl shadow-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full" style={MONO}>
              ✦ Rendez-Vous Confirmé
            </span>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 mt-2">
              À très bientôt, {confirmedBooking.guest_name} !
            </h1>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Votre session de cadrage stratégique avec {hostInfo.full_name} a été enregistrée avec succès.
            </p>
          </div>

          <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-2.5 text-left text-xs font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
              <span className="text-zinc-500">Date &amp; Heure :</span>
              <span className="font-semibold text-zinc-900 font-mono" style={MONO}>
                {new Date(confirmedBooking.start_time).toLocaleDateString('fr-CA', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                à{' '}
                {new Date(confirmedBooking.start_time).toLocaleTimeString('fr-CA', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                (HE)
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60">
              <span className="text-zinc-500">Durée :</span>
              <span className="font-semibold text-zinc-900 font-mono" style={MONO}>30 minutes</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Lien Google Meet :</span>
              <a
                href={confirmedBooking.location_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                style={MONO}
              >
                <span>Rejoindre</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="space-y-2.5">
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Ajouter à Google Calendar</span>
            </a>

            <button
              onClick={() => {
                setConfirmedBooking(null);
                setIsFormActive(false);
                setSelectedSlot(null);
              }}
              className="w-full h-8 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors cursor-pointer"
            >
              Réserver un autre créneau
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render 3-Section Monolithic Layout ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-zinc-900">
      <div className="max-w-4xl w-full bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr_220px]">
        {/* ── Section 1 : Détails & Contexte (Panneau Gauche Sombre — 280px) ── */}
        <div className="bg-[#18181B] text-zinc-100 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Micro-badge */}
            <div className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] tracking-wider font-semibold" style={MONO}>
              <Sparkles className="w-3 h-3" />
              <span>✦ MINERVA STUDIO</span>
            </div>

            {/* Titre & Sous-titre */}
            <div className="space-y-1">
              <h1 className="text-lg font-semibold tracking-tight text-white">
                Rendez-Vous Stratégique
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Échange de cadrage en visioconférence pour évaluer la croissance de votre restaurant ou commerce local.
              </p>
            </div>

            {/* Métadonnées de l'appel (28px par ligne) */}
            <div className="space-y-1.5 pt-4 border-t border-zinc-800 text-xs text-zinc-300">
              <div className="h-7 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono" style={MONO}>30 minutes</span>
              </div>
              <div className="h-7 flex items-center gap-2.5">
                <Video className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Google Meet (Lien auto-généré)</span>
              </div>
              <div className="h-7 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Montréal, Québec (HE / EDT)</span>
              </div>
            </div>

            {/* Interlocuteur Référent */}
            <div className="pt-4 border-t border-zinc-800/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 flex items-center justify-center text-xs font-bold font-mono">
                {hostInfo.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">{hostInfo.full_name}</div>
                <div className="text-[10px] text-zinc-400 truncate">Fondateur &amp; Lead Architect</div>
              </div>
            </div>
          </div>

          {/* Footer Écosystème */}
          <div className="text-[10px] font-mono text-zinc-500 pt-4 border-t border-zinc-800/60" style={MONO}>
            Minerva Reach • Flow • Trequartista
          </div>
        </div>

        {/* ── Section 2 : Mini-Calendrier Mensuel ou Formulaire Slide-in ──────── */}
        <div className="p-6 border-r border-zinc-100 flex flex-col justify-between space-y-4">
          {!isFormActive ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* En-tête du Mois avec Navigation */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 tracking-tight">
                  {MONTH_NAMES_FR[month]} {year}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevMonth}
                    className="w-7 h-7 rounded-md border border-zinc-200 hover:bg-zinc-50 flex items-center justify-center text-zinc-600 transition-colors cursor-pointer"
                    aria-label="Mois précédent"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="w-7 h-7 rounded-md border border-zinc-200 hover:bg-zinc-50 flex items-center justify-center text-zinc-600 transition-colors cursor-pointer"
                    aria-label="Mois suivant"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Grille des Jours (7x5) */}
              <div className="grid grid-cols-7 gap-1">
                {/* En-têtes des jours */}
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((dayChar, idx) => (
                  <div
                    key={idx}
                    className="h-7 flex items-center justify-center text-[10px] font-mono font-medium text-zinc-400 text-center"
                    style={MONO}
                  >
                    {dayChar}
                  </div>
                ))}

                {/* Cellules du calendrier */}
                {calendarCells.map((cell, idx) => {
                  const isSelectable = cell.isCurrentMonth && !cell.isPast;

                  return (
                    <button
                      key={idx}
                      disabled={!isSelectable}
                      onClick={() => {
                        setSelectedDate(cell.dateStr);
                        setSelectedSlot(null);
                      }}
                      className={cn(
                        'h-9 rounded-md flex flex-col items-center justify-center relative text-xs font-mono transition-all cursor-pointer',
                        cell.isSelected
                          ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                          : cell.isCurrentMonth && !cell.isPast
                          ? 'text-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 font-medium'
                          : 'text-zinc-300 pointer-events-none'
                      )}
                      style={MONO}
                    >
                      <span>{cell.dayNum}</span>
                      {cell.hasAvailability && !cell.isSelected && (
                        <span className="w-1 h-1 rounded-full bg-emerald-500 absolute bottom-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Fuseau horaire discret */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 font-mono" style={MONO}>
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-zinc-400" />
                  <span>Fuseau : Montréal (UTC-4 / EDT)</span>
                </div>
              </div>
            </div>
          ) : (
            /* ── Slide-in Formulaire de Cadrage ── */
            <form onSubmit={handleBookingSubmit} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-200 flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div>
                    <h2 className="text-xs font-semibold text-zinc-900 tracking-tight">
                      Informations de Contact
                    </h2>
                    <p className="text-[11px] text-zinc-500 font-mono" style={MONO}>
                      {formattedSelectedDate} à {selectedSlot?.time}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormActive(false)}
                    className="text-[11px] text-emerald-700 font-semibold hover:underline cursor-pointer font-sans"
                  >
                    ← Changer
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Jean Tremblay"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs bg-zinc-50/80 border border-zinc-200 rounded-md focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-sans text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Email professionnel *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="jean@monresto.ca"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs bg-zinc-50/80 border border-zinc-200 rounded-md focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-sans text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Nom du commerce ou restaurant
                    </label>
                    <input
                      type="text"
                      placeholder="Bistrot du Parc"
                      value={guestCompany}
                      onChange={(e) => setGuestCompany(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs bg-zinc-50/80 border border-zinc-200 rounded-md focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-sans text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      URL du site actuel (Framer / Web)
                    </label>
                    <input
                      type="url"
                      placeholder="https://monresto.ca"
                      value={guestWebsiteUrl}
                      onChange={(e) => setGuestWebsiteUrl(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs bg-zinc-50/80 border border-zinc-200 rounded-md focus:outline-none focus:border-emerald-600 focus:bg-white transition-all font-mono text-zinc-900"
                      style={MONO}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !guestName.trim() || !guestEmail.trim()}
                  className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 font-sans"
                >
                  <span>{submitting ? 'Confirmation...' : 'Confirmer le Rendez-Vous'}</span>
                  <div className="hidden sm:flex items-center gap-0.5 text-[10px] opacity-75 font-mono" style={MONO}>
                    <CornerDownLeft className="w-2.5 h-2.5" />
                    <span>⌘↵</span>
                  </div>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Section 3 : Colonne des Créneaux Horaires (Panneau Droit — 220px) ── */}
        <div className="p-6 bg-zinc-50/50 flex flex-col justify-between">
          <div className="space-y-3">
            {/* En-tête de Date */}
            <div className="border-b border-zinc-200/60 pb-2">
              <span className="text-xs font-semibold text-zinc-900 block truncate">
                {formattedSelectedDate}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
                {daySlots.filter((s) => s.available).length} créneaux libres
              </span>
            </div>

            {/* Liste Déroulante des Créneaux Horaires */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {daySlots.length === 0 ? (
                <div className="py-6 px-3 text-center rounded-lg border border-dashed border-zinc-200 text-xs text-zinc-400 space-y-3">
                  <p>Aucun créneau ce jour.</p>
                  {nextAvailableText && nextAvailableDateStr && (
                    <div className="pt-1">
                      <span className="text-[11px] text-zinc-500 block mb-1.5">
                        Prochain créneau :
                      </span>
                      <button
                        onClick={() => {
                          setSelectedDate(nextAvailableDateStr);
                          setSelectedSlot(null);
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                      >
                        <span>{nextAvailableText}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                daySlots.map((s, idx) => {
                  const isChosen = selectedSlot?.time === s.time;

                  return (
                    <div key={idx} className="space-y-1">
                      <button
                        disabled={!s.available}
                        onClick={() => {
                          setSelectedSlot(s);
                        }}
                        className={cn(
                          'h-8.5 w-full text-xs font-mono font-medium rounded-md transition-all shadow-2xs flex items-center justify-center cursor-pointer',
                          isChosen
                            ? 'bg-zinc-900 text-white font-semibold'
                            : s.available
                            ? 'bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-zinc-200 text-zinc-800'
                            : 'bg-zinc-100 text-zinc-400 border border-zinc-200/50 cursor-not-allowed line-through'
                        )}
                        style={MONO}
                      >
                        {s.time}
                      </button>

                      {/* Expansion du bouton si sélectionné */}
                      {isChosen && !isFormActive && (
                        <button
                          onClick={() => setIsFormActive(true)}
                          className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer animate-in fade-in slide-in-from-top-1 duration-150"
                        >
                          <span>Confirmer</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Raccourci bas de colonne */}
          <div className="pt-3 border-t border-zinc-200/60 text-[10px] text-zinc-400 font-mono text-center" style={MONO}>
            Confirmation instantanée
          </div>
        </div>
      </div>
    </div>
  );
}
