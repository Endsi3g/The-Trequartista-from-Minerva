'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Film,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  UtensilsCrossed,
  Target,
  Building2,
  Play,
  Share2,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

interface CaseStudyScriptStudioProps {
  defaultClientName?: string;
  defaultPillar?: 'flow' | 'reach' | 'agency';
}

export function CaseStudyScriptStudio({
  defaultClientName = 'Café Rosemont',
  defaultPillar = 'flow',
}: CaseStudyScriptStudioProps) {
  const router = useRouter();
  const { toastSuccess } = useToast();

  const [clientName, setClientName] = useState(defaultClientName);
  const [sector, setSector] = useState('Café & Restauration (Montréal)');
  const [painPoint, setPainPoint] = useState('1 400 $/mois de commissions Uber Eats perdues');
  const [resultAchieved, setResultAchieved] = useState('+2 800 $/mois récupérés en commande directe 0%');
  const [pillar, setPillar] = useState<'flow' | 'reach' | 'agency'>(defaultPillar);
  const [copied, setCopied] = useState(false);

  const scriptHook = `« Ce ${sector.toLowerCase().split(' ')[0]} à Montréal perdait ${painPoint.split(' ')[0]} ${painPoint.split(' ')[1] || '$/mois'} sans même le savoir… Voici exactement comment on a réglé ça en 7 jours. »`;

  const scriptBody = `1. [0-5s] HOOK VISUEL : Plan sur le ticket de caisse ou le menu avec le texte du hook.
2. [5-20s] LE PROBLÈME RÉEL : « Quand un client commande leur [Plat Signature] sur les plateformes de livraison, 30% s'évapore direct. Sur 150 commandes par mois, ça fait ${painPoint}. »
3. [20-40s] LA DÉMO MINERVA : « Au lieu de leur vendre un long contrat, on a cloné leur menu en 5 minutes sur Minerva Flow. Zéro commission, impression directe en cuisine sur leur imprimante actuelle. »
4. [40-52s] LE RÉSULTAT : « Résultat après 30 jours : ${resultAchieved}. Sans changer leurs habitudes ni recruter de staff. »
5. [52-60s] CTA UNIQUE (${pillar.toUpperCase()}) : ${
    pillar === 'flow'
      ? '« Vous avez un resto ou café au Québec ? On calcule vos fuites de marge gratuitement en 60 secondes. Lien en bio. »'
      : pillar === 'reach'
      ? '« Besoin d’une liste de 50 prospects qualifiés dans votre secteur ? On vous la prépare avant même le premier appel. Lien en bio. »'
      : '« Vous voulez digitaliser vos opérations sans cahier des charges interminable ? Prototype fonctionnel livré en J+7. Lien en bio. »'
  }`;

  const fullScript = `🎬 SCRIPT VIDÉO CAS CLIENT (60-90s) — ${clientName}\n\n${scriptHook}\n\n${scriptBody}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullScript);
    setCopied(true);
    toastSuccess('Script copié !', 'Le script de vidéo cas client est prêt pour le tournage.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInPlanner = () => {
    router.push(`/content-planner/minerva/new?title=${encodeURIComponent(`Cas Client : ${clientName} (${pillar.toUpperCase()})`)}&type=video&format=reel&hook=${encodeURIComponent(scriptHook)}`);
  };

  return (
    <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-[8px] p-5 text-white shadow-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[5px] bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Studio de Scripting Vidéo Cas Client (60s)</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/30 font-semibold">
                Mes Inspirations
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Générez instantanément un script vidéo percutant basé sur une victoire client réelle.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="h-7 px-2.5 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-[4px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? 'Copié !' : 'Copier le script'}</span>
          </button>

          <button
            onClick={handleOpenInPlanner}
            className="h-7 px-3 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-[4px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Créer dans Content Planner</span>
          </button>
        </div>
      </div>

      {/* Generator Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="space-y-1">
          <label className="text-[10.5px] font-medium text-zinc-400">Nom du client / resto</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full h-8 px-2.5 text-xs bg-zinc-800/80 border border-zinc-700 rounded-[4px] text-white focus:outline-none focus:border-rose-500"
            placeholder="Ex: Café Rosemont"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10.5px] font-medium text-zinc-400">Secteur / Type</label>
          <input
            type="text"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full h-8 px-2.5 text-xs bg-zinc-800/80 border border-zinc-700 rounded-[4px] text-white focus:outline-none focus:border-rose-500"
            placeholder="Ex: Café & Restauration"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10.5px] font-medium text-zinc-400">Fuite / Douleur initiale</label>
          <input
            type="text"
            value={painPoint}
            onChange={(e) => setPainPoint(e.target.value)}
            className="w-full h-8 px-2.5 text-xs bg-zinc-800/80 border border-zinc-700 rounded-[4px] text-white focus:outline-none focus:border-rose-500"
            placeholder="Ex: 1 400$/mois perdus"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10.5px] font-medium text-zinc-400">Pilier CTA cible</label>
          <select
            value={pillar}
            onChange={(e) => setPillar(e.target.value as 'flow' | 'reach' | 'agency')}
            className="w-full h-8 px-2.5 text-xs bg-zinc-800/80 border border-zinc-700 rounded-[4px] text-white focus:outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="flow">🍕 Flow (SaaS Restos)</option>
            <option value="reach">🎯 Reach (Prospection QC)</option>
            <option value="agency">⚡ Agence Sur Mesure</option>
          </select>
        </div>
      </div>

      {/* Generated Script Display */}
      <div className="space-y-2 pt-1">
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-[6px] p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <span className="text-amber-300 font-bold">⚡ HOOK CHIFFRÉ (0-5s)</span>
            <span>~60 secondes</span>
          </div>
          <p className="text-xs font-semibold text-white leading-snug pl-2.5 border-l-2 border-amber-400">
            {scriptHook}
          </p>
        </div>

        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-[6px] p-3.5 space-y-1.5">
          <div className="text-[11px] text-zinc-400 font-mono text-emerald-400 font-bold">
            📜 STRUCTURE DE LA VIDÉO
          </div>
          <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {scriptBody}
          </pre>
        </div>
      </div>
    </div>
  );
}
