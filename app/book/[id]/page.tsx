'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Building2,
  Video,
  User,
  Mail,
  Phone,
  ArrowRight,
  Sparkles,
  MapPin,
  CalendarCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  fetchMemberAvailabilities,
  fetchMemberBookings,
  createBooking,
  generateDayTimeSlots,
  type MemberAvailabilitySlot,
  type MeetingBooking,
} from '@/lib/services/booking';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function PublicBookingPage() {
  const params = useParams();
  const hostId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || 'kael';

  const [availabilities, setAvailabilities] = useState<MemberAvailabilitySlot[]>([]);
  const [existingBookings, setExistingBookings] = useState<MeetingBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected booking slot
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Tomorrow by default
    return d.toISOString().slice(0, 10);
  });
  const [selectedSlot, setSelectedSlot] = useState<{ time: string; startIso: string; endIso: string } | null>(null);

  // Form Fields
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestCompany, setGuestCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<MeetingBooking | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [aData, bData] = await Promise.all([
          fetchMemberAvailabilities(hostId),
          fetchMemberBookings(hostId),
        ]);
        setAvailabilities(aData);
        setExistingBookings(bData);
      } finally {
        setLoading(false);
      }
    })();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !guestName || !guestEmail) return;

    setSubmitting(true);
    try {
      const booking = await createBooking({
        host_id: hostId,
        host_name: 'Minerva Studio',
        host_email: 'contact@minerva.ca',
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        guest_company: guestCompany,
        meeting_type: 'client_demo',
        meeting_title: `Échange Stratégique — ${guestCompany || guestName} & Minerva`,
        start_time: selectedSlot.startIso,
        end_time: selectedSlot.endIso,
        status: 'confirmed',
        notes,
        location_url: 'https://meet.google.com/minerva-rdv',
      });

      setConfirmedBooking(booking);
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedBooking) {
    const startD = new Date(confirmedBooking.start_time);
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold font-display text-zinc-900 tracking-tight">
              Rendez-Vous Confirmé !
            </h1>
            <p className="text-xs text-zinc-500">
              Une invitation Google Meet vous a été envoyée par courriel.
            </p>
          </div>

          <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-4 text-left text-xs space-y-2 font-mono" style={MONO}>
            <div className="flex items-center justify-between text-zinc-700">
              <span className="font-semibold text-zinc-900">Date :</span>
              <span>{startD.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-700">
              <span className="font-semibold text-zinc-900">Heure :</span>
              <span>{startD.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })} (HE)</span>
            </div>
            <div className="flex items-center justify-between text-zinc-700">
              <span className="font-semibold text-zinc-900">Participant :</span>
              <span>{confirmedBooking.guest_name}</span>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={confirmedBooking.location_url || 'https://meet.google.com'}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Video className="w-4 h-4" />
              <span>Lien Visio Google Meet</span>
            </a>
          </div>

          <p className="text-[11px] text-zinc-400">
            Minerva Studio • Montréal, Québec
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] py-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Column: Host Details */}
        <div className="md:col-span-4 bg-zinc-900 text-white p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Minerva Studio</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold font-display tracking-tight text-white">
                Rendez-Vous Stratégique
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Échange de cadrage en visioconférence pour évaluer la croissance de votre restaurant ou commerce local.
              </p>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-zinc-800 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>30 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Visioconférence Google Meet</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Montréal, Québec (HE)</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-zinc-500 pt-4 border-t border-zinc-800/80">
            Minerva Reach • Flow • Trequartista
          </div>
        </div>

        {/* Right Column: Slot Selection & Form */}
        <div className="md:col-span-8 p-6 sm:p-8 space-y-6">
          {!selectedSlot ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">1. Choisissez une date &amp; un créneau</h3>
                <p className="text-xs text-zinc-500">Sélectionnez le jour qui vous convient le mieux.</p>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-mono text-zinc-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  style={MONO}
                />
              </div>

              {/* Available Slots */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-700">Créneaux Disponibles</label>
                {daySlots.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-zinc-200 rounded-xl text-xs text-zinc-400">
                    Aucun créneau disponible pour cette date. Veuillez sélectionner un autre jour ouvré.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {daySlots.map((s, idx) => (
                      <button
                        key={idx}
                        disabled={!s.available}
                        onClick={() => setSelectedSlot(s)}
                        className={cn(
                          'py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer font-mono',
                          s.available
                            ? 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-emerald-900'
                            : 'border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed line-through'
                        )}
                        style={MONO}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">2. Vos coordonnées</h3>
                  <p className="text-xs text-zinc-500 font-mono" style={MONO}>
                    Créneau choisi : {selectedDate} à {selectedSlot.time} (30 min)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="text-xs text-emerald-700 font-semibold hover:underline cursor-pointer"
                >
                  Changer de créneau
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Votre Nom Complet *</label>
                  <input
                    type="text"
                    required
                    placeholder="Jean Tremblay"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Votre Courriel *</label>
                  <input
                    type="email"
                    required
                    placeholder="jean@monresto.ca"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Numéro de Téléphone</label>
                  <input
                    type="tel"
                    placeholder="514 555-0199"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nom du Restaurant / Commerce</label>
                  <input
                    type="text"
                    placeholder="Bistro Laurier"
                    value={guestCompany}
                    onChange={(e) => setGuestCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Vos Objectifs &amp; Enjeux</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Refonte du menu QR, commandes en ligne sans commission, production de vidéos Reels..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>{submitting ? 'Confirmation en cours…' : 'Confirmer le Rendez-Vous'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
