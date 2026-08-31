'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useToast } from '@/components/providers/ToastProvider';
import {
  FileCheck2,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Sparkles,
  DollarSign,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  ArrowRight,
  Send,
  Building2,
  Trash2,
} from 'lucide-react';
import {
  fetchProposals,
  PROPOSAL_TEMPLATES,
  calculateProposalTotals,
} from '@/lib/services/proposals';
import type { CommercialProposal, ProposalDeliverableItem, ProposalPhase, ProposalStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function ProposalsDashboardPage() {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const [proposals, setProposals] = useState<CommercialProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Proposal Form State
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [totalMonthlyCad, setTotalMonthlyCad] = useState<number>(0);
  const [deliverables, setDeliverables] = useState<ProposalDeliverableItem[]>([
    { id: '1', title: 'Pack 8 Reels 4K', category: 'Production Vidéo', description: 'Tournage & montage cinéma', price_cad: 1500 },
    { id: '2', title: 'Setup Flow & Menu QR', category: 'Opérations', description: 'Branchement POS et 50 chevalets', price_cad: 650 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const loadProposals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/proposals');
      const data = await res.json();
      if (data.proposals) {
        setProposals(data.proposals);
      }
    } catch {
      const fallback = await fetchProposals();
      setProposals(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.client_company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.proposal_number.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [proposals, searchQuery, statusFilter]);

  // KPIs
  const totalPipelineValue = useMemo(() => {
    return proposals.reduce((sum, p) => sum + (Number(p.total_setup_cad) || 0), 0);
  }, [proposals]);

  const totalSignedValue = useMemo(() => {
    return proposals
      .filter((p) => p.status === 'signed' || p.status === 'paid')
      .reduce((sum, p) => sum + (Number(p.total_setup_cad) || 0), 0);
  }, [proposals]);

  const pendingProposalsCount = useMemo(() => {
    return proposals.filter((p) => p.status === 'sent' || p.status === 'viewed').length;
  }, [proposals]);

  const handleApplyTemplate = (templateId: string) => {
    const tpl = PROPOSAL_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setTitle(tpl.title);
    setDeliverables(tpl.deliverables);
    setTotalMonthlyCad(tpl.total_monthly_cad || 0);
    toastInfo('Modèle appliqué', `Le modèle "${tpl.title}" a pré-rempli la proposition.`);
  };

  const handleAddDeliverable = () => {
    setDeliverables([
      ...deliverables,
      {
        id: `del-${Date.now()}`,
        title: 'Nouvelle prestation',
        category: 'Services',
        description: 'Description détaillée du livrable',
        price_cad: 500,
      },
    ]);
  };

  const handleRemoveDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const handleDeliverableChange = (index: number, field: keyof ProposalDeliverableItem, value: string | number) => {
    const updated = [...deliverables];
    updated[index] = { ...updated[index], [field]: value };
    setDeliverables(updated);
  };

  const calculatedFormTotals = useMemo(() => {
    return calculateProposalTotals(deliverables, true, 50.0);
  }, [deliverables]);

  const handleCreateProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim() || deliverables.length === 0) {
      toastError('Champs obligatoires', 'Veuillez renseigner le titre, le client et au moins un livrable.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          client_name: clientName,
          client_email: clientEmail,
          client_company: clientCompany,
          deliverables,
          scope_phases: PROPOSAL_TEMPLATES[0].scope_phases,
          total_monthly_cad: totalMonthlyCad,
        }),
      });

      if (res.ok) {
        toastSuccess('Proposition créée !', 'La proposition commerciale a été générée avec succès.');
        setShowCreateModal(false);
        // Reset form
        setTitle('');
        setClientName('');
        setClientEmail('');
        setClientCompany('');
        await loadProposals();
      } else {
        toastError('Erreur', 'Impossible de créer la proposition.');
      }
    } catch {
      toastError('Erreur réseau', 'Échec de création.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyProposalLink = (token: string) => {
    const url = `${window.location.origin}/proposals/${token}`;
    navigator.clipboard.writeText(url);
    toastSuccess('Lien copié', 'Le lien public de signature a été copié dans le presse-papier.');
  };

  return (
    <PageFadeIn className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── 1. Top Header Banner ── */}
      <div className="bg-gradient-to-r from-mv-green-darker via-emerald-950 to-zinc-900 border border-mv-green/30 rounded-2xl p-6 text-white relative overflow-hidden shadow-mv-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-mv-green/20 border border-mv-green/40 flex items-center justify-center text-mv-green">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold font-display tracking-tight text-white">
                Studio de Propositions & Signature Électronique
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                Acompte 50% Stripe Intégré
              </span>
            </div>
            <p className="text-xs text-zinc-300 max-w-2xl">
              Générez des propositions commerciales visuelles et interactives combinant SaaS Flow & Prestations Studio avec signature numérique et acompte instantané.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="bg-mv-green hover:bg-emerald-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Proposition</span>
          </Button>
        </div>
      </div>

      {/* ── 2. KPI Ribbon ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Pipeline Devis & Propal</span>
            <DollarSign className="w-4 h-4 text-mv-green" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-mv-ink font-mono" style={MONO}>
              <AnimatedNumber value={totalPipelineValue} formatDecimals={0} /> $
            </span>
            <span className="text-[11px] font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
              Total TTC
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">{proposals.length} propositions émises</p>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Signé & Encaissé (Acomptes)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 font-mono" style={MONO}>
              <AnimatedNumber value={totalSignedValue} formatDecimals={0} /> $
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              Validé
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Conversions fermes en production</p>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>En Attente de Signature</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 font-mono" style={MONO}>
              {pendingProposalsCount}
            </span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
              En cours
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Propositions envoyées ou consultées</p>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Panier Moyen Deal</span>
            <TrendingUp className="w-4 h-4 text-mv-blue" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-mv-ink font-mono" style={MONO}>
              <AnimatedNumber
                value={proposals.length > 0 ? Math.round(totalPipelineValue / proposals.length) : 0}
                formatDecimals={0}
              /> $
            </span>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              CAD
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Setup moyen par client signé</p>
        </div>
      </div>

      {/* ── 3. Filters and Search ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-mv-surface p-3 rounded-xl border border-mv-border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-mv-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre, client, numéro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-semibold text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="sent">Envoyé (En attente)</option>
            <option value="viewed">Consulté</option>
            <option value="signed">Signé & Acompte payé</option>
            <option value="draft">Brouillon</option>
          </select>
        </div>
      </div>

      {/* ── 4. Proposals Grid / List ── */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
          <Card className="p-12 text-center bg-mv-surface border-mv-border rounded-xl space-y-3 shadow-xs">
            <FileCheck2 className="w-10 h-10 text-mv-ink-faint mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-mv-ink">Aucune proposition commerciale trouvée</h3>
            <p className="text-xs text-mv-ink-soft max-w-md mx-auto">
              Créez votre première proposition commerciale avec signature électronique et paiement d'acompte Stripe 50% intégré.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-mv-green hover:bg-mv-green/90 text-white text-xs font-semibold gap-1.5 cursor-pointer mt-2"
            >
              <Plus size={14} />
              <span>Créer une proposition</span>
            </Button>
          </Card>
        ) : (
          filteredProposals.map((prop) => (
            <Card key={prop.id} className="p-5 hover:border-mv-green/40 transition-all space-y-4 bg-mv-surface border-mv-border rounded-xl shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-xs text-mv-green bg-mv-green/10 px-2 py-0.5 rounded">
                      {prop.proposal_number}
                    </span>
                    <h3 className="font-bold text-sm text-mv-ink font-display">{prop.title}</h3>
                    <Badge
                      variant={
                        prop.status === 'signed' || prop.status === 'paid'
                          ? 'green'
                          : prop.status === 'sent'
                          ? 'amber'
                          : 'blue'
                      }
                    >
                      {prop.status === 'signed' ? 'Signé • Acompte OK' : prop.status === 'sent' ? 'Envoyé' : prop.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-mv-ink-soft">
                    Client : <strong className="text-mv-ink font-semibold">{prop.client_name}</strong>
                    {prop.client_company ? ` (${prop.client_company})` : ''} • Émis le{' '}
                    {new Date(prop.created_at).toLocaleDateString('fr-CA')}
                  </p>
                </div>

                {/* Financial Snapshot */}
                <div className="flex items-center gap-4 bg-mv-cream-soft p-3 rounded-xl border border-mv-border shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-mv-ink-soft block">Total Setup TTC</span>
                    <span className="font-mono font-bold text-sm text-mv-ink" style={MONO}>
                      {prop.total_setup_cad.toLocaleString('fr-CA')} $
                    </span>
                  </div>
                  <div className="h-6 w-px bg-mv-border" />
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Acompte 50%</span>
                    <span className="font-mono font-bold text-sm text-emerald-600" style={MONO}>
                      {prop.deposit_amount_cad.toLocaleString('fr-CA')} $
                    </span>
                  </div>
                </div>
              </div>

              {/* Scope / Deliverables List pills */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-mv-border">
                <span className="text-[11px] font-bold text-mv-ink-soft">Livrables inclus :</span>
                {prop.deliverables.map((del, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[11px] font-medium border border-zinc-200"
                  >
                    {del.title} ({del.price_cad} $)
                  </span>
                ))}
              </div>

              {/* Actions Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-mv-border text-xs">
                <span className="text-[11px] text-mv-ink-faint">
                  {prop.signer_name
                    ? `Signé numériquement par ${prop.signer_name} le ${new Date(prop.signed_at || '').toLocaleDateString('fr-CA')}`
                    : 'En attente de signature du prospect'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyProposalLink(prop.token)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-mv-surface border border-mv-border text-mv-ink text-xs font-semibold hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier lien</span>
                  </button>

                  <Link
                    href={`/proposals/${prop.token}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-mv-green text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-xs"
                  >
                    <span>Ouvrir</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* ── 5. Create Proposal Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-mv-surface border border-mv-border rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-mv-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-mv-green/10 text-mv-green flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-mv-ink font-display">
                  Générer une Proposition Commerciale
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-mv-ink-faint hover:text-mv-ink cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProposalSubmit} className="p-6 overflow-y-auto space-y-6">
              {/* Quick Template Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-mv-ink flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Modèles d'offres pré-configurés</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('flow-and-reels-pack')}
                    className="p-2.5 rounded-xl border border-mv-border bg-mv-cream-soft hover:border-mv-green text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-xs text-mv-ink block">Pack Flow & 8 Reels 4K</span>
                    <span className="text-[10.5px] text-mv-ink-soft">2 150 $ Setup + 149 $/mo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('framer-and-ads-pack')}
                    className="p-2.5 rounded-xl border border-mv-border bg-mv-cream-soft hover:border-mv-green text-left transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-xs text-mv-ink block">Site Framer & Ads 5 km</span>
                    <span className="text-[10.5px] text-mv-ink-soft">4 000 $ Setup clé en main</span>
                  </button>
                </div>
              </div>

              {/* General Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-mv-ink mb-1">Titre de la proposition</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Proposition Pilote — Resto & Vidéos 4K"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-mv-cream-soft border border-mv-border text-xs text-mv-ink focus:outline-none focus:border-mv-green"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-mv-ink mb-1">Nom du signataire</label>
                    <input
                      type="text"
                      required
                      placeholder="Jean Tremblay"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-mv-cream-soft border border-mv-border text-xs text-mv-ink focus:outline-none focus:border-mv-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-mv-ink mb-1">Entreprise / Restaurant</label>
                    <input
                      type="text"
                      placeholder="Bistro Laurier Inc."
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-mv-cream-soft border border-mv-border text-xs text-mv-ink focus:outline-none focus:border-mv-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-mv-ink mb-1">Courriel</label>
                    <input
                      type="email"
                      placeholder="jean@bistrolaurier.ca"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-mv-cream-soft border border-mv-border text-xs text-mv-ink focus:outline-none focus:border-mv-green"
                    />
                  </div>
                </div>
              </div>

              {/* Deliverables Builder */}
              <div className="space-y-3 pt-3 border-t border-mv-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-mv-ink">Livrables & Prestations au Forfait</label>
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="text-xs text-mv-green font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une prestation</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {deliverables.map((del, idx) => (
                    <div key={del.id || idx} className="p-3 rounded-xl bg-mv-cream-soft border border-mv-border flex items-center gap-3 text-xs">
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          placeholder="Titre de la prestation"
                          value={del.title}
                          onChange={(e) => handleDeliverableChange(idx, 'title', e.target.value)}
                          className="w-full font-semibold bg-transparent border-b border-mv-border pb-0.5 text-xs text-mv-ink focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Description succincte"
                          value={del.description}
                          onChange={(e) => handleDeliverableChange(idx, 'description', e.target.value)}
                          className="w-full text-[11px] text-mv-ink-soft bg-transparent focus:outline-none"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="Prix CAD"
                          value={del.price_cad}
                          onChange={(e) => handleDeliverableChange(idx, 'price_cad', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded bg-mv-surface border border-mv-border text-right font-mono font-bold text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(idx)}
                        className="text-mv-ink-faint hover:text-red-600 cursor-pointer p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Live Preview */}
              <div className="bg-mv-cream-soft p-4 rounded-xl border border-mv-border space-y-2 text-xs">
                <div className="flex justify-between text-mv-ink-soft">
                  <span>Sous-total HT :</span>
                  <span className="font-mono font-bold text-mv-ink">{calculatedFormTotals.subtotal_setup_cad.toFixed(2)} $ CAD</span>
                </div>
                <div className="flex justify-between text-mv-ink-soft">
                  <span>TPS (5%) + TVQ (9.975%) :</span>
                  <span className="font-mono">{(calculatedFormTotals.tax_tps_cad + calculatedFormTotals.tax_tvq_cad).toFixed(2)} $</span>
                </div>
                <div className="flex justify-between font-bold text-mv-ink pt-1 border-t border-mv-border">
                  <span>Total TTC :</span>
                  <span className="font-mono text-sm">{calculatedFormTotals.total_setup_cad.toFixed(2)} $ CAD</span>
                </div>
                <div className="flex justify-between font-extrabold text-emerald-700 pt-1 border-t border-mv-border">
                  <span>Acompte 50% payable à la signature :</span>
                  <span className="font-mono text-sm">{calculatedFormTotals.deposit_amount_cad.toFixed(2)} $ CAD</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Création en cours…' : 'Générer la Proposition & Lien de Signature'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
