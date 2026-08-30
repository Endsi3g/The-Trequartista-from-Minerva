'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Star,
  Video,
  Send,
  Sparkles,
  Zap,
  CheckCircle2,
  Copy,
  Download,
  Play,
  Pause,
  RotateCcw,
  Clock,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Building2,
  Phone,
  Mail,
  MessageSquare,
  DollarSign,
  Layers,
  HelpCircle,
  ChevronRight,
  Globe,
  SlidersHorizontal,
  Bot,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

type NicheKey = 'roofing' | 'hvac_plumbing' | 'dentist' | 'auto_repair' | 'restaurant';
type LanguageKey = 'fr' | 'en';
type ChannelKey = 'email' | 'dm' | 'contact_form';

interface NichePreset {
  key: NicheKey;
  label: string;
  defaultProspectName: string;
  defaultCompanyName: string;
  defaultCity: string;
  defaultCompetitor: string;
  defaultStars: number;
  defaultReviews: number;
  defaultCompetitorReviews: number;
  avgJobValue: number;
}

const NICHE_PRESETS: Record<NicheKey, NichePreset> = {
  roofing: {
    key: 'roofing',
    label: '🏠 Toiture & Rénovation',
    defaultProspectName: 'Marc-André',
    defaultCompanyName: 'Toitures Sommet Inc.',
    defaultCity: 'Montréal / Rive-Sud',
    defaultCompetitor: 'Couvreurs Expert Nord',
    defaultStars: 4.8,
    defaultReviews: 28,
    defaultCompetitorReviews: 215,
    avgJobValue: 11500,
  },
  hvac_plumbing: {
    key: 'hvac_plumbing',
    label: '🔧 Plomberie & Chauffage (HVAC)',
    defaultProspectName: 'Stéphane',
    defaultCompanyName: 'Plomberie & Climatisation Express',
    defaultCity: 'Québec / Lévis',
    defaultCompetitor: 'Groupe HVAC Provincial',
    defaultStars: 4.9,
    defaultReviews: 35,
    defaultCompetitorReviews: 180,
    avgJobValue: 3800,
  },
  dentist: {
    key: 'dentist',
    label: '🦷 Clinique Dentaire & Santé',
    defaultProspectName: 'Dr. Caroline',
    defaultCompanyName: 'Centre Dentaire Quartier',
    defaultCity: 'Laval',
    defaultCompetitor: 'Clinique Dentaire Métro',
    defaultStars: 4.9,
    defaultReviews: 42,
    defaultCompetitorReviews: 310,
    avgJobValue: 1200,
  },
  auto_repair: {
    key: 'auto_repair',
    label: '🚗 Garage & Mécanique Auto',
    defaultProspectName: 'Alexandre',
    defaultCompanyName: 'Garage Mécanique Performance',
    defaultCity: 'Gatineau',
    defaultCompetitor: 'Auto Pro Régional',
    defaultStars: 4.7,
    defaultReviews: 31,
    defaultCompetitorReviews: 195,
    avgJobValue: 850,
  },
  restaurant: {
    key: 'restaurant',
    label: '🍽 Restaurant & Traiteur',
    defaultProspectName: 'Jean-Luc',
    defaultCompanyName: 'Bistro & Grill Terroir',
    defaultCity: 'Sherbrooke',
    defaultCompetitor: 'Brasserie Urbaine',
    defaultStars: 4.6,
    defaultReviews: 48,
    defaultCompetitorReviews: 420,
    avgJobValue: 65,
  },
};

export default function ReviewEnginePage() {
  const { toastSuccess, toastInfo } = useToast();

  // Niche & Inputs State
  const [niche, setNiche] = useState<NicheKey>('roofing');
  const [lang, setLang] = useState<LanguageKey>('fr');
  const [channel, setChannel] = useState<ChannelKey>('email');

  const preset = NICHE_PRESETS[niche];

  const [prospectName, setProspectName] = useState(preset.defaultProspectName);
  const [companyName, setCompanyName] = useState(preset.defaultCompanyName);
  const [city, setCity] = useState(preset.defaultCity);
  const [competitorName, setCompetitorName] = useState(preset.defaultCompetitor);
  const [stars, setStars] = useState(preset.defaultStars);
  const [reviews, setReviews] = useState(preset.defaultReviews);
  const [competitorReviews, setCompetitorReviews] = useState(preset.defaultCompetitorReviews);
  const [activeTab, setActiveTab] = useState<'audit_studio' | 'outreach_scripts' | 'ghl_workflows' | 'objection_busters'>('audit_studio');

  // Video Studio Teleprompter State (120s)
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(1);
  const teleprompterRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync inputs on niche change
  const handleNicheChange = (newNiche: NicheKey) => {
    setNiche(newNiche);
    const p = NICHE_PRESETS[newNiche];
    setProspectName(p.defaultProspectName);
    setCompanyName(p.defaultCompanyName);
    setCity(p.defaultCity);
    setCompetitorName(p.defaultCompetitor);
    setStars(p.defaultStars);
    setReviews(p.defaultReviews);
    setCompetitorReviews(p.defaultCompetitorReviews);
    toastInfo('Niche modifiée', `Préréglages chargés pour ${p.label}.`);
  };

  // Timer logic for 120s video audit
  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });

        // Smooth teleprompter auto-scroll
        if (teleprompterRef.current) {
          teleprompterRef.current.scrollTop += teleprompterSpeed * 1.5;
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTimerRunning, teleprompterSpeed]);

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(120);
    if (teleprompterRef.current) {
      teleprompterRef.current.scrollTop = 0;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toastSuccess('Copié !', `${label} a été copié dans votre presse-papiers.`);
  };

  // Derived Calculations
  const reviewGap = Math.max(0, competitorReviews - reviews);
  const estimatedLostCallsMonth = Math.round((reviewGap / 20) * 4);
  const annualLostRevenue = estimatedLostCallsMonth * preset.avgJobValue * 12;

  // Outreach Script Builder
  const getOutreachScript = () => {
    if (lang === 'fr') {
      if (channel === 'email') {
        return `Objet : Petite question sur ${companyName} (${city})

Bonjour ${prospectName},

Je regardais les entreprises de ${preset.label.split(' ')[1] || 'services'} à ${city} et ${companyName} a tout de suite attiré mon attention avec votre excellente note de ${stars} ⭐.

J'ai cependant remarqué un détail très précis sur votre fiche Google qui vous fait probablement perdre des appels chaque semaine au profit de ${competitorName} (qui compte ${competitorReviews} avis contre ${reviews} pour vous). C'est quelque chose de très facile et rapide à corriger.

J'ai enregistré une courte vidéo de 2 minutes pour vous montrer exactement ce que je veux dire — c'est 100% gratuit, aucun engagement.

Est-ce que c'est bon si je vous envoie le lien ici ?

Bien à vous,
L'équipe Minerva`;
      } else if (channel === 'dm') {
        return `Salut ${prospectName} ! Je regardais les pros à ${city} et ${companyName} ressort vraiment avec vos ${stars} étoiles. J'ai remarqué 1 détail sur votre fiche Google qui vous coûte des clients vs ${competitorName} (${competitorReviews} avis vs vos ${reviews}). J'ai filmé une vidéo rapide de 2 min pour vous montrer l'astuce gratuite. Ça vous va si je vous partage le lien ?`;
      } else {
        return `Bonjour ${prospectName}, j'ai analysé votre fiche Google à ${city} (${stars} étoiles, bravo). J'ai noté 1 point technique simple qui vous fait perdre des demandes au profit de ${competitorName}. J'ai préparé un rapide audit vidéo de 2 min sans frais. Puis-je vous le faire parvenir par courriel ?`;
      }
    } else {
      // English (Original Blueprint)
      if (channel === 'email') {
        return `Subject: Quick question about ${companyName}

Hey ${prospectName},

I was looking at ${preset.label.split(' ')[1] || 'local'} services in ${city} and ${companyName} kept catching my eye with your solid ${stars}-star rating.

I noticed one specific thing on your Google listing that I think is costing you calls each week compared to competitors like ${competitorName} (${competitorReviews} reviews vs your ${reviews}). It's actually a pretty easy fix.

I recorded a quick 2-minute video walking through what I mean — no charge, nothing to sign up for.

Is it all right to send it over?

Best,
The Minerva Growth Team`;
      } else if (channel === 'dm') {
        return `Hey ${prospectName}! Loved seeing ${companyName}'s ${stars}-star reviews in ${city}. Noticed 1 quick fix on your Google Maps listing that's letting ${competitorName} get calls ahead of you. Recorded a 2-min walkthrough video for you (100% free). Cool if I send it over?`;
      } else {
        return `Hey ${prospectName}, noticed one thing on ${companyName}'s Google listing costing you calls in ${city}. Recorded a quick 2-min breakdown walking through the fix (no charge). Is it okay to send over?`;
      }
    }
  };

  // 2-Minute Video Teleprompter Script
  const getVideoAuditScript = () => {
    if (lang === 'fr') {
      return `[00:00 - 00:25] ✦ ACCROCHE & COMPLIMENT SINCÈRE
« Bonjour ${prospectName} ! Merci d'avoir accepté que je vous envoie cette courte vidéo. Ici [Votre Nom] de chez Minerva. Comme vous pouvez le voir sur mon écran, je suis sur votre fiche Google de ${companyName}. Première chose : votre travail est remarquable, vous avez une note de ${stars} étoiles, ce qui prouve que vos clients sont très satisfaits. »

[00:25 - 00:55] ✦ DÉMONSTRATION DU GAP GOOGLE MAPS
« Mais voici le problème que j'ai remarqué : quand un client cherche un professionnel à ${city}, Google met en avant les entreprises avec le plus grand volume de preuves sociales. Vous avez actuellement ${reviews} avis, alors que ${competitorName} en a ${competitorReviews}. Même si votre service est supérieur, beaucoup de clients appellent le concurrent par simple réflexe du nombre d'avis. »

[00:55 - 01:30] ✦ LA FRICTION CLIENT & L'AUTOMATISATION
« La raison n'est pas que vos clients ne vous aiment pas, c'est simplement que 90% des gens oublient de laisser un avis s'ils ne reçoivent pas une demande au bon moment sur leur téléphone. Tout ce qui vous manque, c'est un système automatisé qui envoie un SMS de remerciement et un lien direct 5 étoiles 2 heures après chaque travail terminé. »

[01:30 - 02:00] ✦ APPEL À L'ACTION SANS FRICTION
« Si vous voulez que je vous montre comment mettre en place ce système automatisé pour que votre équipe récolte 15 à 30 nouveaux avis 5 étoiles chaque mois en pilote automatique, répondez simplement à ce message. Aucune pression. Passez une excellente journée ! »`;
    } else {
      return `[00:00 - 00:25] ✦ THE HOOK & GENUINE COMPLIMENT
"Hey ${prospectName}! Thanks for letting me send this over. My name is [Your Name] from Minerva. As you can see on my screen, I have your Google listing for ${companyName} pulled up right here. First off, congratulations on maintaining a ${stars}-star rating — that proves you do great work."

[00:25 - 00:55] ✦ SHOWCASING THE REVIEW GAP
"Here is the issue: when homeowners in ${city} search on Google Maps, Google favors listings with higher review volume. Right now, you're sitting at ${reviews} reviews, while ${competitorName} is at ${competitorReviews}. Even though your rating is higher, they are picking up 10 to 20 calls a month simply because of that number."

[00:55 - 01:30] ✦ THE FRICTION & THE AUTOMATED ENGINE
"The reason isn't bad service — it's just that happy customers get busy and forget unless they're prompted immediately. What you need is an automated Review Engine that sends a friendly text and direct 5-star link right when a job wraps up."

[01:30 - 02:00] ✦ NO-PITCH CALL TO ACTION
"If you'd like a hand getting this automated system live so you start stacking 15-30 reviews every month on autopilot, just reply to this email and let me know. Happy to walk you through it. Have a great day!"`;
    }
  };

  // GoHighLevel Workflow Blueprint JSON
  const ghlWorkflowJson = JSON.stringify(
    {
      name: `Minerva Review Engine — ${niche.toUpperCase()} Retainer ($297/mo)`,
      version: '2.0',
      trigger: {
        type: 'Opportunity Stage Updated / Job Completed',
        condition: 'stage == "Job Done / Invoiced"',
      },
      actions: [
        {
          step: 1,
          type: 'Wait',
          duration: '2 hours',
          description: 'Laisser le temps au client de savourer le service',
        },
        {
          step: 2,
          type: 'SMS',
          template: `Bonjour {{contact.first_name}}, c'est l'équipe de ${companyName}. Nous espérons que vous êtes 100% satisfait des travaux ! Avez-vous 30 secondes pour nous laisser un avis Google rapide ? Voici le lien direct 5★ : {{location.google_review_link}} Merci pour votre confiance !`,
        },
        {
          step: 3,
          type: 'Wait',
          duration: '48 hours',
          condition: 'If review not submitted',
        },
        {
          step: 4,
          type: 'SMS Reminder',
          template: `Salut {{contact.first_name}}, petit rappel amical de ${companyName} ! Votre avis nous aide énormément en tant qu'entreprise locale : {{location.google_review_link}} Excellente semaine à vous !`,
        },
        {
          step: 5,
          type: 'AI Review Auto-Responder (Claude/GPT-4)',
          prompt: `Tu es le gérant de ${companyName}. Réponds de façon chaleureuse, personnalisée et professionnelle à chaque nouvel avis Google reçu en remerciant le client par son prénom.`,
        },
      ],
    },
    null,
    2
  );

  return (
    <div className="space-y-4 pb-12">
      
      {/* ── Top Header & Breadcrumb ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="text-xs text-zinc-400 font-mono" style={MONO}>
            Minerva / Croissance / Review Engine &amp; Retainers ($297/mo)
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-base font-semibold text-zinc-900 tracking-tight font-display">
              Review Engine &amp; Vidéo Audit 2-Min
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200" style={MONO}>
              Blueprint Adam Erhart ($297/mo)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200/60 h-7 text-xs font-mono" style={MONO}>
            <button
              type="button"
              onClick={() => setLang('fr')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer',
                lang === 'fr' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500 hover:text-zinc-800'
              )}
            >
              🇫🇷 QC / FR
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer',
                lang === 'en' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500 hover:text-zinc-800'
              )}
            >
              🇺🇸 EN (US)
            </button>
          </div>

          <Link href="/acquisition">
            <button
              type="button"
              className="h-7 px-2.5 text-xs font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-md flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour Funnel</span>
            </button>
          </Link>
        </div>
      </div>

      {/* ── 4-KPIs Retainer Economics Ribbon ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-x divide-y lg:divide-y-0 divide-zinc-100 shadow-xs overflow-hidden">
        <div className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Tarif Retainer Recommandé
          </div>
          <div className="text-xl font-bold text-zinc-900 font-mono tracking-tight" style={MONO}>
            297 $ / mois
          </div>
          <div className="text-[11px] text-zinc-400">397 $ CAD / mois récurrent</div>
        </div>

        <div className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
            Valeur Annuelle / Client
          </div>
          <div className="text-xl font-bold text-emerald-700 font-mono tracking-tight" style={MONO}>
            3 564 $ / an
          </div>
          <div className="text-[11px] text-zinc-400">Pour ~30 min d&apos;entretien mensuel</div>
        </div>

        <div className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
            Taux d&apos;Acceptation Permission
          </div>
          <div className="text-xl font-bold text-blue-700 font-mono tracking-tight" style={MONO}>
            35% - 48%
          </div>
          <div className="text-[11px] text-zinc-400">Sans pitching agressif préalable</div>
        </div>

        <div className="p-3 space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-600">
            Impact Moyen Google Maps
          </div>
          <div className="text-xl font-bold text-purple-700 font-mono tracking-tight" style={MONO}>
            +18 avis / mois
          </div>
          <div className="text-[11px] text-zinc-400">Top 3 pack local garanti</div>
        </div>
      </div>

      {/* ── Niche Selector & Google Maps Gap Scanner ── */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-zinc-900">Niche Cible &amp; Simulateur de « Review Deficit »</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {Object.values(NICHE_PRESETS).map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handleNicheChange(p.key)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer',
                  niche === p.key
                    ? 'bg-zinc-900 text-white font-bold shadow-xs'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Parameter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-400">Dirigeant / Contact</label>
            <input
              type="text"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              className="w-full mt-1 h-7 px-2 border border-zinc-200 rounded bg-white text-zinc-900 font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-400">Entreprise Cible</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full mt-1 h-7 px-2 border border-zinc-200 rounded bg-white text-zinc-900 font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-400">Ville / Région</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full mt-1 h-7 px-2 border border-zinc-200 rounded bg-white text-zinc-900 font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-400">Concurrent Leader</label>
            <input
              type="text"
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              className="w-full mt-1 h-7 px-2 border border-zinc-200 rounded bg-white text-zinc-900 font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-400">Avis Prospect ({stars}⭐)</label>
            <input
              type="number"
              value={reviews}
              onChange={(e) => setReviews(Number(e.target.value))}
              className="w-full mt-1 h-7 px-2 border border-zinc-200 rounded bg-white text-zinc-900 font-mono font-bold focus:outline-none focus:border-emerald-600"
              style={MONO}
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-400">Avis Concurrent</label>
            <input
              type="number"
              value={competitorReviews}
              onChange={(e) => setCompetitorReviews(Number(e.target.value))}
              className="w-full mt-1 h-7 px-2 border border-zinc-200 rounded bg-white text-zinc-900 font-mono font-bold focus:outline-none focus:border-emerald-600"
              style={MONO}
            />
          </div>
        </div>

        {/* Live Gap Output Summary Banner */}
        <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-emerald-950">
              Écart Détecté : <strong className="font-mono text-emerald-800" style={MONO}>-{reviewGap} avis</strong> par rapport au leader local.
            </span>
            <span className="text-zinc-500 hidden md:inline">• Perte estimée : ~{estimatedLostCallsMonth} appels / mois</span>
          </div>

          <div className="text-[11px] font-mono text-emerald-800 font-bold" style={MONO}>
            Manque à gagner estimé : ~{annualLostRevenue.toLocaleString('fr-CA')} $/an
          </div>
        </div>
      </div>

      {/* ── Main Navigation Tabs ── */}
      <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/60 h-8 text-xs font-mono" style={MONO}>
        <button
          type="button"
          onClick={() => setActiveTab('audit_studio')}
          className={cn(
            'flex-1 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5',
            activeTab === 'audit_studio' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500 hover:text-zinc-800'
          )}
        >
          <Video className="w-3.5 h-3.5 text-rose-600" />
          <span>1. Studio Vidéo 2-Min (Téléprompteur)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('outreach_scripts')}
          className={cn(
            'flex-1 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5',
            activeTab === 'outreach_scripts' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500 hover:text-zinc-800'
          )}
        >
          <Send className="w-3.5 h-3.5 text-blue-600" />
          <span>2. Scripts Permission-First</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ghl_workflows')}
          className={cn(
            'flex-1 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5',
            activeTab === 'ghl_workflows' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500 hover:text-zinc-800'
          )}
        >
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <span>3. Blueprint GoHighLevel (Automatisations)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('objection_busters')}
          className={cn(
            'flex-1 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5',
            activeTab === 'objection_busters' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500 hover:text-zinc-800'
          )}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>4. Traitement des Objections ($297/mo)</span>
        </button>
      </div>

      {/* ── TAB 1 : STUDIO VIDÉO AUDIT 2-MINUTES (TÉLÉPROMPTEUR) ── */}
      {activeTab === 'audit_studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* Left Column: Interactive Teleprompter */}
          <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-zinc-900">Structure &amp; Téléprompteur Vidéo 120 Secondes</span>
              </div>

              {/* Timer Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-zinc-900 text-white font-mono text-xs font-bold" style={MONO}>
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:
                    {String(timerSeconds % 60).padStart(2, '0')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={cn(
                    'h-7 px-2.5 text-xs font-bold rounded flex items-center gap-1 transition-colors cursor-pointer',
                    isTimerRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  )}
                >
                  {isTimerRunning ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                  <span>{isTimerRunning ? 'Pause' : 'Démarrer'}</span>
                </button>

                <button
                  type="button"
                  onClick={resetTimer}
                  className="h-7 w-7 flex items-center justify-center rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
                  title="Réinitialiser le chrono"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Teleprompter Box */}
            <div
              ref={teleprompterRef}
              className="bg-zinc-50 rounded-lg border border-zinc-200/80 p-4 h-[320px] overflow-y-auto space-y-4 text-xs leading-relaxed font-sans text-zinc-800"
            >
              <pre className="whitespace-pre-wrap font-sans text-xs text-zinc-800 leading-relaxed">
                {getVideoAuditScript()}
              </pre>
            </div>

            {/* Copy CTA */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
                Enregistrez votre écran avec Loom, Tana ou OBS en montrant la fiche Google Maps.
              </span>

              <Button
                onClick={() => copyToClipboard(getVideoAuditScript(), 'Script du téléprompteur')}
                variant="secondary"
                className="h-7 text-xs gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copier le script complet
              </Button>
            </div>
          </div>

          {/* Right Column: 4-Step Video Checklist */}
          <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-3">
            <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              Les 4 Étapes Clés (120s Chrono)
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 space-y-1">
                <div className="flex items-center justify-between font-bold text-zinc-900">
                  <span>1. Accroche &amp; Compliment</span>
                  <span className="font-mono text-[10px] text-zinc-400" style={MONO}>00:00 - 00:25</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Valider immédiatement leur savoir-faire ({stars}⭐) pour briser la méfiance commerciale.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 space-y-1">
                <div className="flex items-center justify-between font-bold text-zinc-900">
                  <span>2. Le Review Gap vs Leader</span>
                  <span className="font-mono text-[10px] text-zinc-400" style={MONO}>00:25 - 00:55</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Montrer côte à côte leur fiche ({reviews} avis) vs {competitorName} ({competitorReviews} avis).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 space-y-1">
                <div className="flex items-center justify-between font-bold text-zinc-900">
                  <span>3. La Friction Client</span>
                  <span className="font-mono text-[10px] text-zinc-400" style={MONO}>00:55 - 01:30</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Expliquer que les clients satisfaits oublient sans SMS automatique 2h après le service.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-emerald-900">
                  <span>4. CTA Sans Pression</span>
                  <span className="font-mono text-[10px] text-emerald-700" style={MONO}>01:30 - 02:00</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  « Répondez simplement si vous voulez que je vous montre comment l&apos;installer ». Zéro pitch forcé.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2 : SCRIPTS OUTREACH PERMISSION-FIRST ── */}
      {activeTab === 'outreach_scripts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* Left Column: Script Preview & Channels */}
          <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-zinc-900">Message d&apos;Autorisation Préalable (Demander la Permission)</span>
              </div>

              {/* Channel Selector */}
              <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200/60 h-7 text-xs font-mono" style={MONO}>
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10.5px] font-medium transition-all cursor-pointer',
                    channel === 'email' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500 hover:text-zinc-800'
                  )}
                >
                  ✉️ Email
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('dm')}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10.5px] font-medium transition-all cursor-pointer',
                    channel === 'dm' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500 hover:text-zinc-800'
                  )}
                >
                  💬 DM Instagram / FB
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('contact_form')}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10.5px] font-medium transition-all cursor-pointer',
                    channel === 'contact_form' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-500 hover:text-zinc-800'
                  )}
                >
                  📝 Formulaire Site
                </button>
              </div>
            </div>

            {/* Script Box */}
            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 leading-relaxed font-sans relative group">
              <pre className="whitespace-pre-wrap font-sans text-xs text-zinc-800 leading-relaxed">
                {getOutreachScript()}
              </pre>
            </div>

            {/* Copy CTA */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-zinc-400">
                🔒 Règle d&apos;or : Ne jamais envoyer le lien de la vidéo au 1er message. Attendre le « Oui ».
              </span>

              <Button
                onClick={() => copyToClipboard(getOutreachScript(), 'Message d’outreach')}
                variant="primary"
                className="h-7 text-xs font-bold gap-1.5 shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" /> Copier le message d&apos;accroche
              </Button>
            </div>
          </div>

          {/* Right Column: Follow-up if No Reply */}
          <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-3">
            <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              Relance à J+3 (Si pas de réponse)
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs space-y-2">
              <span className="font-semibold text-zinc-900">Objet : Évolution avis à {city}</span>
              <p className="text-[11.5px] text-zinc-600 leading-relaxed">
                {lang === 'fr'
                  ? `« Salut ${prospectName}, je viens de voir que ${competitorName} vient de franchir un nouveau palier d'avis sur Google. Je garde la vidéo de 2 min sous le coude si vous voulez toujours jeter un œil rapide ! »`
                  : `"Hey ${prospectName}, just saw ${competitorName} crossed another review milestone on Maps. Still have that 2-min breakdown saved if you'd like me to send it over!"`}
              </p>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    lang === 'fr'
                      ? `Salut ${prospectName}, je viens de voir que ${competitorName} vient de franchir un nouveau palier d'avis sur Google. Je garde la vidéo de 2 min sous le coude si vous voulez toujours jeter un œil rapide !`
                      : `Hey ${prospectName}, just saw ${competitorName} crossed another review milestone on Maps. Still have that 2-min breakdown saved if you'd like me to send it over!`,
                    'Message de relance'
                  )
                }
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 pt-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> Copier la relance J+3
              </button>
            </div>

            {/* When they say YES */}
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
              <span className="font-bold text-emerald-950">Quand ils répondent « Oui » :</span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                {lang === 'fr'
                  ? `« Super ${prospectName}, voici le lien vidéo Loom : [LIEN]. Dites-moi ce que vous en pensez ! »`
                  : `"Awesome ${prospectName}, here is the 2-min Loom link: [LINK]. Let me know what you think!"`}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 3 : BLUEPRINTS GOHIGHLEVEL WORKFLOWS ── */}
      {activeTab === 'ghl_workflows' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* Left Column: 4-Step Sequence Visualizer */}
          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-zinc-900">Séquence Automatisée GoHighLevel (Review Engine)</span>
              </div>
              <Badge variant="green">Retainer 297 $/mo</Badge>
            </div>

            <div className="space-y-2 text-xs">
              {/* Step 1 */}
              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-zinc-200 text-zinc-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900">Déclencheur : Facture Réglée / Chantier Terminé</span>
                    <span className="text-[10px] font-mono text-zinc-400" style={MONO}>Webhook / Tag</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Le statut client passe à « Job Done » dans GHL ou le CRM de facturation (Stripe, Quickbooks).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900">SMS Check-in &amp; Lien Direct Avis 5★ (J+0, +2h)</span>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold" style={MONO}>SMS Automatique</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-0.5 bg-white p-2 rounded border border-zinc-100">
                    « Bonjour [Prénom], c&apos;est {companyName}. Merci pour votre confiance ! Avez-vous 30 secondes pour nous laisser une note rapide sur Google ? [Lien Direct Google 5★] »
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900">Relance Douce par SMS (J+2 si non cliqué)</span>
                    <span className="text-[10px] font-mono text-blue-700 font-bold" style={MONO}>Condition If/Else</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-0.5 bg-white p-2 rounded border border-zinc-100">
                    « Salut [Prénom], petit rappel amical ! Votre retour compte énormément pour notre équipe locale : [Lien Avis] »
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-200 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  4
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950">Répondeur IA Automatique aux Avis Google</span>
                    <span className="text-[10px] font-mono text-purple-700 font-bold" style={MONO}>IA / Claude</span>
                  </div>
                  <p className="text-[11px] text-purple-900 mt-0.5">
                    Génère et publie instantanément une réponse personnalisée et chaleureuse pour booster le SEO local.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Workflow JSON & Import Tools */}
          <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
              <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-emerald-600" />
                <span>Schéma GoHighLevel (JSON Blueprint)</span>
              </span>

              <button
                type="button"
                onClick={() => copyToClipboard(ghlWorkflowJson, 'Schéma GoHighLevel')}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> Copier
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 text-zinc-300 font-mono text-[10.5px] max-h-[260px] overflow-y-auto" style={MONO}>
              <pre className="whitespace-pre-wrap">{ghlWorkflowJson}</pre>
            </div>

            <Button
              onClick={() => {
                const blob = new Blob([ghlWorkflowJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ghl_review_engine_${niche}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toastSuccess('Téléchargement lancé', 'Fichier blueprint GoHighLevel exporté.');
              }}
              variant="secondary"
              className="w-full h-8 text-xs font-bold gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Télécharger le Blueprint GHL (.json)
            </Button>
          </div>

        </div>
      )}

      {/* ── TAB 4 : TRAITEMENT DES OBJECTIONS & PITCH $297/MO ── */}
      {activeTab === 'objection_busters' && (
        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-zinc-900">Scripts Anti-Objections pour Valider le Retainer 297 $/mois</span>
            </div>
            <span className="text-xs font-mono text-zinc-400" style={MONO}>3 Scénarios Majeurs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Objection 1 */}
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  Objection 1
                </span>
                <h2 className="font-bold text-zinc-900 text-xs mt-1.5">« Je vais le faire moi-même »</h2>
                <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">
                  {lang === 'fr'
                    ? `« Vous avez 100% raison, vous pourriez le faire manuellement. Mais la réalité, c'est que quand vous avez 5 chantiers en cours, demander des avis par SMS passe au second plan. Notre système garantit que c'est fait après chaque client, pour toujours, sans que vous n'ayez à y penser. »`
                    : `"You 100% could do it manually. But in reality, when you're running 5 jobs a week, asking for reviews slips through the cracks. This software guarantees it happens for every single job moving forward without adding to your workload."`}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    lang === 'fr'
                      ? `Vous avez 100% raison, vous pourriez le faire manuellement. Mais la réalité, c'est que quand vous avez 5 chantiers en cours, demander des avis par SMS passe au second plan. Notre système garantit que c'est fait après chaque client, pour toujours, sans que vous n'ayez à y penser.`
                      : `You 100% could do it manually. But in reality, when you're running 5 jobs a week, asking for reviews slips through the cracks. This software guarantees it happens for every single job moving forward without adding to your workload.`,
                    'Script Objection 1'
                  )
                }
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 pt-2 border-t border-zinc-200 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> Copier la réponse
              </button>
            </div>

            {/* Objection 2 */}
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-200">
                  Objection 2
                </span>
                <h2 className="font-bold text-zinc-900 text-xs mt-1.5">« 297 $/mois c&apos;est trop cher »</h2>
                <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">
                  {lang === 'fr'
                    ? `« Combien vous rapporte un seul contrat moyen ? ~${preset.avgJobValue.toLocaleString('fr-CA')} $. Si ce système vous apporte ne serait-ce qu'UN seul client de plus dans toute l'année en vous hissant dans le top 3 Google, il est rentabilisé plus de 3 fois. »`
                    : `"How much is an average job worth to you? Around $${preset.avgJobValue.toLocaleString('en-US')}. If this system brings you even ONE extra job all year by ranking you in the top 3 on Google, it pays for itself 3x over."`}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    lang === 'fr'
                      ? `Combien vous rapporte un seul contrat moyen ? ~${preset.avgJobValue.toLocaleString('fr-CA')} $. Si ce système vous apporte ne serait-ce qu'UN seul client de plus dans toute l'année en vous hissant dans le top 3 Google, il est rentabilisé plus de 3 fois.`
                      : `How much is an average job worth to you? Around $${preset.avgJobValue.toLocaleString('en-US')}. If this system brings you even ONE extra job all year by ranking you in the top 3 on Google, it pays for itself 3x over.`,
                    'Script Objection 2'
                  )
                }
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 pt-2 border-t border-zinc-200 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> Copier la réponse
              </button>
            </div>

            {/* Objection 3 */}
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                  Objection 3
                </span>
                <h2 className="font-bold text-zinc-900 text-xs mt-1.5">« Je n&apos;ai pas de liste client »</h2>
                <p className="text-[11px] text-zinc-600 mt-2 leading-relaxed">
                  {lang === 'fr'
                    ? `« C'est parfait ! Vous n'avez pas besoin d'une liste existante. Le système capture automatiquement chaque nouveau client au fur et à mesure de vos interventions et déclenche les avis en continu. »`
                    : `"That's totally fine! You don't need an existing list. Every new customer you service moving forward gets plugged into the engine automatically, building your reviews steadily week after week."`}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    lang === 'fr'
                      ? `C'est parfait ! Vous n'avez pas besoin d'une liste existante. Le système capture automatiquement chaque nouveau client au fur et à mesure de vos interventions et déclenche les avis en continu.`
                      : `That's totally fine! You don't need an existing list. Every new customer you service moving forward gets plugged into the engine automatically, building your reviews steadily week after week.`,
                    'Script Objection 3'
                  )
                }
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 pt-2 border-t border-zinc-200 cursor-pointer"
              >
                <Copy className="w-3 h-3" /> Copier la réponse
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
