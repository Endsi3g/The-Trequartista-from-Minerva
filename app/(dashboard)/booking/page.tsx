'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Users,
  Video,
  Plus,
  ExternalLink,
  Copy,
  Check,
  CalendarCheck,
  Settings,
  Sparkles,
  ArrowRight,
  X,
  Phone,
  Building2,
  Share2,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useToast } from '@/components/providers/ToastProvider';
import {
  fetchMemberAvailabilities,
  saveMemberAvailabilities,
  fetchMemberBookings,
  createBooking,
  updateBookingStatus,
  generateDayTimeSlots,
  type MemberAvailabilitySlot,
  type MeetingBooking,
} from '@/lib/services/booking';
import { fetchTeamMembers } from '@/lib/services/supabase-data';
import type { TeamMemberSummary } from '@/lib/types';
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

  const [activeTab, setActiveTab] = useState<'meetings' | 'availability' | 'new_meeting'>('meetings');
  const [bookings, setBookings] = useState<MeetingBooking[]>([]);
  const [availabilities, setAvailabilities] = useState<MemberAvailabilitySlot[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // New Internal Meeting Form
  const [meetingTitle, setMeetingTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [meetingType, setMeetingType] = useState<MeetingBooking['meeting_type']>('internal_sync');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const publicBookingUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/book/${currentUserId || 'kael'}`;
    return `${window.location.origin}/book/${currentUserId || 'kael'}`;
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    (async () => {
      setLoading(true);
      try {
        const [bData, aData, mData] = await Promise.all([
          fetchMemberBookings(currentUserId),
          fetchMemberAvailabilities(currentUserId),
          fetchTeamMembers(currentUserId),
        ]);
        setBookings(bData);
        setAvailabilities(aData);
        setTeamMembers(mData);
      } catch (err) {
        console.warn('[Booking] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUserId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicBookingUrl);
    setCopiedLink(true);
    toastSuccess('Lien copié !', 'Le lien de réservation a été copié dans le presse-papier.');
    setTimeout(() => setCopiedLink(false), 2000);
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
      toastSuccess('Disponibilités sauvegardées', 'Vos créneaux hebdomadaires ont été mis à jour.');
    } catch {
      toastError('Erreur', 'Impossible de sauvegarder les disponibilités.');
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || !meetingTitle || !guestName || !guestEmail) {
      toastError('Champs obligatoires manquants', 'Veuillez remplir le titre, le participant et l’email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 min default

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
      toastSuccess('Réunion planifiée', `La réunion « ${meetingTitle} » a été confirmée.`);
      setMeetingTitle('');
      setGuestName('');
      setGuestEmail('');
      setMeetingNotes('');
      setActiveTab('meetings');
    } catch (err) {
      toastError('Erreur', 'Impossible de planifier la réunion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelMeeting = async (bookingId: string) => {
    if (!currentUserId) return;
    await updateBookingStatus(bookingId, currentUserId, 'cancelled');
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b)));
    toastInfo('Réunion annulée', 'Le statut a été mis à jour.');
  };

  const upcomingBookings = useMemo(() => {
    return bookings.filter((b) => b.status === 'confirmed');
  }, [bookings]);

  return (
    <PageFadeIn className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ── 1. Header & Public Link Banner ── */}
      <div className="bg-mv-surface border border-mv-border rounded-xl p-5 shadow-mv-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 border border-emerald-200/60 px-2 py-0.5 rounded-full">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Module Booking In-App</span>
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              Disponibilités • 1-on-1 • Démos Clients
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-mv-ink tracking-tight">
            Planification &amp; Prise de Rendez-Vous
          </h1>
          <p className="text-xs sm:text-sm text-mv-ink-soft max-w-2xl">
            Gérez vos créneaux de disponibilité, organisez des réunions d'équipe internes et partagez votre lien public pour les prospects.
          </p>
        </div>

        {/* Shareable Public Booking Link */}
        <div className="p-3 bg-mv-cream-soft border border-mv-border rounded-lg flex items-center gap-3 shrink-0">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Votre Lien Public Client
            </span>
            <span className="text-xs font-mono font-semibold text-zinc-800 max-w-[200px] sm:max-w-[260px] truncate block" style={MONO}>
              /book/{currentUserId ? currentUserId.slice(0, 8) : 'demo'}
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className="h-8 px-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copié' : 'Copier'}</span>
          </button>
          <Link
            href={`/book/${currentUserId || 'demo'}`}
            target="_blank"
            className="h-8 w-8 rounded-md border border-mv-border bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-700 transition-colors"
            title="Tester la page publique de réservation"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── 2. Segmented Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-mv-border pb-1">
        <button
          onClick={() => setActiveTab('meetings')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'meetings'
              ? 'bg-zinc-900 text-white shadow-2xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Mes Rendez-Vous ({upcomingBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'availability'
              ? 'bg-zinc-900 text-white shadow-2xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Créneaux de Disponibilité</span>
        </button>

        <button
          onClick={() => setActiveTab('new_meeting')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'new_meeting'
              ? 'bg-zinc-900 text-white shadow-2xs'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Planifier une Réunion</span>
        </button>
      </div>

      {/* ── 3. Tab: Mes Rendez-Vous ── */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <Card className="p-12 text-center bg-mv-surface border-mv-border rounded-xl space-y-3">
              <CalendarCheck className="w-10 h-10 text-zinc-300 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-900">Aucune réunion à venir</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Partagez votre lien public de réservation avec vos prospects ou planifiez une réunion interne d'équipe.
              </p>
              <Button
                onClick={() => setActiveTab('new_meeting')}
                className="bg-mv-green hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 cursor-pointer mt-2"
              >
                <Plus size={14} />
                <span>Planifier un rendez-vous</span>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {upcomingBookings.map((b) => {
                const startDate = new Date(b.start_time);
                const endDate = new Date(b.end_time);
                return (
                  <Card key={b.id} className="p-4 bg-mv-surface border-mv-border rounded-xl space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h4 className="text-xs font-bold text-zinc-900">{b.meeting_title}</h4>
                      </div>
                      <Badge variant={b.meeting_type === 'internal_sync' ? 'purple' : 'green'}>
                        {b.meeting_type === 'internal_sync' ? 'Interne 1-on-1' : 'Démo Client'}
                      </Badge>
                    </div>

                    <div className="bg-mv-cream-soft p-2.5 rounded-lg border border-mv-border space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-zinc-700 font-mono" style={MONO}>
                        <span className="font-semibold">{startDate.toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <span>{startDate.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Avec : <strong className="text-zinc-800">{b.guest_name}</strong> ({b.guest_email})</span>
                        {b.guest_company && <span>{b.guest_company}</span>}
                      </div>
                      {b.notes && (
                        <p className="text-[11px] text-zinc-600 italic pt-1 border-t border-mv-border/60">
                          « {b.notes} »
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <a
                        href={b.location_url || 'https://meet.google.com'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-mv-green font-semibold hover:underline flex items-center gap-1"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Rejoindre Google Meet</span>
                      </a>

                      <button
                        onClick={() => handleCancelMeeting(b.id)}
                        className="text-zinc-400 hover:text-red-600 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Tab: Créneaux de Disponibilité ── */}
      {activeTab === 'availability' && (
        <Card className="p-6 bg-mv-surface border-mv-border rounded-xl space-y-6 shadow-mv-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mv-border pb-4">
            <div>
              <h2 className="text-sm font-bold text-mv-ink">Horaires d'ouverture hebdomadaires</h2>
              <p className="text-xs text-mv-ink-soft">
                Définissez les jours et plages horaires durant lesquels vous acceptez des rendez-vous.
              </p>
            </div>
            <Button
              onClick={handleSaveAvailabilities}
              className="bg-mv-green hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 cursor-pointer shrink-0"
            >
              <CheckCircle2 size={14} />
              <span>Enregistrer les disponibilités</span>
            </Button>
          </div>

          <div className="space-y-3 divide-y divide-mv-border">
            {DAYS_OF_WEEK.map((d) => {
              const slot = availabilities.find((s) => s.day_of_week === d.day);
              const isActive = slot ? slot.is_active : false;
              const startTime = slot ? slot.start_time : '09:00';
              const endTime = slot ? slot.end_time : '17:00';

              return (
                <div key={d.day} className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 w-36">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => handleToggleDay(d.day)}
                      className="w-4 h-4 rounded border-mv-border text-mv-green focus:ring-0 cursor-pointer"
                    />
                    <span className={cn('font-semibold', isActive ? 'text-zinc-900' : 'text-zinc-400')}>
                      {d.label}
                    </span>
                  </div>

                  {isActive ? (
                    <div className="flex items-center gap-2 font-mono" style={MONO}>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => handleTimeChange(d.day, 'start_time', e.target.value)}
                        className="px-2.5 py-1 rounded-md border border-mv-border bg-mv-cream-soft text-xs text-zinc-800"
                      />
                      <span className="text-zinc-400">à</span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => handleTimeChange(d.day, 'end_time', e.target.value)}
                        className="px-2.5 py-1 rounded-md border border-mv-border bg-mv-cream-soft text-xs text-zinc-800"
                      />
                    </div>
                  ) : (
                    <span className="text-zinc-400 italic">Indisponible</span>
                  )}

                  <div className="text-zinc-500 text-[11px] hidden sm:block font-mono" style={MONO}>
                    Créneaux 30 min • 10 min tampon
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── 5. Tab: Planifier une Réunion ── */}
      {activeTab === 'new_meeting' && (
        <Card className="p-6 bg-mv-surface border-mv-border rounded-xl space-y-6 shadow-mv-sm max-w-2xl mx-auto">
          <div className="border-b border-mv-border pb-3">
            <h2 className="text-sm font-bold text-mv-ink">Planifier une réunion interne ou client</h2>
            <p className="text-xs text-mv-ink-soft">
              Bloquez un créneau directement dans votre calendrier d'agence.
            </p>
          </div>

          <form onSubmit={handleCreateMeeting} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">Titre de la réunion *</label>
              <input
                type="text"
                required
                placeholder="Ex: Point Hebdo — Revue Livrables & Vidéos"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-zinc-900 focus:outline-none focus:border-mv-green"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Type de réunion</label>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-zinc-900 focus:outline-none focus:border-mv-green cursor-pointer"
                >
                  <option value="internal_sync">Synchronisation interne 1-on-1</option>
                  <option value="client_demo">Démonstration Client Minerva Flow</option>
                  <option value="audit_review">Revue d'Audit Marketing</option>
                  <option value="custom">Autre échange</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-zinc-900 focus:outline-none focus:border-mv-green font-mono"
                  style={MONO}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Heure de début *</label>
                <input
                  type="time"
                  required
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-zinc-900 focus:outline-none focus:border-mv-green font-mono"
                  style={MONO}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Nom de l’interlocuteur *</label>
                <input
                  type="text"
                  required
                  placeholder="Collaborateur ou client"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-zinc-900 focus:outline-none focus:border-mv-green"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">Courriel de l’invité *</label>
              <input
                type="email"
                required
                placeholder="contact@exemple.ca"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-zinc-900 focus:outline-none focus:border-mv-green"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">Notes ou ordre du jour (optionnel)</label>
              <textarea
                rows={3}
                placeholder="Objectifs de la réunion, points à valider..."
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-zinc-900 focus:outline-none focus:border-mv-green resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('meetings')}
                className="text-xs"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-mv-green hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>{isSubmitting ? 'Planification…' : 'Confirmer la réunion'}</span>
              </Button>
            </div>
          </form>
        </Card>
      )}
    </PageFadeIn>
  );
}
