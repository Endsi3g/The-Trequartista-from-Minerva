'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Receipt,
  FileText,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  Send,
  RefreshCw,
  Eye,
  Check,
  AlertTriangle,
  Play,
  Layers,
  ChevronRight,
  CreditCard,
  Download,
  CheckSquare,
  ArrowUpRight,
  User,
  X,
  Lock,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { LogoMark } from '@/components/shell/Logo';
import { useToast } from '@/components/providers/ToastProvider';
import type { ClientPortalData, ClientDeliverable, StudioServicePackage } from '@/lib/types';
import { STUDIO_PACKAGES_CATALOG } from '@/lib/services/studio-marketplace';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function ClientPortalPublicPage() {
  const params = useParams();
  const { toastSuccess, toastError } = useToast();
  const token = params?.token as string;

  const [data, setData] = useState<ClientPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'deliverables' | 'invoices' | 'roi' | 'studio' | 'messages'>('overview');
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  // Revision inline feedback state inside Action Center
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [inlineRevisionNotes, setInlineRevisionNotes] = useState('');

  // Support message form state
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [authorName, setAuthorName] = useState('');

  // Stripe Checkout & Portal States
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        toastSuccess('Paiement validé !', 'Votre abonnement Minerva est maintenant actif.');
      }
    }
  }, []);

  const handleStartStripeSubscription = async () => {
    if (!client?.id) return;
    setIsStartingCheckout(true);
    try {
      const res = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toastError('Erreur Stripe', data?.error || "Impossible d'initier le paiement.");
      }
    } catch {
      toastError('Erreur réseau', 'Échec de communication avec le serveur Stripe.');
    } finally {
      setIsStartingCheckout(false);
    }
  };

  const handleOpenCustomerPortal = async () => {
    if (!client?.id) return;
    setIsOpeningPortal(true);
    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toastError('Erreur Stripe', data?.error || "Impossible d'ouvrir le portail client.");
      }
    } catch {
      toastError('Erreur réseau', 'Échec de communication avec le portail Stripe.');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const loadPortalData = async () => {
    try {
      const res = await fetch(`/api/portal/${token}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.client?.name) {
          setAuthorName(json.client.name);
        }
      } else {
        toastError('Accès refusé', 'Lien de portail invalide ou expiré.');
      }
    } catch {
      toastError('Erreur réseau', 'Impossible de charger votre espace client.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPortalData();
    }
  }, [token]);

  const { client, projects, deliverables = [], invoices = [], roiMetrics = [], messages = [], agencyContact } = data || {};
  const mainProject = projects?.[0] || null;

  const totalMilestones = mainProject?.milestones?.length || 0;
  const completedMilestones = mainProject?.milestones?.filter((m) => m.completed).length || 0;
  const projectProgressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 50;

  const pendingDeliverables = useMemo(() => {
    return deliverables.filter((d) => d.status === 'pending_review');
  }, [deliverables]);

  const pendingDeliverablesCount = pendingDeliverables.length;
  const priorityDeliverable = pendingDeliverables[0] || null;

  // Handle Approve Deliverable
  const handleApproveDeliverable = async (deliverableId: string) => {
    setSubmittingAction(deliverableId);
    try {
      const res = await fetch(`/api/portal/${token}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliverable_id: deliverableId,
          status: 'approved',
        }),
      });

      if (res.ok) {
        toastSuccess('Livrable approuvé !', 'Votre validation a été enregistrée et transmise à l’équipe Minerva.');
        setShowRevisionInput(false);
        setInlineRevisionNotes('');
        await loadPortalData();
      } else {
        toastError('Erreur', 'Impossible de valider ce livrable.');
      }
    } catch {
      toastError('Erreur réseau', 'La validation a échoué.');
    } finally {
      setSubmittingAction(null);
    }
  };

  // Handle Request Revision (Inline form)
  const handleRequestRevisionSubmit = async (deliverableId: string) => {
    if (!inlineRevisionNotes.trim()) return;

    setSubmittingAction(deliverableId);
    try {
      const res = await fetch(`/api/portal/${token}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliverable_id: deliverableId,
          status: 'revision_requested',
          feedback_notes: inlineRevisionNotes.trim(),
        }),
      });

      if (res.ok) {
        toastSuccess('Retours enregistrés', 'L’équipe Minerva traitera vos ajustements dans les plus brefs délais.');
        setShowRevisionInput(false);
        setInlineRevisionNotes('');
        await loadPortalData();
      } else {
        toastError('Erreur', 'Impossible d’enregistrer vos retours.');
      }
    } catch {
      toastError('Erreur réseau', 'Échec de transmission.');
    } finally {
      setSubmittingAction(null);
    }
  };

  // Keyboard shortcut: ⌘+Enter to approve priority deliverable or submit revision
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (showRevisionInput && priorityDeliverable && inlineRevisionNotes.trim()) {
          e.preventDefault();
          handleRequestRevisionSubmit(priorityDeliverable.id);
        } else if (!showRevisionInput && priorityDeliverable && !submittingAction) {
          e.preventDefault();
          handleApproveDeliverable(priorityDeliverable.id);
        }
      } else if (e.key === 'Escape') {
        if (showRevisionInput) {
          setShowRevisionInput(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRevisionInput, priorityDeliverable, inlineRevisionNotes, submittingAction]);

  // Support message submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    setSubmittingAction('message_send');
    try {
      const res = await fetch(`/api/portal/${token}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: authorName || client?.name || 'Client',
          author_email: client?.email || undefined,
          subject: messageSubject || 'Demande prioritaire',
          message: messageContent,
        }),
      });

      if (res.ok) {
        toastSuccess('Message transmis', 'Votre demande a été envoyée avec succès.');
        setMessageSubject('');
        setMessageContent('');
        await loadPortalData();
      } else {
        toastError('Erreur', 'Impossible d’envoyer votre message.');
      }
    } catch {
      toastError('Erreur réseau', 'Échec d’envoi.');
    } finally {
      setSubmittingAction(null);
    }
  };

  // Order Studio Package
  const handleOrderStudioPackage = async (pkg: StudioServicePackage) => {
    if (!client?.id) return;
    setSubmittingAction(pkg.id);
    try {
      const res = await fetch(`/api/studio/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          packageId: pkg.id,
          notes: `Commande passée depuis le portail client (${client.name}).`,
        }),
      });

      if (res.ok) {
        toastSuccess('Commande validée !', `Le pack "${pkg.title}" a été activé.`);
        await loadPortalData();
        setActiveTab('invoices');
      } else {
        toastError('Erreur', 'Impossible d’enregistrer la commande.');
      }
    } catch {
      toastError('Erreur réseau', 'Échec de commande.');
    } finally {
      setSubmittingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center space-y-3 font-mono text-xs text-zinc-400" style={MONO}>
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Connexion sécurisée à l'extranet client...</span>
      </div>
    );
  }

  if (!data || !client) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="p-6 max-w-sm w-full text-center space-y-3 bg-white border border-zinc-200 rounded-lg shadow-2xs">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
          <h2 className="text-sm font-bold text-zinc-900">Accès au portail introuvable</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Ce lien sécurisé est invalide ou a expiré. Veuillez contacter votre gestionnaire de compte Minerva.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-12">
      {/* ── 1. Header & Status Bar Sécurisée (h-10 / 40px) ── */}
      <header className="sticky top-0 z-30 h-10 border-b border-zinc-200 bg-white px-4 flex items-center justify-between shadow-2xs">
        {/* Left: Minerva Logo & Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <LogoMark size={20} />
          </div>
          <span className="text-zinc-200">|</span>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono truncate" style={MONO}>
            <span className="text-zinc-600 font-medium">Portail Sécurisé</span>
            <span>/</span>
            <span className="text-zinc-900 font-bold truncate">{client.name}</span>
            <span className="text-zinc-400 hidden sm:inline">
              ({client.plan || 'Formule Partenaire 360'})
            </span>
          </div>
        </div>

        {/* Right: Security & Ops Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-semibold" style={MONO}>
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Espace Certifié SSL</span>
          </span>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-600 font-mono bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded" style={MONO}>
            <User className="w-3 h-3 text-zinc-400" />
            <span>
              Responsable : <strong>{client.account_manager_name || 'Maxime (Ops)'}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content Container (Max Density) ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 space-y-3">
        {/* ── 2. Ruban Métrique & Progression Monolithique (h-14 / 56px) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-x divide-zinc-100 shadow-2xs overflow-hidden">
          {/* Metric 1: Avancement Global */}
          <div className="px-3.5 py-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Avancement Global
              </span>
              <span className="text-[10px] font-bold font-mono text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 rounded" style={MONO}>
                Sprint Q3
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
                {projectProgressPct}%
              </span>
              <span className="text-[11px] text-emerald-700 font-mono font-medium" style={MONO}>
                {completedMilestones}/{totalMilestones || 4} jalons
              </span>
            </div>
          </div>

          {/* Metric 2: Livrables à Valider */}
          <div className="px-3.5 py-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Livrables à Valider
              </span>
              {pendingDeliverablesCount > 0 ? (
                <span className="text-[10px] font-bold font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded" style={MONO}>
                  Action requise
                </span>
              ) : (
                <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded" style={MONO}>
                  À jour
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span
                className={cn(
                  'text-lg font-bold font-mono tabular-nums',
                  pendingDeliverablesCount > 0 ? 'text-amber-700' : 'text-zinc-900'
                )}
                style={MONO}
              >
                {pendingDeliverablesCount < 10 ? `0${pendingDeliverablesCount}` : pendingDeliverablesCount} en attente
              </span>
              <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
                Total : {deliverables.length}
              </span>
            </div>
          </div>

          {/* Metric 3: Score de Santé Compte */}
          <div className="px-3.5 py-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Score de Santé Compte
              </span>
              <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded" style={MONO}>
                Optimal
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono tabular-nums text-emerald-600" style={MONO}>
                {client.health_score || 98}/100
              </span>
              <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
                QA &amp; Vélocité
              </span>
            </div>
          </div>

          {/* Metric 4: Livraison Finale Prévue */}
          <div className="px-3.5 py-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Livraison Finale Prévue
              </span>
              <span className="text-[10px] font-bold font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded" style={MONO}>
                Jalon Final
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
                {mainProject?.target_end_date
                  ? new Date(mainProject.target_end_date).toISOString().slice(0, 10)
                  : '2026-09-29'}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
                Phase Recette
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. Navigation Segmentée (h-8) ── */}
        <div className="h-8 bg-zinc-100 p-0.5 rounded-md flex items-center gap-1 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={cn(
              'px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1',
              activeTab === 'overview'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            <Layers className="w-3 h-3 text-zinc-500" />
            <span>Vue d'Ensemble &amp; Progrès</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deliverables')}
            className={cn(
              'px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1.5',
              activeTab === 'deliverables'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            <CheckSquare className="w-3 h-3 text-zinc-500" />
            <span>Livrables &amp; Approbation</span>
            {pendingDeliverablesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold font-mono flex items-center justify-center" style={MONO}>
                {pendingDeliverablesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={cn(
              'px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1',
              activeTab === 'invoices'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            <Receipt className="w-3 h-3 text-zinc-500" />
            <span>Factures &amp; Règlements</span>
            <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
              ({invoices.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roi')}
            className={cn(
              'px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1',
              activeTab === 'roi'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            <TrendingUp className="w-3 h-3 text-zinc-500" />
            <span>Performance &amp; ROI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={cn(
              'px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1',
              activeTab === 'studio'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Studio &amp; Services</span>
            <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
              ({STUDIO_PACKAGES_CATALOG.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={cn(
              'px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1',
              activeTab === 'messages'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            <MessageSquare className="w-3 h-3 text-zinc-500" />
            <span>Support &amp; Demandes</span>
          </button>
        </div>

        {/* ── 4. Main Console 2-Columns (65% / 35%) : Tab 1 Overview ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            {/* Colonne Gauche (65% - 8 cols on lg) : Pipeline de Production & Protocole QA */}
            <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-lg shadow-2xs divide-y divide-zinc-100 overflow-hidden">
              {/* Linear Stepper Compact (h-10) */}
              <div className="h-10 px-3 bg-zinc-50/60 border-b border-zinc-100 grid grid-cols-4 items-center text-xs">
                {/* Step 1 */}
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-zinc-900 truncate block text-[11px]">
                      1. Audit Stratégique
                    </span>
                    <span className="font-mono text-[9px] text-zinc-400 block" style={MONO}>
                      Complété 08-09
                    </span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-semibold text-zinc-900 truncate block text-[11px]">
                      2. Design System
                    </span>
                    <span className="font-mono text-[9px] text-zinc-400 block" style={MONO}>
                      Complété 08-24
                    </span>
                  </div>
                </div>

                {/* Step 3 (In Progress) */}
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-blue-900 truncate block text-[11px]">
                      3. Dév Next.js &amp; POS
                    </span>
                    <span className="font-mono text-[9px] text-blue-600 block" style={MONO}>
                      En cours • 09-14
                    </span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium text-zinc-500 truncate block text-[11px]">
                      4. Recette 20-pts QA
                    </span>
                    <span className="font-mono text-[9px] text-zinc-400 block" style={MONO}>
                      Échéance 09-29
                    </span>
                  </div>
                </div>
              </div>

              {/* Protocole d'Assurance Qualité & Lancement (Checklist 32px) */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Protocole d'Assurance Qualité &amp; Critères d'Acceptation
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold" style={MONO}>
                    Certifié 100%
                  </span>
                </div>

                <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-md overflow-hidden">
                  {[
                    {
                      id: 'qa-1',
                      title: 'Sécurisation SSL & Intégrité RLS Supabase',
                      category: 'Sécurité',
                      status: 'Complété',
                      isCompleted: true,
                    },
                    {
                      id: 'qa-2',
                      title: 'Performance Web Vitals (< 150ms TTFB & 100% LCP)',
                      category: 'Performance',
                      status: 'Complété',
                      isCompleted: true,
                    },
                    {
                      id: 'qa-3',
                      title: 'Tunnel de Commande QR Code Flow & Intégration POS',
                      category: 'Automatisation',
                      status: 'En validation',
                      isCompleted: false,
                    },
                    {
                      id: 'qa-4',
                      title: 'Conformité Responsive 1080p & Mobile Safari/Chrome',
                      category: 'Design & UX',
                      status: 'En cours',
                      isCompleted: false,
                    },
                  ].map((check) => (
                    <div
                      key={check.id}
                      className="h-8 px-3 flex items-center justify-between text-xs hover:bg-zinc-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        {check.isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        )}
                        <span className={cn('truncate', check.isCompleted ? 'text-zinc-900 font-medium' : 'text-zinc-600')}>
                          {check.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200" style={MONO}>
                          {check.category}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-mono px-1.5 py-0.2 rounded border',
                            check.isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          )}
                          style={MONO}
                        >
                          {check.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spécifications & Cadre Contractuel Partenaire */}
              <div className="p-3.5 space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
                  Livrables Inclus dans Votre Accord Partenaire
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-md border border-zinc-200 bg-zinc-50/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900">Production Média &amp; Vidéos 4K</span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold" style={MONO}>
                        8 / mois
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-tight">
                      Captation cinéma sur place, montage vertical dynamique 9:16 avec sous-titres animés.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-md border border-zinc-200 bg-zinc-50/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900">Plateforme Flow &amp; Commandes Directes</span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold" style={MONO}>
                        Illimité
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-tight">
                      Zéro commission tierce, menu interactif mobile et encaissement direct Stripe.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne Droite (35% - 4 cols on lg) : Action Center & Stripe Billing Card */}
            <div className="lg:col-span-4 space-y-3 sticky top-14">
              {/* Stripe Monthly Subscription Module */}
              <div className="p-3.5 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white rounded-lg border border-emerald-500/30 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                      Mon Forfait Mensuel
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" style={MONO}>
                    Stripe Sécurisé
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono tracking-tight" style={MONO}>
                      {(client?.mrr || 500).toLocaleString('fr-CA')} $ CAD
                    </span>
                    <span className="text-xs text-zinc-400">/ mois</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1 leading-snug">
                    Accès complet à la plateforme Flow, maintenance continue et support dédié garanti.
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <button
                    onClick={handleStartStripeSubscription}
                    disabled={isStartingCheckout}
                    className="w-full h-8 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    {isStartingCheckout ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>Payer / Activer l’abonnement en 1-clic</span>
                  </button>

                  <button
                    onClick={handleOpenCustomerPortal}
                    disabled={isOpeningPortal}
                    className="w-full h-7 bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                  >
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                    <span>Gérer ma carte bancaire &amp; reçus</span>
                  </button>
                </div>
              </div>

              {/* Action Center Prioritaire Ancré */}
              <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs divide-y divide-zinc-100 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Action Requise Client
                  </span>
                {priorityDeliverable ? (
                  <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold" style={MONO}>
                    Prioritaire
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold" style={MONO}>
                    À jour
                  </span>
                )}
              </div>

              {/* Priority Deliverable Card or All Validated State */}
              {priorityDeliverable ? (
                <div className="pt-2 space-y-2.5">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 block" style={MONO}>
                      Déposé le {new Date(priorityDeliverable.created_at).toISOString().slice(0, 10)}
                    </span>
                    <h3 className="text-xs font-bold text-zinc-900 mt-0.5 leading-snug">
                      {priorityDeliverable.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">
                      {priorityDeliverable.description || 'Livrable prêt pour votre validation finale avant mise en ligne.'}
                    </p>
                  </div>

                  {/* Preview Button */}
                  {priorityDeliverable.asset_url && (
                    <a
                      href={priorityDeliverable.asset_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-7 px-2.5 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors w-full"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Prévisualiser le livrable</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                    </a>
                  )}

                  {/* Inline Revision Input Form */}
                  {showRevisionInput ? (
                    <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-md space-y-2 animate-in fade-in duration-100">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          Vos demandes de retouches :
                        </label>
                        <button
                          onClick={() => setShowRevisionInput(false)}
                          className="text-[10px] text-zinc-400 hover:text-zinc-700"
                        >
                          Annuler (Échap)
                        </button>
                      </div>
                      <textarea
                        value={inlineRevisionNotes}
                        onChange={(e) => setInlineRevisionNotes(e.target.value)}
                        placeholder="Précisez les ajustements souhaités (couleurs, texte, cadrage)..."
                        rows={3}
                        className="w-full p-2 text-xs bg-white border border-zinc-200 rounded text-zinc-900 focus:outline-none focus:border-amber-500 resize-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRequestRevisionSubmit(priorityDeliverable.id)}
                        disabled={submittingAction === priorityDeliverable.id || !inlineRevisionNotes.trim()}
                        className="w-full h-7 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        {submittingAction === priorityDeliverable.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span>Envoyer les retours (⌘+↵)</span>
                      </button>
                    </div>
                  ) : (
                    /* Approval / Revision Button Group */
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={() => handleApproveDeliverable(priorityDeliverable.id)}
                        disabled={submittingAction === priorityDeliverable.id}
                        className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        title="Valider et approuver ce livrable (⌘+↵)"
                      >
                        {submittingAction === priorityDeliverable.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Valider &amp; Signer le livrable (⌘+↵)</span>
                      </button>

                      <button
                        onClick={() => setShowRevisionInput(true)}
                        className="w-full h-7 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Rejeter / Demander révision</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* All Clear State */
                <div className="pt-4 pb-2 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-900">
                      Tous les livrables sont validés
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Aucune action en attente. Votre équipe Minerva poursuit la phase technique.
                    </p>
                  </div>
                </div>
              )}

              {/* Direct Agency Assistance Footnote */}
              <div className="pt-2 text-[11px] text-zinc-500 space-y-1 font-mono" style={MONO}>
                <div className="flex items-center justify-between">
                  <span>Assistance :</span>
                  <a href={`mailto:${agencyContact?.supportEmail || 'support@minerva.ca'}`} className="text-emerald-700 hover:underline">
                    {agencyContact?.supportEmail || 'support@minerva.ca'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* ── Tab 2: Livrables & Approbation ── */}
        {activeTab === 'deliverables' && (
          <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs divide-y divide-zinc-100 overflow-hidden">
            <div className="h-9 px-3.5 bg-zinc-50/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-900">
                Livrables &amp; Fichiers de Production ({deliverables.length})
              </span>
              <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                Validation en 1-clic
              </span>
            </div>

            <div className="grid grid-cols-12 h-7 px-3.5 bg-zinc-50/30 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 items-center">
              <span className="col-span-5">Titre du livrable</span>
              <span className="col-span-2">Format / Type</span>
              <span className="col-span-2">Statut</span>
              <span className="col-span-3 text-right">Actions</span>
            </div>

            <div className="divide-y divide-zinc-100">
              {deliverables.length === 0 ? (
                <div className="h-16 px-3.5 flex items-center justify-center text-xs text-zinc-400 font-mono" style={MONO}>
                  Aucun livrable déposé pour le moment.
                </div>
              ) : (
                deliverables.map((del) => {
                  const isApproved = del.status === 'approved';
                  const isRevision = del.status === 'revision_requested';
                  const isPending = del.status === 'pending_review';

                  return (
                    <div
                      key={del.id}
                      className="grid grid-cols-12 h-10 px-3.5 items-center text-xs text-zinc-800 hover:bg-zinc-50/60 transition-colors"
                    >
                      <div className="col-span-5 font-semibold text-zinc-900 truncate pr-2">
                        {del.title}
                      </div>

                      <div className="col-span-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 capitalize" style={MONO}>
                          {del.type}
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span
                          className={cn(
                            'text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase tracking-wider',
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isRevision
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                          )}
                          style={MONO}
                        >
                          {isApproved ? 'Validé' : isRevision ? 'Retouches' : 'En attente'}
                        </span>
                      </div>

                      <div className="col-span-3 flex items-center justify-end gap-1.5">
                        {del.asset_url && (
                          <a
                            href={del.asset_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-6 px-2 text-[11px] rounded border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 flex items-center gap-1"
                          >
                            <Eye className="w-2.5 h-2.5" />
                            <span>Voir</span>
                          </a>
                        )}

                        {isPending && (
                          <button
                            onClick={() => handleApproveDeliverable(del.id)}
                            disabled={submittingAction === del.id}
                            className="h-6 px-2 text-[11px] font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-2.5 h-2.5" />
                            <span>Valider</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── Tab 3: Factures & Règlements ── */}
        {activeTab === 'invoices' && (
          <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs divide-y divide-zinc-100 overflow-hidden">
            <div className="h-9 px-3.5 bg-zinc-50/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-900">
                Factures &amp; Documents Comptables ({invoices.length})
              </span>
              <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                TPS/TVQ Québec conformes
              </span>
            </div>

            <div className="grid grid-cols-12 h-7 px-3.5 bg-zinc-50/30 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 items-center">
              <span className="col-span-3">Numéro Facture</span>
              <span className="col-span-3">Montant Total</span>
              <span className="col-span-3">Date d'émission</span>
              <span className="col-span-2">Statut</span>
              <span className="col-span-1 text-right">Lien</span>
            </div>

            <div className="divide-y divide-zinc-100">
              {invoices.length === 0 ? (
                <div className="h-16 px-3.5 flex items-center justify-center text-xs text-zinc-400 font-mono" style={MONO}>
                  Aucune facture disponible.
                </div>
              ) : (
                invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="grid grid-cols-12 h-9 px-3.5 items-center text-xs text-zinc-800 hover:bg-zinc-50/60 transition-colors"
                  >
                    <div className="col-span-3 font-mono text-zinc-900 font-semibold text-[11px]" style={MONO}>
                      {inv.invoice_number}
                    </div>

                    <div className="col-span-3 font-mono text-zinc-900 font-bold tabular-nums text-[11px]" style={MONO}>
                      {(inv.total_cad || 0).toLocaleString('fr-CA')} $ CAD
                    </div>

                    <div className="col-span-3 font-mono text-zinc-500 tabular-nums text-[11px]" style={MONO}>
                      {inv.created_at ? new Date(inv.created_at).toISOString().slice(0, 10) : '—'}
                    </div>

                    <div className="col-span-2">
                      <span
                        className={cn(
                          'text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase',
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}
                        style={MONO}
                      >
                        {inv.status === 'paid' ? 'Acquittée' : inv.status}
                      </span>
                    </div>

                    <div className="col-span-1 flex items-center justify-end">
                      {inv.stripe_hosted_invoice_url || inv.stripe_payment_link_url ? (
                        <a
                          href={inv.stripe_hosted_invoice_url || inv.stripe_payment_link_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-400 hover:text-zinc-900"
                          title="Consulter le reçu Stripe"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-zinc-300 text-[10px]">—</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Tab 4: Performance & ROI ── */}
        {activeTab === 'roi' && (
          <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs divide-y divide-zinc-100 overflow-hidden">
            <div className="h-9 px-3.5 bg-zinc-50/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-900">
                Suivi du Rendement &amp; Chiffre d'Affaires Direct Généré
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded" style={MONO}>
                Économie commissions : ~3 400 $ CAD
              </span>
            </div>

            <div className="grid grid-cols-12 h-7 px-3.5 bg-zinc-50/30 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 items-center">
              <span className="col-span-3">Période</span>
              <span className="col-span-3">Revenus Directs</span>
              <span className="col-span-2">Commandes</span>
              <span className="col-span-2">Dépenses Ads</span>
              <span className="col-span-2 text-right">Multiplicateur ROI</span>
            </div>

            <div className="divide-y divide-zinc-100">
              {roiMetrics.length === 0 ? (
                <div className="h-16 px-3.5 flex items-center justify-center text-xs text-zinc-400 font-mono" style={MONO}>
                  Calcul des métriques ROI en cours pour la période active.
                </div>
              ) : (
                roiMetrics.map((r) => (
                  <div
                    key={r.id}
                    className="grid grid-cols-12 h-9 px-3.5 items-center text-xs text-zinc-800 font-mono"
                    style={MONO}
                  >
                    <div className="col-span-3 font-semibold text-zinc-900">{r.month}</div>
                    <div className="col-span-3 text-emerald-700 font-bold">{r.revenue_generated_cad.toLocaleString('fr-CA')} $</div>
                    <div className="col-span-2 text-zinc-600">{r.conversions}</div>
                    <div className="col-span-2 text-zinc-600">{r.ad_spend_cad} $</div>
                    <div className="col-span-2 text-right font-bold text-zinc-900">{r.roi_percentage}%</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Tab 5: Studio & Services ── */}
        {activeTab === 'studio' && (
          <div className="space-y-3">
            <div className="h-9 px-3.5 bg-white border border-zinc-200 rounded-lg shadow-2xs flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-900">
                Catalogue Studio &amp; Services Additionnels
              </span>
              <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                Activation directe en 1-clic
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {STUDIO_PACKAGES_CATALOG.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between space-y-2.5"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider" style={MONO}>
                        {pkg.category}
                      </span>
                      {pkg.is_popular && (
                        <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-bold" style={MONO}>
                          Recommandé
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900">{pkg.title}</h4>
                    <p className="text-[11px] text-zinc-500 leading-tight line-clamp-2">
                      {pkg.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-sm font-bold font-mono text-zinc-900 tabular-nums" style={MONO}>
                      {pkg.price_cad} $ CAD
                    </span>
                    <button
                      onClick={() => handleOrderStudioPackage(pkg)}
                      disabled={submittingAction === pkg.id}
                      className="h-6 px-2 text-[11px] font-semibold rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {submittingAction === pkg.id ? 'Activation...' : 'Activer 1-Clic'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab 6: Support & Demandes ── */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-lg shadow-2xs divide-y divide-zinc-100 overflow-hidden">
              <div className="h-9 px-3.5 bg-zinc-50/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-900">
                  Historique des Échanges &amp; Demandes ({messages.length})
                </span>
                <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                  Réponse garantie sous 2h ouvrées
                </span>
              </div>

              <div className="divide-y divide-zinc-100 p-2 space-y-2">
                {messages.length === 0 ? (
                  <div className="h-16 flex items-center justify-center text-xs text-zinc-400 font-mono" style={MONO}>
                    Aucune demande ouverte. Utilisez le formulaire pour contacter l'équipe.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="p-2.5 rounded bg-zinc-50/60 border border-zinc-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-900">{m.subject || 'Demande'}</span>
                        <span className="font-mono text-[10px] text-zinc-400" style={MONO}>
                          {new Date(m.created_at).toISOString().slice(0, 10)}
                        </span>
                      </div>
                      <p className="text-zinc-700 text-[11px] leading-relaxed">{m.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs space-y-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                Nouvelle Demande d'Assistance
              </span>
              <form onSubmit={handleSendMessage} className="space-y-2 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-zinc-500 mb-1">
                    Objet de la demande
                  </label>
                  <input
                    type="text"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    placeholder="Ex: Demande de modification sur les menus QR..."
                    className="w-full h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-zinc-500 mb-1">
                    Détail du message
                  </label>
                  <textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Décrivez votre besoin avec précision..."
                    rows={4}
                    className="w-full p-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingAction === 'message_send' || !messageContent.trim()}
                  className="w-full h-8 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold text-xs rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  {submittingAction === 'message_send' ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  <span>Envoyer à votre responsable</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
