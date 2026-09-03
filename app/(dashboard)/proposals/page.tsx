'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  Trash2,
  ArrowUpRight,
  Send,
  Layers,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useToast } from '@/components/providers/ToastProvider';
import {
  fetchProposals,
  PROPOSAL_TEMPLATES,
  calculateProposalTotals,
} from '@/lib/services/proposals';
import type { CommercialProposal, ProposalDeliverableItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function ProposalsDashboardPage() {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const [proposals, setProposals] = useState<CommercialProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Form State
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

  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Keyboard Shortcuts: '/' search, 'N' new proposal, 'Escape' close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if ((e.key === 'n' || e.key === 'N') && !isInputFocused && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsDrawerOpen(true);
      } else if (e.key === 'Escape') {
        if (isDrawerOpen) {
          setIsDrawerOpen(false);
        } else if (searchQuery) {
          setSearchQuery('');
          searchInputRef.current?.blur();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isDrawerOpen) {
        e.preventDefault();
        handleCreateProposalSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, searchQuery, title, clientName, clientEmail, deliverables]);

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.client_name.toLowerCase().includes(q) ||
        (p.client_company || '').toLowerCase().includes(q) ||
        p.proposal_number.toLowerCase().includes(q);
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
      .reduce((sum, p) => sum + (Number(p.deposit_amount_cad) || (Number(p.total_setup_cad) || 0) * 0.5), 0);
  }, [proposals]);

  const pendingValue = useMemo(() => {
    return proposals
      .filter((p) => p.status === 'sent' || p.status === 'viewed')
      .reduce((sum, p) => sum + (Number(p.total_setup_cad) || 0), 0);
  }, [proposals]);

  const averageDealValue = useMemo(() => {
    if (proposals.length === 0) return 2150;
    return Math.round(totalPipelineValue / proposals.length);
  }, [proposals, totalPipelineValue]);

  const handleApplyTemplate = (templateId: string) => {
    const tpl = PROPOSAL_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setTitle(tpl.title);
    setDeliverables(tpl.deliverables);
    setTotalMonthlyCad(tpl.total_monthly_cad || 0);
    toastInfo('Modèle appliqué', `Le modèle « ${tpl.title} » est prêt.`);
  };

  const handleAddDeliverable = () => {
    setDeliverables([
      ...deliverables,
      {
        id: `del-${Date.now()}`,
        title: 'Nouvelle prestation',
        category: 'Services',
        description: 'Description détaillée',
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

  const handleCreateProposalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        toastSuccess('Proposition créée !', 'La proposition a été générée avec succès.');
        setIsDrawerOpen(false);
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
    setCopiedToken(token);
    toastSuccess('Lien copié', url);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <PageFadeIn className="space-y-3 pb-8">
      {/* ── 1. Linear-Style Toolbar Strip (h-10 / 40px) ── */}
      <div className="h-10 bg-white border border-zinc-200 rounded-lg px-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono" style={MONO}>
            <span>Minerva</span>
            <span>/</span>
            <span className="text-zinc-600 font-medium">Devis</span>
          </div>
          <span className="text-zinc-200">|</span>
          <h1 className="text-xs sm:text-sm font-semibold text-zinc-900 tracking-tight truncate">
            Studio Propositions
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded" style={MONO}>
            Stripe 50% Acompte
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-3 h-3 text-zinc-400 absolute left-2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Chercher client / réf..."
              className="h-7 w-36 sm:w-44 pl-7 pr-6 text-xs bg-zinc-50 border border-zinc-200 rounded-md placeholder-zinc-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
            />
            <kbd className="hidden sm:inline-flex absolute right-1.5 top-1.5 px-1 py-0.2 text-[9px] font-mono text-zinc-400 bg-white border border-zinc-200 rounded shadow-2xs pointer-events-none" style={MONO}>
              /
            </kbd>
          </div>

          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-7 px-2 text-xs bg-zinc-50 border border-zinc-200 rounded-md text-zinc-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Tous statuts</option>
            <option value="draft">Brouillons</option>
            <option value="sent">En attente</option>
            <option value="viewed">Consultés</option>
            <option value="signed">Signés</option>
          </select>

          {/* New Proposal Button (Shortcut N) */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="h-7 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle Proposition</span>
            <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] font-mono bg-emerald-800/60 rounded text-emerald-200" style={MONO}>
              N
            </kbd>
          </button>
        </div>
      </div>

      {/* ── 2. Monolithic Connected KPI Ribbon (h-14 / 56px) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-x divide-zinc-100 shadow-2xs overflow-hidden">
        {/* Metric 1: Pipeline Devis */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Pipeline Devis
            </span>
            <span className="text-[10px] font-bold font-mono text-zinc-700 bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 rounded" style={MONO}>
              {proposals.length} émis
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
              <AnimatedNumber value={totalPipelineValue} formatDecimals={0} /> $ CAD
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              Total TTC
            </span>
          </div>
        </div>

        {/* Metric 2: Signé & Encaissé (Acomptes) */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Signé &amp; Encaissé
            </span>
            <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded" style={MONO}>
              Acomptes 50%
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono tabular-nums text-emerald-700" style={MONO}>
              <AnimatedNumber value={totalSignedValue} formatDecimals={0} /> $ CAD
            </span>
            <span className="text-[11px] text-emerald-600 font-mono font-medium" style={MONO}>
              Converti
            </span>
          </div>
        </div>

        {/* Metric 3: En Attente de Signature */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              En Attente Signature
            </span>
            <span className="text-[10px] font-bold font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded" style={MONO}>
              En cours
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono tabular-nums text-amber-700" style={MONO}>
              <AnimatedNumber value={pendingValue} formatDecimals={0} /> $ CAD
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              Relances auto
            </span>
          </div>
        </div>

        {/* Metric 4: Panier Moyen Deal */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Panier Moyen Deal
            </span>
            <span className="text-[10px] font-bold font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded" style={MONO}>
              Moyenne
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
              <AnimatedNumber value={averageDealValue} formatDecimals={0} /> $ CAD
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              Par contrat
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. High Density Proposals DataTable (h-9 / 36px) ── */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden flex flex-col">
        {/* Table Column Labels */}
        <div className="grid grid-cols-12 h-7 px-3.5 border-b border-zinc-200/80 bg-zinc-50/50 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 items-center">
          <span className="col-span-2">Réf</span>
          <span className="col-span-3">Client / Contact</span>
          <span className="col-span-2">Formule Pack</span>
          <span className="col-span-2">Date Émission</span>
          <span className="col-span-1 text-right">Acompte</span>
          <span className="col-span-1 text-center">Statut</span>
          <span className="col-span-1 text-right">Actions</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-zinc-100">
          {filteredProposals.length === 0 ? (
            <div className="h-14 px-3.5 flex items-center justify-between text-xs text-zinc-500 bg-zinc-50/20">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Aucune proposition commerciale trouvée.</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="text-[11px] text-emerald-700 hover:underline font-mono cursor-pointer"
                style={MONO}
              >
                + Rédiger une proposition rapide (N) →
              </button>
            </div>
          ) : (
            filteredProposals.map((proposal) => {
              const dateStr = proposal.created_at
                ? new Date(proposal.created_at).toISOString().slice(0, 10)
                : '—';
              const deposit = proposal.deposit_amount_cad || (Number(proposal.total_setup_cad) || 0) * 0.5;

              return (
                <div
                  key={proposal.id}
                  className="grid grid-cols-12 h-9 px-3.5 items-center text-xs text-zinc-800 hover:bg-zinc-50/80 transition-colors group"
                >
                  {/* Col 1: Réf */}
                  <div className="col-span-2 flex items-center gap-1.5 pr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-mono text-zinc-600 font-semibold text-[11px] truncate" style={MONO}>
                      {proposal.proposal_number}
                    </span>
                  </div>

                  {/* Col 2: Client */}
                  <div className="col-span-3 min-w-0 pr-2">
                    <span className="font-semibold text-zinc-900 truncate block">
                      {proposal.client_name}
                    </span>
                    {proposal.client_company && (
                      <span className="text-[10px] text-zinc-400 truncate block">
                        {proposal.client_company}
                      </span>
                    )}
                  </div>

                  {/* Col 3: Pack Title */}
                  <div className="col-span-2 text-zinc-600 text-[11px] truncate pr-2">
                    {proposal.title}
                  </div>

                  {/* Col 4: Date */}
                  <div className="col-span-2 font-mono text-[11px] text-zinc-500 tabular-nums" style={MONO}>
                    {dateStr}
                  </div>

                  {/* Col 5: Acompte 50% */}
                  <div className="col-span-1 font-mono text-[11px] text-zinc-900 font-semibold text-right tabular-nums" style={MONO}>
                    {Math.round(deposit)} $
                  </div>

                  {/* Col 6: Statut Micro-Pill */}
                  <div className="col-span-1 flex justify-center">
                    {proposal.status === 'signed' || proposal.status === 'paid' ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border bg-emerald-50 text-emerald-700 border-emerald-200" style={MONO}>
                        Signé
                      </span>
                    ) : proposal.status === 'viewed' ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border bg-blue-50 text-blue-700 border-blue-200" style={MONO}>
                        Consulté
                      </span>
                    ) : proposal.status === 'sent' ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border bg-amber-50 text-amber-700 border-amber-200" style={MONO}>
                        En attente
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border bg-zinc-100 text-zinc-600 border-zinc-200" style={MONO}>
                        Brouillon
                      </span>
                    )}
                  </div>

                  {/* Col 7: Hover Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => copyProposalLink(proposal.token)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-900 cursor-pointer"
                      title="Copier le lien public"
                    >
                      {copiedToken === proposal.token ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <Link
                      href={`/proposals/${proposal.token}`}
                      target="_blank"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-emerald-700"
                      title="Prévisualiser"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inline Bottom Fast Insertion Row */}
        <div className="h-8 px-3.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1.5 font-mono text-[11px] cursor-pointer"
            style={MONO}
          >
            <span>+ Rédiger une proposition rapide [N]</span>
          </button>
          <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
            Acompte Stripe 50% natif
          </span>
        </div>
      </div>

      {/* ── 4. Slide-Over Drawer Linear-Style (2-Colonnes) ── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-white border-l border-zinc-200 shadow-2xl h-full flex flex-col justify-between overflow-hidden">
            {/* Drawer Header */}
            <div className="h-12 px-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/60">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Nouvelle Proposition Commerciale
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Template Fast Picker */}
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-zinc-400">Modèle :</span>
                  {PROPOSAL_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl.id)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-zinc-200 hover:border-emerald-600 text-zinc-700 cursor-pointer"
                      style={MONO}
                    >
                      {tpl.id === 'standard-flow-studio' ? 'Flow+Studio' : tpl.id.split('-')[0]}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                  title="Fermer (Échap)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer 2-Column Body (60% Inputs / 40% Live Totals & Preview) */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
              {/* Left Column (60% - 7 cols) : Inputs & Deliverables */}
              <div className="md:col-span-7 p-4 space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    Titre du Deal *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Refonte Digitale & Flow — Le Saint-Bocuse"
                    className="w-full h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      Nom Contact *
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Marc Tremblay"
                      className="w-full h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      Courriel Client *
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="direction@resto.ca"
                      className="w-full h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    Établissement / Entreprise
                  </label>
                  <input
                    type="text"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="Bistro Le Saint-Bocuse"
                    className="w-full h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                {/* Deliverables Section */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Livrables &amp; Tarification Setup
                    </span>
                    <button
                      type="button"
                      onClick={handleAddDeliverable}
                      className="text-[10px] text-emerald-700 hover:underline font-mono cursor-pointer"
                      style={MONO}
                    >
                      + Ajouter prestation
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {deliverables.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleDeliverableChange(idx, 'title', e.target.value)}
                            className="h-6 px-1.5 text-xs font-semibold bg-white border border-zinc-200 rounded flex-1 focus:outline-none focus:border-emerald-600"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={item.price_cad}
                              onChange={(e) => handleDeliverableChange(idx, 'price_cad', Number(e.target.value) || 0)}
                              className="h-6 w-20 px-1.5 text-xs text-right font-mono bg-white border border-zinc-200 rounded focus:outline-none focus:border-emerald-600"
                              style={MONO}
                            />
                            <span className="text-xs text-zinc-500">$</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDeliverable(idx)}
                              className="text-zinc-400 hover:text-rose-600 p-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column (40% - 5 cols) : Live Preview & Totals */}
              <div className="md:col-span-5 p-4 bg-zinc-50/50 flex flex-col justify-between text-xs space-y-4">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Décomposition Financière
                  </span>

                  <div className="p-3 bg-white border border-zinc-200 rounded-lg space-y-2 font-mono text-xs" style={MONO}>
                    <div className="flex items-center justify-between text-zinc-600">
                      <span>Total Prestations :</span>
                      <span>{calculatedFormTotals.subtotal_setup_cad.toFixed(2)} $</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                      <span>TPS (5%) :</span>
                      <span>{calculatedFormTotals.tax_tps_cad.toFixed(2)} $</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-500 text-[11px]">
                      <span>TVQ (9.975%) :</span>
                      <span>{calculatedFormTotals.tax_tvq_cad.toFixed(2)} $</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between font-bold text-zinc-900 text-sm">
                      <span>Total TTC :</span>
                      <span>{calculatedFormTotals.total_setup_cad.toFixed(2)} $</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Acompte Stripe 50% Exigé
                    </span>
                    <div className="text-base font-bold font-mono text-emerald-800" style={MONO}>
                      {calculatedFormTotals.deposit_amount_cad.toFixed(2)} $ CAD
                    </div>
                    <p className="text-[10px] text-emerald-700">
                      La signature client débloque instantanément la session de paiement Stripe sécurisée.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleCreateProposalSubmit()}
                    disabled={submitting}
                    className="w-full h-8 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Création...' : 'Générer la Proposition (⌘+↵)'}</span>
                  </button>
                  <p className="text-center text-[10px] text-zinc-400 font-mono" style={MONO}>
                    Échap pour annuler
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
