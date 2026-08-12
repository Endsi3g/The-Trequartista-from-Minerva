'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search, ShieldAlert, Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-mv-surface text-mv-ink flex flex-col items-center justify-center p-6 relative">
      <div className="max-w-md w-full text-center space-y-6 relative z-10 animate-mv-scale-in">

        {/* Badge 404 */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mv-green-tint border border-mv-green/30 text-mv-green text-xs font-extrabold font-mono shadow-mv-sm">
          <ShieldAlert className="w-4 h-4" />
          <span>Erreur 404 — Page Introuvable</span>
        </div>

        {/* Big Code */}
        <h1 className="text-6xl sm:text-7xl font-extrabold text-mv-ink tracking-tight font-display">
          404
        </h1>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-mv-ink">Oups ! Cette destination n'existe pas.</h2>
          <p className="text-xs text-mv-ink-soft leading-relaxed max-w-sm mx-auto">
            La page que vous recherchez a peut-être été déplacée, supprimée ou n'a jamais existé.
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/overview">
            <Button variant="primary" icon={<Home className="w-4 h-4" />}>
              Retour à l'accueil
            </Button>
          </Link>
        </div>

        {/* Quick Navigation Links */}
        <div className="pt-6 border-t border-mv-border space-y-2 text-xs">
          <span className="text-mv-ink-faint font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-mv-green" /> Raccourcis Directs :
          </span>
          <div className="flex flex-wrap justify-center gap-2 pt-1 font-semibold">
            <Link href="/clients" className="px-2.5 py-1 rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink hover:text-mv-green transition-colors">
              Clients & ROI
            </Link>
            <Link href="/leads" className="px-2.5 py-1 rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink hover:text-mv-green transition-colors">
              Leads CRM
            </Link>
            <Link href="/content-planner" className="px-2.5 py-1 rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink hover:text-mv-green transition-colors">
              Reels Studio
            </Link>
            <Link href="/academy" className="px-2.5 py-1 rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink hover:text-mv-green transition-colors">
              Académie SOPs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
