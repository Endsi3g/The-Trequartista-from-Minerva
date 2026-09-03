'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Utensils,
  Target,
  Layers,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

function DemandeFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Montréal');
  const [monthlyTransactions, setMonthlyTransactions] = useState('250');
  const [posSystem, setPosSystem] = useState('Lightspeed');
  const [businessType, setBusinessType] = useState('Fast-food / Restauration rapide');
  const [loyaltyGoal, setLoyaltyGoal] = useState('Fidélisation & Rétention des clients');
  const [isMultiSite, setIsMultiSite] = useState(false);
  const [consentSms, setConsentSms] = useState(true);

  // Marketing Tracking State
  const [utms, setUtms] = useState({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
    gclid: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams) {
      setUtms({
        utm_source: searchParams.get('utm_source') || '',
        utm_medium: searchParams.get('utm_medium') || '',
        utm_campaign: searchParams.get('utm_campaign') || '',
        utm_term: searchParams.get('utm_term') || '',
        utm_content: searchParams.get('utm_content') || '',
        gclid: searchParams.get('gclid') || '',
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const payload = {
        company_name: companyName,
        contact_name: contactName,
        email,
        phone,
        city,
        monthly_transactions: parseInt(monthlyTransactions, 10) || 0,
        pos_system: posSystem,
        business_type: businessType,
        loyalty_goal: loyaltyGoal,
        is_multi_site: isMultiSite,
        consent_sms: consentSms,
        utm_source: utms.utm_source || 'website_form',
        utm_medium: utms.utm_medium || null,
        utm_campaign: utms.utm_campaign || null,
        utm_term: utms.utm_term || null,
        utm_content: utms.utm_content || null,
        gclid: utms.gclid || null,
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Une erreur est survenue lors de l\'envoi.');
      }

      // Redirection vers la page merci avec l'ID du lead
      router.push(`/merci?leadId=${data.leadId}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible d\'envoyer le formulaire.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Minerva Flow • Déploiement en 45-60 min
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Activez votre borne de fidélité & commande
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            0% de commission tierce, compatibilité directe avec votre caisse actuelle, et installation sur place garantie.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1 : Contact & Établissement */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> 1. Votre Établissement
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Nom du restaurant ou commerce *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Bistro Bella Vista"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Nom du responsable *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: Julien Tremblay"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Courriel professionnel *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="direction@restaurant.ca"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Téléphone direct *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="514-555-0199"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Section 2 : Qualification Technique & POS */}
            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> 2. Configuration & Volume
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Ville ou secteur *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  >
                    <option value="Montréal">Montréal (Île)</option>
                    <option value="Laval">Laval</option>
                    <option value="Longueuil">Longueuil / Rive-Sud</option>
                    <option value="Autre région QC">Autre région (Québec)</option>
                    <option value="Hors Québec">Hors Québec</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Système de caisse (POS) actuel *
                  </label>
                  <select
                    value={posSystem}
                    onChange={(e) => setPosSystem(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  >
                    <option value="Lightspeed">Lightspeed (Recommandé)</option>
                    <option value="Square">Square</option>
                    <option value="Clover">Clover</option>
                    <option value="TouchBistro">TouchBistro</option>
                    <option value="Maitre'D">Maitre&apos;D</option>
                    <option value="Toast">Toast</option>
                    <option value="Autre">Autre / Caisse classique</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Transactions estimées / mois *
                  </label>
                  <select
                    value={monthlyTransactions}
                    onChange={(e) => setMonthlyTransactions(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  >
                    <option value="50">Moins de 100 tx / mois</option>
                    <option value="150">100 à 199 tx / mois</option>
                    <option value="250">200 à 499 tx / mois (+200)</option>
                    <option value="750">500 à 999 tx / mois</option>
                    <option value="2000">1 000+ tx / mois</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Type d&apos;établissement *
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  >
                    <option value="Fast-food / Restauration rapide">Fast-food / Restauration rapide</option>
                    <option value="Café / Boulangerie">Café / Boulangerie</option>
                    <option value="Bar / Pizzeria">Bar / Pizzeria</option>
                    <option value="Casual Dining">Casual Dining / Resto traditionnel</option>
                    <option value="Commerce de détail">Commerce de détail</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Objectif prioritaire *
                </label>
                <select
                  value={loyaltyGoal}
                  onChange={(e) => setLoyaltyGoal(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                >
                  <option value="Fidélisation & Rétention des clients">Fidélisation & Rétention des clients</option>
                  <option value="Éliminer les commissions tierces (UberEats/DoorDash)">
                    Éliminer les commissions tierces (UberEats/DoorDash)
                  </option>
                  <option value="Augmenter le panier moyen par client">Augmenter le panier moyen par client</option>
                  <option value="Autre objectif">Autre objectif d&apos;efficacité</option>
                </select>
              </div>

              {/* Multi-sites checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="multiSite"
                  checked={isMultiSite}
                  onChange={(e) => setIsMultiSite(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
                <label htmlFor="multiSite" className="text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  Mon commerce possède plusieurs succursales ou points de vente (+5 pts)
                </label>
              </div>

              {/* SMS Consent checkbox (CASL / TCPA compliant) */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consentSms"
                  checked={consentSms}
                  onChange={(e) => setConsentSms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                />
                <label htmlFor="consentSms" className="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer leading-relaxed">
                  J&apos;accepte de recevoir les rappels de rendez-vous et alertes de statut par SMS. Vous pouvez vous désabonner à tout moment en répondant STOP.
                </label>
              </div>
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-emerald-600/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calcul de la qualification en cours...
                </>
              ) : (
                <>
                  Valider ma demande & Choisir mon créneau d&apos;installation
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-zinc-500">
          Minerva Agency • Protocole d&apos;intervention garanti sans interruption de service
        </div>
      </div>
    </div>
  );
}

export default function DemandePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#09090B]">
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            Chargement du formulaire...
          </div>
        </div>
      }
    >
      <DemandeFormContent />
    </Suspense>
  );
}
