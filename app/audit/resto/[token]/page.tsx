'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  Utensils,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/ToastProvider';
import { calculateCommissionSavings, fetchRestaurantAuditByToken } from '@/lib/services/minerva-flow';
import type { RestaurantAudit } from '@/lib/types';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function RestaurantAuditPublicPage() {
  const params = useParams();
  const token = (params?.token as string) || 'demo';
  const { toastSuccess, toastError } = useToast();

  const [audit, setAudit] = useState<RestaurantAudit | null>(null);
  const [loading, setLoading] = useState(true);
  const [interactiveVolume, setInteractiveVolume] = useState<number>(18500);
  const [interactiveRate, setInteractiveRate] = useState<number>(28);

  // Booking / Contact Form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [selectedUpsell, setSelectedUpsell] = useState<string>('flow_starter');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadAudit() {
      setLoading(true);
      const data = await fetchRestaurantAuditByToken(token);
      if (data) {
        setAudit(data);
        setInteractiveVolume(data.monthly_ubereats_volume_cad);
        setInteractiveRate(data.commission_rate_pct);
      }
      setLoading(false);
    }
    loadAudit();
  }, [token]);

  const calc = useMemo(() => {
    return calculateCommissionSavings(interactiveVolume, interactiveRate);
  }, [interactiveVolume, interactiveRate]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || (!contactPhone.trim() && !contactEmail.trim())) {
      toastError('Champs requis', 'Veuillez renseigner votre nom et vos coordonnées.');
      return;
    }

    setSubmitting(true);
    try {
      await fetch('/api/flow/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_name: audit?.restaurant_name || 'Restaurant Prospect',
          contact_name: contactName,
          email: contactEmail,
          phone: contactPhone,
          monthly_ubereats_volume_cad: interactiveVolume,
          commission_rate_pct: interactiveRate,
        }),
      });

      setSubmitting(false);
      setSubmitted(true);
      toastSuccess('Demande reçue', 'Notre équipe Minerva prendra contact avec vous dans les 24h.');
    } catch {
      setSubmitting(false);
      toastError('Erreur', 'Impossible d’envoyer la demande. Réessayez.');
    }
  };

  return (
    <div className="min-h-screen bg-mv-cream text-mv-ink font-sans pb-24">
      {/* ── Public Brand Header ── */}
      <header className="border-b border-mv-border bg-mv-surface/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-mv-green flex items-center justify-center text-white shadow-sm">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-mv-ink tracking-tight font-display block">
                MINERVA FLOW
              </span>
              <span className="text-[10px] text-mv-ink-soft uppercase tracking-wider font-semibold">
                Rapport de Rentabilité & Diagnostic Livraison
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://minervaflow.framer.website/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1 hidden sm:flex"
            >
              <span>Découvrir la plateforme</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="#reserver"
              className="px-3.5 py-1.5 rounded-xl bg-mv-green text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
            >
              Économiser mes commissions
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Diagnostic Body ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Title & Restaurant Context */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="green" className="mx-auto">
            ● Audit Spécial Restauration & Commande Directe
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-mv-ink">
            Combien perdez-vous chaque année sur UberEats & DoorDash ?
          </h1>
          <p className="text-sm text-mv-ink-soft">
            Analyse chiffrée préparée pour{' '}
            <strong className="text-mv-ink font-bold">{audit?.restaurant_name || 'Votre Établissement'}</strong>.
          </p>
        </div>

        {/* ── Key Impact Numbers Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Perte Annuelle */}
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-2 shadow-mv-sm">
            <span className="text-xs font-bold text-red-800 uppercase tracking-wider">
              Commissions Données aux Apps
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-red-600 font-mono" style={MONO}>
              -{calc.annualCommissionPaidCad.toLocaleString('fr-CA')} $
            </div>
            <p className="text-xs text-red-700">
              Soit environ <strong className="font-mono">{calc.monthlyCommissionPaidCad.toLocaleString('fr-CA')} $ / mois</strong> amputés de votre marge.
            </p>
          </div>

          {/* Card 2: Gain Net Minerva Flow */}
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-2 shadow-mv-sm">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Économies Nettes Préservées
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 font-mono" style={MONO}>
              +{calc.netAnnualSavingsCad.toLocaleString('fr-CA')} $
            </div>
            <p className="text-xs text-emerald-800">
              Retour sur investissement de <strong className="font-mono">+{calc.savingsRoiPercentage}%</strong> dès la 1ère année.
            </p>
          </div>

          {/* Card 3: Coût Fixe Flow */}
          <div className="p-6 rounded-2xl bg-mv-surface border border-mv-border text-center space-y-2 shadow-mv-sm">
            <span className="text-xs font-bold text-mv-ink-soft uppercase tracking-wider">
              Abonnement Fixe Minerva Flow
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-mv-ink font-mono" style={MONO}>
              149 $ <span className="text-base font-normal text-mv-ink-soft">/ mois</span>
            </div>
            <p className="text-xs text-mv-ink-soft">
              <strong className="text-mv-green">0% de commission</strong> sur vos commandes directes et à emporter.
            </p>
          </div>
        </div>

        {/* ── Interactive Simulator Card ── */}
        <Card className="p-6 sm:p-8 space-y-6 bg-mv-surface border-mv-border shadow-mv-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-mv-border pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-mv-ink font-display">
                Ajustez votre volume réel pour simuler vos gains
              </h2>
              <p className="text-xs text-mv-ink-soft">
                Faites glisser les curseurs selon votre chiffre d'affaires mensuel en livraison.
              </p>
            </div>
            <Badge variant="blue">Simulateur Temps Réel</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold text-mv-ink mb-2">
                  <span>Volume mensuel en livraison (CAD)</span>
                  <span className="font-mono text-mv-green text-sm">{interactiveVolume.toLocaleString('fr-CA')} $ / mois</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="80000"
                  step="1000"
                  value={interactiveVolume}
                  onChange={(e) => setInteractiveVolume(Number(e.target.value))}
                  className="w-full accent-mv-green cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-mv-ink-faint font-mono mt-1">
                  <span>2 000 $</span>
                  <span>40 000 $</span>
                  <span>80 000 $</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-mv-ink mb-2">
                  <span>Taux de commission plateforme</span>
                  <span className="font-mono text-mv-ink text-sm">{interactiveRate} %</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="35"
                  step="1"
                  value={interactiveRate}
                  onChange={(e) => setInteractiveRate(Number(e.target.value))}
                  className="w-full accent-mv-green cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-mv-ink-faint font-mono mt-1">
                  <span>15%</span>
                  <span>28% (Moyenne Québec)</span>
                  <span>35%</span>
                </div>
              </div>
            </div>

            {/* Side summary comparison */}
            <div className="bg-mv-cream-soft p-5 rounded-2xl border border-mv-border space-y-3 flex flex-col justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-mv-ink">
                Comparatif Direct sur 12 Mois
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-mv-ink-soft">Ventes annuelles en livraison :</span>
                  <strong className="font-mono font-bold text-mv-ink">
                    {(interactiveVolume * 12).toLocaleString('fr-CA')} $
                  </strong>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Ce que vous laissez aux applications :</span>
                  <strong className="font-mono font-bold">
                    -{calc.annualCommissionPaidCad.toLocaleString('fr-CA')} $
                  </strong>
                </div>
                <div className="flex justify-between text-mv-ink-soft">
                  <span>Coût total avec Minerva Flow :</span>
                  <strong className="font-mono font-bold text-mv-ink">1 788 $ CAD</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-mv-border flex items-center justify-between">
                <span className="font-bold text-sm text-mv-ink">Gain net pour votre restaurant :</span>
                <span className="font-mono text-xl font-extrabold text-emerald-600" style={MONO}>
                  +{calc.netAnnualSavingsCad.toLocaleString('fr-CA')} $
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Studio & Agency Synergies Card ── */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold text-mv-ink font-display">
              Accompagnement Studio & Agence Minerva
            </h2>
            <p className="text-xs text-mv-ink-soft">
              Démarrez avec Minerva Flow et activez les services créatifs de notre studio pour générer du trafic immédiat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-mv-surface p-5 rounded-2xl border border-mv-border space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-mv-green flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-mv-ink">Pack Reels & TikTok 4K</h3>
              <p className="text-xs text-mv-ink-soft">
                Shooting culinaire cinéma sur place pour sublimer vos assiettes et attirer les clients locaux.
              </p>
              <span className="font-mono font-extrabold text-xs text-mv-green block">1 500 $ CAD</span>
            </div>

            <div className="bg-mv-surface p-5 rounded-2xl border border-mv-border space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-mv-blue flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-mv-ink">Site Framer & Menu Direct</h3>
              <p className="text-xs text-mv-ink-soft">
                Votre propre plateforme web moderne et responsive, connectée sans friction à votre imprimante ticket.
              </p>
              <span className="font-mono font-extrabold text-xs text-mv-blue block">2 800 $ CAD</span>
            </div>

            <div className="bg-mv-surface p-5 rounded-2xl border border-mv-border space-y-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-mv-ink">Google & Meta Ads 5 km</h3>
              <p className="text-xs text-mv-ink-soft">
                Publicités locales ciblées pour capter les clients de votre secteur et booster vos réservations.
              </p>
              <span className="font-mono font-extrabold text-xs text-amber-600 block">1 200 $ CAD / mo</span>
            </div>
          </div>
        </div>

        {/* ── Booking & Activation Section ── */}
        <Card id="reserver" className="p-6 sm:p-8 space-y-6 bg-mv-surface border-mv-green/40 shadow-mv-lg">
          <div className="text-center space-y-1.5 max-w-xl mx-auto">
            <Badge variant="green" className="mx-auto">Activation Immédiate</Badge>
            <h2 className="text-2xl font-extrabold text-mv-ink font-display">
              Prêt à récupérer vos marges ?
            </h2>
            <p className="text-xs text-mv-ink-soft">
              Remplissez ce formulaire pour planifier votre test opérationnel de 5 minutes avec l'équipe Minerva.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-extrabold text-base text-emerald-950 font-display">Demande enregistrée avec succès !</h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Notre responsable de compte vous contactera sous 24 heures avec votre plan d'économies personnalisé et les accès à votre environnement test.
              </p>
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit} className="max-w-xl mx-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1">Nom & Prénom</label>
                <input
                  type="text"
                  required
                  placeholder="Jean Dupont"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-mv-ink mb-1">Téléphone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (514) 555-0199"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-mv-ink mb-1">Courriel</label>
                  <input
                    type="email"
                    required
                    placeholder="jean@monrestaurant.ca"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full justify-center py-3" disabled={submitting}>
                {submitting ? 'Envoi en cours…' : 'Valider ma demande & Réserver mon test 5 min'}
              </Button>

              <p className="text-[11px] text-mv-ink-faint text-center">
                🔒 Aucune carte requise. Test sans engagement sur votre imprimante de caisse actuelle.
              </p>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}
