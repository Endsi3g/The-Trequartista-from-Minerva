'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UserCheck, Plus, Calendar, Sparkles, ExternalLink } from 'lucide-react';
import { INITIAL_TEAM } from '@/lib/mock-data';

export default function TeamPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Répertoire Équipe In-House Minerva
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Gestion des collaborateurs, des sessions 1-on-1 et du développement des compétences.
          </p>
        </div>

        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
          Inviter un Collaborateur
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {INITIAL_TEAM.map((member) => (
          <Card key={member.id}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={member.avatar_url}
                  alt={member.full_name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-mv-green"
                />
                <div>
                  <div className="font-extrabold text-sm text-mv-ink">{member.full_name}</div>
                  <div className="text-xs text-mv-ink-soft">{member.role}</div>
                  <Badge variant="green" className="mt-1">● Actif</Badge>
                </div>
              </div>

              <Link href={`/team/${member.id}/performance`}>
                <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                  Fiche 1-on-1
                </Button>
              </Link>
            </div>

            <div className="mt-4 pt-4 border-t border-mv-border space-y-2 text-xs">
              <div className="flex justify-between text-mv-ink-soft">
                <span>Prochain 1-on-1 :</span>
                <span className="font-bold text-mv-ink font-mono">13 Août à 14h00</span>
              </div>
              <div className="flex justify-between text-mv-ink-soft">
                <span>OKRs Complétés Q3 :</span>
                <span className="font-bold text-mv-green">90% d'avancement</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
