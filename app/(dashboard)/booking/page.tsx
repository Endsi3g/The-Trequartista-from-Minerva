'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Copy,
  Check,
  ExternalLink,
  Plus,
  X,
  Sparkles,
  Settings,
  CalendarCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/components/providers/ToastProvider';
import {
  fetchMemberAvailabilities,
  saveMemberAvailabilities,
  fetchMemberBookings,
  createBooking,
  updateBookingStatus,
  type MemberAvailabilitySlot,
  type MeetingBooking,
} from '@/lib/services/booking';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const DAYS_OF_WEEK = [
  { day: 1, label: 'Lundi' },
  { day: 2, label: 'Mardi' },
  { day: 3, label: 'Mercredi' },
  { day: 4, label: 'Jeudi' },
  { day: 5, label: 'Vendredi' },
  { day: 6, label: 'Samedi' },
  { day: 0, label: 'Dimanche' },
];

export default function BookingDashboardPage() {
  const { id: currentUserId, fullName, email } = useCurrentUser();
  const { toastSuccess, toastError, toastInfo } = useToast();

  const [leftTab, setLeftTab] = useState<'meetings' | 'availability' | 'settings'>('meetings');
  const [bookings, setBookings] = useState<MeetingBooking[]>([]);
  const [availabilities, setAvailabilities] = useState<MemberAvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [meetingTitle, setMeetingTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [meetingType, setMeetingType] = useState<MeetingBooking['meeting_type']>('client_demo');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  const publicBookingSlug = currentUserId ? currentUserId.slice(0, 8) : 'e0178465';
  const publicBookingPath = `/book/${publicBookingSlug}`;

  useEffect(() => {
    if (!currentUserId) return;
    let active = true;
    setLoading(true);
    Promise.all([fetchMemberBookings(currentUserId), fetchMemberAvailabilities(currentUserId)])
      .then(([bData, aData]) => {
        if (!active) return;
        setBookings(bData);
        setAvailabilities(aData);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[Booking] Erreur chargement :', err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentUserId]);

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${publicBookingPath}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    toastSuccess('Lien copié !', fullUrl);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const resetForm = () => {
    setMeetingTitle('');
    setGuestName('');
    setGuestEmail('');
    setMeetingNotes('');
  };

  const handleCreateMeeting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUserId || !meetingTitle.trim() || !guestName.trim() || !guestEmail.trim()) {
      toastError('Champs obligatoires manquants', 'Veuillez renseigner le titre, le participant et son courriel.');
      return;
    }

    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

      const newB = await createBooking({
        host_id: currentUserId,
        host_name: fullName || 'Hôte Minerva',
        host_email: email || '',
        guest_name: guestName,
        guest_email: guestEmail,
        meeting_type: meetingType,
        meeting_title: meetingTitle,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'confirmed',
        notes: meetingNotes,
        location_url: 'https://meet.google.com/minerva-sync',
      });

      setBookings((prev) => [newB, ...prev]);
      toastSuccess('Rendez-vous planifié', `« ${meetingTitle} » est confirmé.`);
      resetForm();
    } catch {
      toastError('Erreur', 'Impossible de planifier le rendez-vous.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelMeeting = async (bookingId: string) => {
    if (!currentUserId) return;
    try {
      await updateBookingStatus(bookingId, currentUserId, 'cancelled');
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)));
      toastInfo('Rendez-vous annulé', 'Le statut a été mis à jour.');
    } catch {
      toastError('Erreur', 'Impossible d’annuler la réunion.');
    }
  };

  const handleToggleDay = (dayOfWeek: number) => {
    setAvailabilities((prev) =>
      prev.map((slot) => (slot.day_of_week === dayOfWeek ? { ...slot, is_active: !slot.is_active } : slot))
    );
  };

  const handleTimeChange = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    setAvailabilities((prev) =>
      prev.map((slot) => (slot.day_of_week === dayOfWeek ? { ...slot, [field]: value } : slot))
    );
  };

  const handleSaveAvailabilities = async () => {
    if (!currentUserId) return;
    try {
      await saveMemberAvailabilities(currentUserId, availabilities);
      toastSuccess('Disponibilités sauvegardées', 'Créneaux hebdomadaires mis à jour.');
    } catch {
      toastError('Erreur', 'Impossible de sauvegarder.');
    }
  };

  // Keyboard Shortcuts: ⌘+Enter to submit, Escape to reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCreateMeeting();
      } else if (e.key === 'Escape') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          resetForm();
          target.blur();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUserId, meetingTitle, guestName, guestEmail, selectedDate, selectedTime, meetingType, meetingNotes]);

  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((b) => new Date(b.end_time) >= now && b.status !== 'cancelled')
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [bookings]);

  return (
    <PageFadeIn className="space-y-3 pb-8">
      {/* ── 1. Linear-Style Header Strip (h-10 / 40px) ── */}
      <div className="h-10 bg-white border border-zinc-200 rounded-lg px-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono" style={MONO}>
            <span>Minerva</span>
            <span>/</span>
            <span className="text-zinc-600 font-medium">Planning</span>
          </div>
          <span className="text-zinc-200">|</span>
          <h1 className="text-xs sm:text-sm font-semibold text-zinc-900 tracking-tight truncate">
            Planification &amp; Prise de Rendez-Vous
          </h1>
        </div>

        {/* Public Booking Link Strip (h-7) */}
        <div className="flex items-center gap-1.5 shrink-0 bg-zinc-50 border border-zinc-200 rounded-md px-2 py-0.5">
          <span className="text-[10px] uppercase font-semibold text-zinc-400 hidden md:inline">Lien Public :</span>
          <span className="text-xs font-mono font-medium text-zinc-700" style={MONO}>
            {publicBookingPath}
          </span>
          <button
            onClick={handleCopyLink}
            className="h-5 px-1.5 rounded text-[10px] font-medium bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
            title="Copier le lien public"
          >
            {copiedLink ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
            <span>{copiedLink ? 'Copié' : 'Copier'}</span>
          </button>
          <Link
            href={publicBookingPath}
            target="_blank"
            className="h-5 w-5 rounded bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 flex items-center justify-center transition-colors"
            title="Ouvrir la page publique"
          >
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>

      {/* ── 2. Monolithic 2-Column Architecture (65% / 35%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Colonne Gauche (65% - 8 cols on lg) */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden flex flex-col">
          {/* Segmented Control Header (h-9) */}
          <div className="h-9 px-3 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
            <div className="h-7 bg-zinc-100 p-0.5 rounded-md flex items-center text-xs">
              <button
                onClick={() => setLeftTab('meetings')}
                className={cn(
                  'px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5',
                  leftTab === 'meetings'
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}
              >
                <CalendarIcon className="w-3 h-3 text-zinc-500" />
                <span>Rendez-Vous Confirmés ({upcomingBookings.length})</span>
              </button>

              <button
                onClick={() => setLeftTab('availability')}
                className={cn(
                  'px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5',
                  leftTab === 'availability'
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}
              >
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>Créneaux Disponibles</span>
              </button>

              <button
                onClick={() => setLeftTab('settings')}
                className={cn(
                  'px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5',
                  leftTab === 'settings'
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}
              >
                <Settings className="w-3 h-3 text-zinc-500" />
                <span>Paramètres Cal</span>
              </button>
            </div>

            <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline" style={MONO}>
              Single Viewport 1080p
            </span>
          </div>

          {/* Tab 1: Rendez-Vous Confirmés */}
          {leftTab === 'meetings' && (
            <div>
              {/* Column Labels */}
              <div className="grid grid-cols-12 h-7 px-3.5 border-b border-zinc-100 bg-zinc-50/40 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 items-center">
                <span className="col-span-4">Réunion</span>
                <span className="col-span-2">Type</span>
                <span className="col-span-3">Date &amp; Heure</span>
                <span className="col-span-2">Invité</span>
                <span className="col-span-1 text-right">Action</span>
              </div>

              {/* Rows (h-9 / 36px) */}
              <div className="divide-y divide-zinc-100">
                {upcomingBookings.length === 0 ? (
                  <div className="h-16 px-3.5 flex items-center justify-between text-xs text-zinc-500 bg-zinc-50/30">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>Aucune réunion planifiée aujourd'hui.</span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400" style={MONO}>
                      Utiliser le volet droit pour créer un créneau →
                    </span>
                  </div>
                ) : (
                  upcomingBookings.map((b) => {
                    const start = new Date(b.start_time);
                    const end = new Date(b.end_time);
                    const isDemo = b.meeting_type === 'client_demo';

                    return (
                      <div
                        key={b.id}
                        className="grid grid-cols-12 h-9 px-3.5 items-center text-xs text-zinc-800 hover:bg-zinc-50/80 transition-colors group"
                      >
                        {/* Col 1: Titre */}
                        <div className="col-span-4 flex items-center gap-2 min-w-0 pr-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-semibold text-zinc-900 truncate">
                            {b.meeting_title}
                          </span>
                        </div>

                        {/* Col 2: Type Badge */}
                        <div className="col-span-2">
                          <span
                            className={cn(
                              'text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase tracking-wider',
                              isDemo
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            )}
                            style={MONO}
                          >
                            {isDemo ? 'Démo Client' : '1-on-1 Sync'}
                          </span>
                        </div>

                        {/* Col 3: Date & Heure */}
                        <div className="col-span-3 text-[11px] font-mono text-zinc-600 truncate" style={MONO}>
                          {start.toLocaleDateString('fr-CA', { month: '2-digit', day: '2-digit' })}{' '}
                          <span className="text-zinc-900 font-semibold">
                            {start.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          -
                          {end.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        {/* Col 4: Invité */}
                        <div className="col-span-2 text-[11px] text-zinc-600 truncate" title={`${b.guest_name} (${b.guest_email})`}>
                          {b.guest_name}
                        </div>

                        {/* Col 5: Actions hover */}
                        <div className="col-span-1 flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleCancelMeeting(b.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-rose-600 p-0.5 cursor-pointer"
                            title="Annuler la réunion"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Créneaux Disponibles */}
          {leftTab === 'availability' && (
            <div className="p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">
                  Définissez vos plages horaires de disponibilité pour le calendrier public de réservation.
                </p>
                <button
                  onClick={handleSaveAvailabilities}
                  className="h-7 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                >
                  Sauvegarder
                </button>
              </div>

              <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-lg overflow-hidden">
                {DAYS_OF_WEEK.map((d) => {
                  const slot = availabilities.find((s) => s.day_of_week === d.day) || {
                    id: `slot-${d.day}`,
                    user_id: currentUserId || '',
                    day_of_week: d.day,
                    start_time: '09:00',
                    end_time: '17:00',
                    is_active: d.day !== 0 && d.day !== 6,
                  };

                  return (
                    <div
                      key={d.day}
                      className={cn(
                        'h-9 px-3.5 flex items-center justify-between text-xs transition-colors',
                        slot.is_active ? 'bg-white' : 'bg-zinc-50/60 text-zinc-400'
                      )}
                    >
                      <div className="flex items-center gap-2.5 w-28">
                        <input
                          type="checkbox"
                          checked={slot.is_active}
                          onChange={() => handleToggleDay(d.day)}
                          className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className={cn('font-medium', slot.is_active ? 'text-zinc-900' : 'text-zinc-400')}>
                          {d.label}
                        </span>
                      </div>

                      {slot.is_active ? (
                        <div className="flex items-center gap-2 font-mono text-xs" style={MONO}>
                          <input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) => handleTimeChange(d.day, 'start_time', e.target.value)}
                            className="h-6 px-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded text-zinc-800 focus:outline-none focus:border-emerald-600"
                          />
                          <span className="text-zinc-400">à</span>
                          <input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => handleTimeChange(d.day, 'end_time', e.target.value)}
                            className="h-6 px-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded text-zinc-800 focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-zinc-400" style={MONO}>
                          Indisponible
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Paramètres Cal */}
          {leftTab === 'settings' && (
            <div className="p-4 space-y-3 text-xs">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                <span className="font-semibold text-zinc-900">Synchronisation Google Meet &amp; Agenda</span>
                <p className="text-zinc-500 text-[11px]">
                  Toute réunion générée intègre automatiquement une salle Google Meet dédiée (https://meet.google.com/minerva-sync).
                </p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                <span className="font-semibold text-zinc-900">Passerelle Cal.com / Calendly</span>
                <p className="text-zinc-500 text-[11px]">
                  Votre identifiant public <strong>{publicBookingSlug}</strong> synchronise les rendez-vous pris par les prospects en temps réel avec la table Supabase <code>meeting_bookings</code>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Colonne Droite (35% - 4 cols on lg): Formulaire d'Insertion Rapide Ancré */}
        <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs space-y-3 sticky top-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <div>
              <h2 className="text-xs font-semibold text-zinc-900 tracking-tight">
                Planification Rapide
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono" style={MONO}>
                ⌘ + ↵ pour confirmer
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded" style={MONO}>
              30 min
            </span>
          </div>

          <form onSubmit={handleCreateMeeting} className="space-y-2.5">
            {/* 1. Titre */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                Titre de la réunion *
              </label>
              <input
                ref={titleInputRef}
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Ex: Démo Minerva Flow - Restaurant Le Saint..."
                className="w-full h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 focus:outline-none transition-all"
                required
              />
            </div>

            {/* 2. Type de Réunion */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                Type d'événement
              </label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as MeetingBooking['meeting_type'])}
                className="w-full h-8 px-2 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none cursor-pointer"
              >
                <option value="client_demo">Démo Client (Minerva Flow / Packs Vidéo)</option>
                <option value="internal_sync">Point Interne (1-on-1 / Revue Opérationnelle)</option>
                <option value="review_session">Cadrage Technique &amp; Onboarding</option>
              </select>
            </div>

            {/* 3. Grille Date & Heure */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full h-8 px-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                  style={MONO}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Heure début
                </label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full h-8 px-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                  style={MONO}
                  required
                />
              </div>
            </div>

            {/* 4. Participant & Courriel */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Participant *
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Jean Tremblay"
                  className="w-full h-8 px-2 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Courriel *
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="jean@resto.ca"
                  className="w-full h-8 px-2 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* 5. Notes / Ordre du jour */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                Notes &amp; Ordre du jour
              </label>
              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Objectifs de la réunion, menu à aborder..."
                rows={2}
                className="w-full h-14 p-2 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none resize-none"
              />
            </div>

            {/* Bouton de Soumission */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-8 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Confirmation...' : 'Confirmer (⌘ + ↵)'}</span>
            </button>
          </form>

          {/* Micro-Footer Tips */}
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400 font-mono" style={MONO}>
            <span>Touche Échap pour réinitialiser</span>
            <span className="text-emerald-700">Auto Google Meet</span>
          </div>
        </div>
      </div>
    </PageFadeIn>
  );
}
