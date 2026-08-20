'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Mail, MessageSquare, Phone, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageFadeIn } from '@/components/ui/page-transition';

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'Comment inviter un nouveau membre dans l’équipe ?',
    a: 'Rendez-vous dans Équipe → Inviter un membre (réservé aux admins). Un lien sécurisé valide 14 jours est généré pour attribuer les permissions choisies.',
  },
  {
    q: 'Comment importer des SOPs et documents depuis Notion ?',
    a: 'Depuis Intégrations → Gérer la synchro Notion, associez votre token Notion et sélectionnez les bases ou pages à convertir en fiches de l’Académie.',
  },
  {
    q: 'Comment modifier mon profil, ma bio et mes liens sociaux ?',
    a: 'Accédez à Mon Profil depuis la barre latérale pour modifier votre photo, poste, biographie, localisation et liens (Twitter, LinkedIn, GitHub, site web) avec prévisualisation en direct.',
  },
  {
    q: 'Comment fonctionne le Suivi ROI d’un client ?',
    a: 'Chaque fiche client intègre un tableau de bord Suivi ROI agrégeant en direct les dépenses publicitaires (Google Ads), les leads générés et le chiffre d’affaires pipeline.',
  },
  {
    q: 'Comment publier une annonce ou une mise à jour dans le Changelog ?',
    a: 'Dans la section Nouveautés, cliquez sur « Publier une entrée » (admin). Une bannière d’annonce apparaîtra automatiquement en haut de l’application pour informer l’équipe.',
  },
  {
    q: 'Comment configurer mes alertes et notifications ?',
    a: 'Dans Paramètres → Notifications, ajustez les interrupteurs pour vos préférences d’activité (commentaires, mentions, leads) et de sécurité.',
  },
];

function FaqItem({ faq }: { faq: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-mv-border/80 last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 sm:py-5 text-left cursor-pointer group"
      >
        <span className="font-bold text-sm text-mv-ink group-hover:text-mv-green transition-colors">
          {faq.q}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-mv-ink-faint shrink-0 transition-transform duration-200',
            open && 'rotate-180 text-mv-green'
          )}
        />
      </button>
      {open && (
        <p className="text-xs sm:text-sm text-mv-ink-soft pb-5 -mt-1 leading-relaxed animate-mv-fade-up">
          {faq.a}
        </p>
      )}
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
    <PageFadeIn className="max-w-3xl mx-auto space-y-10 pb-16 pt-4">
      {/* Centered Hero Header (Shadcnblocks inspiration) */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-mv-ink tracking-tight font-display">
          Comment pouvons-nous vous aider ?
        </h1>
        <p className="text-xs sm:text-sm text-mv-ink-soft max-w-lg mx-auto">
          Trouvez les réponses aux questions courantes ou contactez directement l&apos;équipe Minerva.
        </p>
      </div>

      {/* Large Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-mv-ink-faint absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une réponse ou un sujet..."
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-mv-surface border border-mv-border text-sm text-mv-ink placeholder:text-mv-ink-faint focus:outline-none focus:border-mv-green shadow-mv-sm"
        />
      </div>

      {/* FAQ Accordion List */}
      <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm">
        {filtered.length === 0 ? (
          <p className="text-center py-10 text-xs sm:text-sm text-mv-ink-faint">
            Aucun résultat trouvé pour « {query} ».
          </p>
        ) : (
          <div className="divide-y divide-mv-border/80">
            {filtered.map((faq) => (
              <FaqItem key={faq.q} faq={faq} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom "Still need help?" Box (Shadcnblocks inspiration) */}
      <div className="bg-mv-cream-soft/80 border border-mv-border rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-mv-sm">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-extrabold text-mv-ink font-display">
            Besoin d&apos;aide supplémentaire ?
          </h2>
          <p className="text-xs text-mv-ink-soft">
            Notre équipe et nos ressources d&apos;assistance sont à votre entière disposition.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Link
            href="/chat"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-mv-surface border border-mv-border text-xs font-bold text-mv-ink hover:border-mv-green/50 hover:shadow-mv-sm transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-mv-green" />
            <span>Chat d&apos;assistance</span>
          </Link>

          <a
            href="mailto:contact@minervaflow.com"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-mv-surface border border-mv-border text-xs font-bold text-mv-ink hover:border-mv-green/50 hover:shadow-mv-sm transition-all cursor-pointer"
          >
            <Mail className="w-4 h-4 text-mv-green" />
            <span>Envoyer un courriel</span>
          </a>

          <a
            href="tel:+15140000000"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-mv-surface border border-mv-border text-xs font-bold text-mv-ink hover:border-mv-green/50 hover:shadow-mv-sm transition-all cursor-pointer"
          >
            <Phone className="w-4 h-4 text-mv-green" />
            <span>Nous appeler</span>
          </a>
        </div>
      </div>
    </PageFadeIn>
  );
}
