'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Loader2,
  ExternalLink,
  CalendarCheck,
  AlertCircle,
} from 'lucide-react';
import { generateInstallationSlots } from '@/lib/leads/scoring';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface LeadPublicData {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  city: string | null;
  call_at: string | null;
  status: string;
  qualification_tier: 'A' | 'B' | 'C' | null;
  qualification_score: number | null;
}

function MerciPageContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams ? searchParams.get('leadId') : null;

  const [lead, setLead] = useState<LeadPublicData | null>(null);
  const [loadingLead, setLoadingLead] = useState(true);
  const [errorLead, setErrorLead] = useState<string | null>(null);

  // Slots d'installation disponibles (2 créneaux par semaine)
  const availableSlots = useMemo(() => generateInstallationSlots(4), []);
  const [selectedSlotIso, setSelectedSlotIso] = useState<string>(() =>
    availableSlots.length > 0 ? availableSlots[0].dateIso : ''
  );
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // 1. Déclenchement de la conversion Google Ads 'formulaire envoyé' (anti-doublon via sessionStorage)
  useEffect(() => {
    if (!leadId) return;
    const sessionKey = `gads_conv_tracked_${leadId}`;
    if (typeof window !== 'undefined' && !sessionStorage.getItem(sessionKey)) {
      const gadsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
      const gadsLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL;

      if ((window as any).gtag && gadsId && gadsLabel) {
        (window as any).gtag('event', 'conversion', {
          send_to: `${gadsId}/${gadsLabel}`,
          event_category: 'lead',
          event_label: 'formulaire_envoye',
        });
        console.log('[Google Ads] Conversion enregistrée pour lead:', leadId);
      }
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, [leadId]);

  // 2. Chargement des données du lead
  useEffect(() => {
    if (!leadId) {
      setLoadingLead(false);
      return;
    }

    let isMounted = true;
    fetch(`/api/leads/${leadId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Lead non trouvé');
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.lead) {
          setLead(data.lead);
          if (data.lead.call_at) {
            setSelectedSlotIso(data.lead.call_at);
            setBookingSuccess(true);
          }
        }
      })
      .catch((err) => {
        if (isMounted) setErrorLead(err.message);
      })
      .finally(() => {
        if (isMounted) setLoadingLead(false);
      });

    return () => {
      isMounted = false;
    };
  }, [leadId]);

  // 3. Réservation du créneau
  const handleBookSlot = async () => {
    if (!leadId || !selectedSlotIso) return;
    setBookingInProgress(true);
    setBookingError(null);

    try {
      const res = await fetch(`/api/leads/${leadId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotIso: selectedSlotIso }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la réservation du créneau');
      }

      setBookingSuccess(true);
      if (lead) {
        setLead({ ...lead, call_at: selectedSlotIso, status: 'RDV Fixé' });
      }
    } catch (err: any) {
      setBookingError(err.message);
    } finally {
      setBookingInProgress(false);
    }
  };

  const calFallbackUrl =
    process.env.NEXT_PUBLIC_CAL_BOOKING_URL ||
    (lead ? `https://cal.com/minerva-agency/installation-45min?name=${encodeURIComponent(lead.contact_name)}&email=${encodeURIComponent(lead.email)}` : 'https://cal.com');

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        {/* En-tête Merci */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm mb-2">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Demande bien reçue !
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-lg mx-auto">
            Votre dossier est enregistré. Nous avons pré-qualifié votre établissement pour une intervention rapide.
          </p>
        </div>

        {/* Récapitulatif du Lead */}
        {loadingLead ? (
          <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-3 text-zinc-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            Récupération de vos détails de réservation...
          </div>
        ) : lead ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <div className="text-xs text-zinc-500">Établissement</div>
                <div className="text-base font-bold text-zinc-900 dark:text-white">{lead.company_name}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500">Responsable</div>
                <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{lead.contact_name}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-zinc-500">
                Secteur : <strong className="text-zinc-800 dark:text-zinc-200">{lead.city || 'Grand Montréal'}</strong>
              </span>
              {lead.qualification_tier && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                  <Sparkles className="w-3 h-3" />
                  Priorité d&apos;intervention : Tier {lead.qualification_tier}
                </span>
              )}
            </div>
          </div>
        ) : null}

        {/* Module de Réservation Hybride */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Étape Finale : Créneau d&apos;Installation
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                Choisissez votre créneau sur place (45-60 min)
              </h2>
            </div>
            <span className="hidden sm:inline-flex px-2.5 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md">
              2 créneaux / semaine
            </span>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed">
            Notre technicien se déplace directement à votre restaurant avec l&apos;imprimante thermique configurée, effectue les tests de caisse réels et forme votre personnel en 15 minutes.
          </p>

          {bookingSuccess && lead?.call_at ? (
            <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600 text-white mx-auto">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                Intervention confirmée !
              </h3>
              <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
                📅{' '}
                {new Date(lead.call_at).toLocaleDateString('fr-CA', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Un courriel et un SMS de rappel vous seront envoyés 24h puis 2h avant le passage du technicien.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookingError && (
                <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {bookingError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlotIso === slot.dateIso;
                  return (
                    <button
                      key={slot.slotId}
                      type="button"
                      onClick={() => setSelectedSlotIso(slot.dateIso)}
                      className={`p-3.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between gap-1 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/30'
                      }`}
                    >
                      <div className="font-semibold text-sm capitalize">{slot.label}</div>
                      <div className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Durée 45-60 min
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleBookSlot}
                disabled={bookingInProgress || !selectedSlotIso}
                className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-emerald-600/20 mt-2"
              >
                {bookingInProgress ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validation de votre date...
                  </>
                ) : (
                  <>
                    <CalendarCheck className="w-4 h-4" />
                    Confirmer cette intervention sur place
                  </>
                )}
              </button>

              {/* Option de secours Cal.com / Calendly */}
              <div className="pt-3 text-center">
                <a
                  href={calFallbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  Aucun de ces deux créneaux ne vous convient ? Ouvrir le calendrier étendu Cal.com
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Checklist d'Intervention - Aperçu des 6 Étapes */}
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Ce qui est inclus durant l&apos;intervention :
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Préparation matérielle en amont
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Branchement imprimante & Wi-Fi
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Test d&apos;une vraie transaction test
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Formation de l&apos;équipe avec script
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Photos des supports & chevalets
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Passage en essai actif (0$ de frais)
              </div>
            </div>
          </div>
        </div>

        {/* Support Direct */}
        <div className="text-center text-xs text-zinc-500 space-y-1">
          <div>Besoin d&apos;une réponse immédiate ? Contactez le support Minerva Agency</div>
          <div className="font-semibold text-zinc-700 dark:text-zinc-300">
            support@minervaflow.com • 514-555-0199
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MerciPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#09090B]">
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            Chargement...
          </div>
        </div>
      }
    >
      <MerciPageContent />
    </Suspense>
  );
}
