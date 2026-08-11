'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Map, CheckCircle2, Clock, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';

export default function ProjectRoadmapPage() {
  const steps = [
    {
      title: '1. Refonte Site Framer & UI Mobile-First',
      category: 'Framer Website',
      status: 'Completed',
      dueDate: '2026-08-05',
      desc: 'Maquettage Figma, conversion Framer responsive, intégration des animations Minerva.',
    },
    {
      title: '2. Fiche Google Business & SEO Local',
      category: 'Google Business',
      status: 'Completed',
      dueDate: '2026-08-08',
      desc: 'Optimisation de la fiche GMB, recueil de 34 avis clients authentiques et balisage schema.org.',
    },
    {
      title: '3. Automatisme WhatsApp IA & Relance Instantanée',
      category: 'WhatsApp AI Bot',
      status: 'In Progress',
      dueDate: '2026-08-12',
      desc: 'Connexion du webhook Make/n8n à OpenAI pour répondre aux leads en moins de 60 secondes.',
    },
    {
      title: '4. Missed-Call Text-Back System',
      category: 'Missed-call Text-back',
      status: 'Pending',
      dueDate: '2026-08-15',
      desc: 'Envoi automatique d’un SMS au prospect si l’appel manque lors des heures de fermeture.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
              Roadmap des Jalons Client
            </h1>
            <Badge variant="green">Apex Roofing</Badge>
          </div>
          <p className="text-sm text-mv-ink-soft mt-1">
            Feuille de route d'exécution technique (Framer, GMB, Agent IA & Text-back).
          </p>
        </div>

        <Link href="/projects/proj-apex-launch/launch-check">
          <Button variant="lime" icon={<CheckCircle2 className="w-4 h-4" />}>
            Passer à la Checklist 20-Pts
          </Button>
        </Link>
      </div>

      {/* Steps Vertical Timeline */}
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <Card key={idx} className="border-l-4 border-l-mv-green">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                    step.status === 'Completed'
                      ? 'bg-mv-green text-mv-cream'
                      : step.status === 'In Progress'
                      ? 'bg-mv-warm-tint text-mv-warm border border-mv-warm/40'
                      : 'bg-mv-cream-soft text-mv-ink-soft border border-mv-border'
                  }`}
                >
                  {step.status === 'Completed' ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-mv-ink">{step.title}</h3>
                    <Badge variant={step.status === 'Completed' ? 'green' : step.status === 'In Progress' ? 'lime' : 'neutral'}>
                      {step.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-mv-ink-soft mt-1">{step.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-mv-ink-soft">
                <Clock className="w-3.5 h-3.5" />
                <span>{step.dueDate}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
