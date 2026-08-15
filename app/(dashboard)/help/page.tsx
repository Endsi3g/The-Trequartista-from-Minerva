'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Mail, BookOpen, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollFade } from '@/components/ui/scroll-fade';

// Written by the Minerva team about the app's real features -- expand this
// list as new sections ship; nothing here is invented product copy for a
// generic template.
const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'Comment inviter un nouveau membre dans l’équipe ?',
    a: 'Va dans Équipe → Inviter un membre (admin uniquement). Un lien valide 14 jours est généré et copié dans le presse-papier ; la personne qui l’utilise obtient automatiquement le rôle choisi.',
  },
  {
    q: 'Comment importer des SOPs depuis Notion ?',
    a: 'Depuis Intégrations → Gérer la synchro Notion, connecte ton token d’intégration Notion, sélectionne les pages, puis clique « Importer dans l’Académie » (admin uniquement). Chaque page devient une fiche SOP.',
  },
  {
    q: 'Comment changer mon rôle ou mon département ?',
    a: 'Ton rôle (admin/membre) est géré par un admin depuis Équipe. Ton département et le reste de ton profil se modifient dans Profil → Informations & Rôle.',
  },
  {
    q: 'Comment fonctionne le suivi ROI d’un client ?',
    a: 'Chaque client a une fiche Suivi ROI (Clients → cliquer un client → Suivi ROI) qui agrège les dépenses publicitaires, les leads générés et le pipeline pour calculer un multiplicateur de ROI réel.',
  },
  {
    q: 'Comment publier une entrée dans le changelog ?',
    a: 'Depuis Nouveautés → Publier une entrée (admin uniquement). Une bannière apparaît automatiquement en haut de l’application pour la dernière entrée publiée, avec un lien vers la page complète.',
  },
  {
    q: 'Où gérer mes préférences de notifications ?',
    a: 'Dans Profil → Alertes, tu peux activer/désactiver les notifications push, les rappels de tâches en retard et les annonces de nouveautés.',
  },
];

function FaqItem({ faq }: { faq: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-mv-border last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left cursor-pointer"
      >
        <span className="font-bold text-sm text-mv-ink">{faq.q}</span>
        <ChevronDown className={cn('w-4 h-4 text-mv-ink-faint shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <p className="text-sm text-mv-ink-soft pb-4 -mt-1 leading-relaxed">{faq.a}</p>}
    </div>
  );
}

export default function HelpPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return FAQS;
    const q = query.toLowerCase();
    return FAQS.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-mv-ink tracking-tight font-display">Comment pouvons-nous aider ?</h1>
        <p className="text-sm text-mv-ink-soft">Trouve des réponses aux questions courantes sur Minerva Trequartista.</p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-mv-ink-faint absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une réponse…"
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-mv-surface border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green shadow-mv-sm"
        />
      </div>

      <div className="bg-mv-surface border border-mv-border rounded-xl">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-sm text-mv-ink-faint">Aucun résultat pour « {query} ».</p>
        ) : (
          <ScrollFade maxHeight="420px" className="px-5">
            {filtered.map((faq) => <FaqItem key={faq.q} faq={faq} />)}
          </ScrollFade>
        )}
      </div>

      <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-6 text-center space-y-4">
        <div>
          <h2 className="font-extrabold text-mv-ink">Besoin d&apos;aide supplémentaire ?</h2>
          <p className="text-xs text-mv-ink-soft mt-0.5">L&apos;Académie et l&apos;équipe interne sont là pour toi.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <Link
            href="/academy"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-mv-surface border border-mv-border text-sm font-bold text-mv-ink hover:border-mv-green/40 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-mv-green" /> Consulter l&apos;Académie
          </Link>
          <Link
            href="/changelog"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-mv-surface border border-mv-border text-sm font-bold text-mv-ink hover:border-mv-green/40 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-mv-green" /> Voir les nouveautés
          </Link>
          <a
            href="mailto:support@minerva-agence.com"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-mv-surface border border-mv-border text-sm font-bold text-mv-ink hover:border-mv-green/40 transition-colors"
          >
            <Mail className="w-4 h-4 text-mv-green" /> Écrire à l&apos;équipe
          </a>
        </div>
      </div>
    </div>
  );
}
