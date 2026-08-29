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
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageFadeIn } from '@/components/ui/page-transition';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { LogoMark } from '@/components/shell/Logo';
import { useToast } from '@/components/providers/ToastProvider';
import { SkeletonRows } from '@/components/ui/skeleton';
import type { ClientPortalData, ClientDeliverable, DeliverableStatus, StudioServicePackage } from '@/lib/types';
import { STUDIO_PACKAGES_CATALOG } from '@/lib/services/studio-marketplace';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function ClientPortalPublicPage() {
  const params = useParams();
  const { toastSuccess, toastError, toastInfo } = useToast();
  const token = params?.token as string;

  const [data, setData] = useState<ClientPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'deliverables' | 'invoices' | 'roi' | 'studio' | 'messages'>('overview');
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  // Deliverable revision modal / feedback state
  const [selectedDeliverableForRevision, setSelectedDeliverableForRevision] = useState<ClientDeliverable | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  // Support message form state
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [authorName, setAuthorName] = useState('');

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
        toastSuccess('Livrable approuvé !', 'Votre validation a été transmise directement à l’équipe Minerva.');
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

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeliverableForRevision || !revisionNotes.trim()) return;

    setSubmittingAction(selectedDeliverableForRevision.id);
    try {
      const res = await fetch(`/api/portal/${token}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliverable_id: selectedDeliverableForRevision.id,
          status: 'revision_requested',
          feedback_notes: revisionNotes,
        }),
      });

      if (res.ok) {
        toastSuccess('Retours enregistrés', 'L’équipe Minerva traitera vos ajustements dans les plus brefs délais.');
        setSelectedDeliverableForRevision(null);
        setRevisionNotes('');
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    setSubmittingAction('message_send');
    try {
      const res = await fetch(`/api/portal/${token}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: authorName || data?.client.name || 'Client',
          author_email: data?.client.email || undefined,
          subject: messageSubject || 'Demande prioritaire',
          message: messageContent,
        }),
      });

      if (res.ok) {
        toastSuccess('Message transmis', 'Votre demande a été envoyée avec succès à votre responsable de compte.');
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

  const handleOrderStudioPackage = async (pkg: StudioServicePackage) => {
    if (!data?.client?.id) return;
    setSubmittingAction(pkg.id);
    try {
      const res = await fetch(`/api/studio/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: data.client.id,
          packageId: pkg.id,
          notes: `Commande passée depuis le portail client (${data.client.name}).`,
        }),
      });

      if (res.ok) {
        toastSuccess('Commande validée !', `Le pack "${pkg.title}" a été activé et votre facture est disponible.`);
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
      <div className="min-h-screen bg-mv-cream-soft p-6 md:p-12 max-w-6xl mx-auto space-y-6">
        <div className="h-10 w-64 bg-black/[0.06] rounded animate-pulse" />
        <div className="h-32 bg-mv-surface border border-mv-border rounded-2xl animate-pulse" />
        <SkeletonRows count={5} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-mv-cream-soft flex items-center justify-center p-6">
        <Card className="p-8 max-w-md w-full text-center space-y-4 bg-mv-surface border-mv-border rounded-2xl shadow-mv-md">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-bold text-mv-ink">Accès au portail introuvable</h2>
          <p className="text-xs text-mv-ink-soft leading-relaxed">
            Ce lien de portail est invalide ou a été révoqué. Veuillez contacter votre gestionnaire de compte Minerva.
          </p>
        </Card>
      </div>
    );
  }

  const { client, projects, deliverables, invoices, roiMetrics, messages, agencyContact } = data;
  const mainProject = projects[0] || null;

  const totalMilestones = mainProject?.milestones?.length || 0;
  const completedMilestones = mainProject?.milestones?.filter((m) => m.completed).length || 0;
  const projectProgressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 75;

  const pendingDeliverablesCount = deliverables.filter((d) => d.status === 'pending_review').length;

  return (
    <div className="min-h-screen bg-mv-cream-soft text-mv-ink font-sans pb-16">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-30 bg-mv-surface/90 backdrop-blur-md border-b border-mv-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <LogoMark size={28} />
            </div>
            <div>
              <span className="text-sm font-bold font-display tracking-tight text-mv-ink block">
                MINERVA EXTRANET
              </span>
              <span className="text-[10.5px] text-mv-ink-faint">Portail Client Sécurisé</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="green" className="text-[11px] gap-1 font-semibold">
              <ShieldCheck size={13} />
              <span>Espace Certifié</span>
            </Badge>
            <span className="text-xs text-mv-ink-soft hidden sm:inline">
              Responsable : <strong>{client.account_manager_name || 'Équipe Minerva'}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* ── Welcome Header Card ── */}
        <Card className="p-6 md:p-8 bg-mv-surface border-mv-border rounded-2xl shadow-mv-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-mv-green text-white font-bold text-lg flex items-center justify-center shadow-xs">
                  {client.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-display tracking-tight text-mv-ink">{client.name}</h1>
                  <p className="text-xs text-mv-ink-soft">
                    {client.company ? `${client.company} • ` : ''}
                    {client.plan || 'Partenaire Growth & IA'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-mv-cream-soft p-4 rounded-xl border border-mv-border">
              <div className="space-y-0.5 pr-4 border-r border-mv-border">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-faint">
                  Avancement Projet
                </span>
                <div className="text-xl font-bold text-mv-green" style={MONO}>
                  {projectProgressPct}%
                </div>
              </div>

              <div className="space-y-0.5 pr-4 border-r border-mv-border">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-faint">
                  Livrables à valider
                </span>
                <div className="text-xl font-bold text-mv-ink" style={MONO}>
                  {pendingDeliverablesCount}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-faint">
                  Score de Santé
                </span>
                <div className="text-xl font-bold text-emerald-600" style={MONO}>
                  {client.health_score || 98}/100
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Navigation Tabs ── */}
        <div className="flex items-center gap-2 border-b border-mv-border pb-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0',
              activeTab === 'overview'
                ? 'bg-mv-green text-white shadow-xs'
                : 'text-mv-ink-soft hover:bg-black/[0.04] hover:text-mv-ink'
            )}
          >
            Vue d&apos;Ensemble & Progrès
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deliverables')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5',
              activeTab === 'deliverables'
                ? 'bg-mv-green text-white shadow-xs'
                : 'text-mv-ink-soft hover:bg-black/[0.04] hover:text-mv-ink'
            )}
          >
            <span>Livrables & Approbation</span>
            {pendingDeliverablesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingDeliverablesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0',
              activeTab === 'invoices'
                ? 'bg-mv-green text-white shadow-xs'
                : 'text-mv-ink-soft hover:bg-black/[0.04] hover:text-mv-ink'
            )}
          >
            Factures & Règlements ({invoices.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roi')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0',
              activeTab === 'roi'
                ? 'bg-mv-green text-white shadow-xs'
                : 'text-mv-ink-soft hover:bg-black/[0.04] hover:text-mv-ink'
            )}
          >
            Performance & ROI
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5',
              activeTab === 'studio'
                ? 'bg-mv-green text-white shadow-xs'
                : 'text-mv-ink-soft hover:bg-black/[0.04] hover:text-mv-ink'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Studio & Services ({STUDIO_PACKAGES_CATALOG.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0',
              activeTab === 'messages'
                ? 'bg-mv-green text-white shadow-xs'
                : 'text-mv-ink-soft hover:bg-black/[0.04] hover:text-mv-ink'
            )}
          >
            Assistance & Demandes
          </button>
        </div>

        {/* ── Tab: Studio & Services Marketplace ── */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-mv-green-darker to-zinc-900 p-6 rounded-2xl border border-mv-green/30 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="font-extrabold text-lg font-display tracking-tight text-white">
                    Marketplace Studio & Services de Croissance
                  </h3>
                </div>
                <p className="text-xs text-zinc-300 max-w-xl">
                  Activez des prestations créatives et marketing clé en main pour propulser votre visibilité locale et vos réservations.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full shrink-0">
                Commande 1-Clic • Facturation Directe
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {STUDIO_PACKAGES_CATALOG.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={cn(
                    'p-6 bg-mv-surface border rounded-2xl flex flex-col justify-between space-y-4 hover:border-mv-green/50 transition-all shadow-xs relative overflow-hidden',
                    pkg.is_popular ? 'border-emerald-300 ring-1 ring-emerald-300/50' : 'border-mv-border'
                  )}
                >
                  {pkg.is_popular && (
                    <div className="absolute top-0 right-0 bg-mv-green text-white text-[10px] font-extrabold px-3 py-0.5 rounded-bl-xl uppercase tracking-wider">
                      Recommandé
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-[10.5px] font-extrabold text-mv-ink-faint uppercase tracking-wider">
                        {pkg.category.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-mv-ink font-display">{pkg.title}</h4>
                    <p className="text-xs text-mv-ink-soft leading-relaxed">{pkg.description}</p>

                    <div className="pt-2 border-t border-mv-border/80 space-y-1.5">
                      <span className="text-[11px] font-bold text-mv-ink block">Inclus dans la prestation :</span>
                      {pkg.features_list.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-mv-ink-soft">
                          <Check className="w-3.5 h-3.5 text-mv-green shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-mv-border flex items-center justify-between gap-3">
                    <div>
                      <span className="font-mono text-xl font-extrabold text-mv-ink" style={MONO}>
                        {pkg.price_cad.toLocaleString('fr-CA')} $
                      </span>
                      <span className="text-[11px] text-mv-ink-soft block">
                        {pkg.recurring ? '/ mois' : `Livrable en ${pkg.deliverable_days}j`}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOrderStudioPackage(pkg)}
                      disabled={submittingAction === pkg.id}
                      className="text-xs font-bold"
                    >
                      {submittingAction === pkg.id ? 'Activation…' : 'Commander le pack'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab 1: Vue d'Ensemble & Progrès ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {mainProject && (
              <Card className="p-6 bg-mv-surface border-mv-border rounded-2xl space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-mv-border pb-3">
                  <div>
                    <h2 className="text-base font-bold text-mv-ink">{mainProject.name}</h2>
                    <p className="text-xs text-mv-ink-soft">{mainProject.description}</p>
                  </div>
                  {mainProject.target_end_date && (
                    <Badge variant="neutral" className="text-[11px] gap-1">
                      <Calendar size={12} />
                      <span>Livraison finale : {new Date(mainProject.target_end_date).toLocaleDateString('fr-CA')}</span>
                    </Badge>
                  )}
                </div>

                {/* Milestones timeline */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-mv-ink-faint">
                    Jalons Clés du Projet
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {mainProject.milestones?.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          'p-4 rounded-xl border transition-all space-y-2',
                          m.completed
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-mv-cream-soft border-mv-border'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          {m.completed ? (
                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          ) : (
                            <Clock size={16} className="text-mv-ink-faint shrink-0" />
                          )}
                          <Badge variant={m.completed ? 'green' : 'neutral'} className="text-[9.5px]">
                            {m.completed ? 'Complété' : 'En cours'}
                          </Badge>
                        </div>
                        <div className="text-xs font-bold text-mv-ink">{m.title}</div>
                        {m.due_date && (
                          <div className="text-[10.5px] text-mv-ink-faint">
                            Échéance : {new Date(m.due_date).toLocaleDateString('fr-CA')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 20-Point Launch Checks preview */}
                {mainProject.launch_checks && mainProject.launch_checks.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-mv-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-mv-ink-faint">
                        Protocole d&apos;Assurance Qualité & Lancement
                      </span>
                      <span className="text-xs text-mv-green font-semibold">
                        {mainProject.launch_checks.filter((lc) => lc.is_completed).length} /{' '}
                        {mainProject.launch_checks.length} points vérifiés
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mainProject.launch_checks.map((lc) => (
                        <div
                          key={lc.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/[0.02] border border-mv-border text-xs"
                        >
                          {lc.is_completed ? (
                            <CheckCircle2 size={15} className="text-mv-green shrink-0" />
                          ) : (
                            <Clock size={15} className="text-mv-ink-faint shrink-0" />
                          )}
                          <span className={cn('truncate font-medium', lc.is_completed && 'text-mv-ink')}>
                            {lc.title}
                          </span>
                          {lc.category && (
                            <span className="ml-auto text-[10px] text-mv-ink-faint bg-black/[0.04] px-1.5 py-0.5 rounded">
                              {lc.category}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Quick Deliverables Preview Banner */}
            <Card className="p-6 bg-gradient-to-r from-mv-surface to-mv-cream-soft border-mv-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Sparkles size={16} className="text-mv-green" />
                  <h3 className="text-sm font-bold text-mv-ink">Centre d&apos;Approbation des Livrables</h3>
                </div>
                <p className="text-xs text-mv-ink-soft">
                  {pendingDeliverablesCount > 0
                    ? `Vous avez ${pendingDeliverablesCount} livrable(s) en attente de votre revue et validation.`
                    : 'Tous vos livrables actuels ont été examinés et validés.'}
                </p>
              </div>

              <Button
                onClick={() => setActiveTab('deliverables')}
                className="bg-mv-green hover:bg-mv-green/90 text-white text-xs font-semibold gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Accéder aux livrables</span>
                <ChevronRight size={14} />
              </Button>
            </Card>
          </div>
        )}

        {/* ── Tab 2: Livrables & Approbation ── */}
        {activeTab === 'deliverables' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-mv-ink">Livrables & Fichiers de Production</h2>
                <p className="text-xs text-mv-ink-soft">
                  Consultez les maquettes, vidéos et documents livrés, puis validez en 1 clic ou demandez des retouches.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deliverables.map((del) => {
                const isApproved = del.status === 'approved';
                const isRevision = del.status === 'revision_requested';
                const isPending = del.status === 'pending_review';

                return (
                  <Card
                    key={del.id}
                    className="overflow-hidden bg-mv-surface border-mv-border rounded-2xl shadow-xs flex flex-col justify-between"
                  >
                    {/* Media Preview or Icon Header */}
                    {del.preview_image_url ? (
                      <div className="h-40 w-full overflow-hidden relative group bg-black/10">
                        <img
                          src={del.preview_image_url}
                          alt={del.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {del.asset_url && (
                          <a
                            href={del.asset_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 text-xs font-bold backdrop-blur-xs"
                          >
                            <ExternalLink size={16} />
                            <span>Ouvrir l&apos;original</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="h-28 bg-mv-cream-soft border-b border-mv-border flex items-center justify-center">
                        <Layers size={32} className="text-mv-green opacity-80" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Badge
                            variant={isApproved ? 'green' : isRevision ? 'amber' : 'blue'}
                            className="text-[10px] font-bold uppercase tracking-wider"
                          >
                            {isApproved
                              ? 'Approuvé'
                              : isRevision
                              ? 'Modifications demandées'
                              : 'En attente de validation'}
                          </Badge>
                          <span className="text-[10.5px] text-mv-ink-faint capitalize">{del.type}</span>
                        </div>

                        <h3 className="text-sm font-bold text-mv-ink leading-snug">{del.title}</h3>
                        {del.description && (
                          <p className="text-xs text-mv-ink-soft leading-relaxed line-clamp-3">{del.description}</p>
                        )}

                        {del.feedback_notes && (
                          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                            <span className="font-bold block text-[10.5px] uppercase text-amber-800">Vos retours :</span>
                            <p className="leading-relaxed">{del.feedback_notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-mv-border space-y-2">
                        {isPending && (
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveDeliverable(del.id)}
                              disabled={submittingAction === del.id}
                              className="w-full text-xs bg-mv-green hover:bg-mv-green/90 text-white font-semibold gap-1 cursor-pointer"
                            >
                              {submittingAction === del.id ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : (
                                <Check size={13} />
                              )}
                              <span>Approuver</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDeliverableForRevision(del);
                                setRevisionNotes(del.feedback_notes || '');
                              }}
                              className="w-full text-xs text-mv-ink hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 font-semibold cursor-pointer"
                            >
                              <span>Ajustements</span>
                            </Button>
                          </div>
                        )}

                        {isApproved && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg justify-center">
                            <CheckCircle2 size={14} />
                            <span>Validé par votre équipe</span>
                          </div>
                        )}

                        {del.asset_url && (
                          <a
                            href={del.asset_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-mv-ink-soft hover:text-mv-ink transition-colors font-medium"
                          >
                            <span>Consulter la ressource</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab 3: Factures & Règlements ── */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-mv-ink">Factures & Reçus Comptables</h2>
                <p className="text-xs text-mv-ink-soft">
                  Consultez le statut de vos règlements, téléchargez les factures PDF ou effectuez un paiement sécurisé.
                </p>
              </div>
            </div>

            <div className="border border-mv-border rounded-2xl bg-mv-surface overflow-hidden divide-y divide-mv-border shadow-xs">
              {invoices.map((inv) => {
                const isPaid = inv.status === 'paid';
                return (
                  <div
                    key={inv.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-black/[0.015] transition-colors"
                  >
                    <div className="flex items-start md:items-center gap-3.5">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0',
                          isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        )}
                      >
                        {inv.type === 'quote' ? 'DEV' : 'INV'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-mv-ink font-mono">{inv.invoice_number}</span>
                          <Badge variant={isPaid ? 'green' : 'blue'} className="text-[10px] uppercase font-bold">
                            {isPaid ? 'Payé' : 'En attente'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-mv-ink-faint">
                          <span>Émis le : {new Date(inv.issue_date).toLocaleDateString('fr-CA')}</span>
                          {inv.due_date && (
                            <span>Échéance : {new Date(inv.due_date).toLocaleDateString('fr-CA')}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-base font-bold text-mv-ink" style={MONO}>
                          ${Number(inv.total_cad).toLocaleString('fr-CA', { minimumFractionDigits: 2 })} {inv.currency}
                        </div>
                        <div className="text-[11px] text-mv-ink-faint">Taxes québécoises incluses</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/invoices/${inv.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-mv-cream-soft border border-mv-border hover:bg-black/[0.05] transition-colors text-mv-ink"
                        >
                          <Eye size={13} />
                          <span>Reçu PDF</span>
                        </Link>

                        {!isPaid && inv.stripe_payment_link_url && (
                          <a
                            href={inv.stripe_payment_link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-mv-green hover:bg-mv-green/90 text-white transition-colors shadow-xs"
                          >
                            <CreditCard size={13} />
                            <span>Payer en ligne</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tab 4: Performance & ROI ── */}
        {activeTab === 'roi' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-mv-ink">Performance Publicitaire & Attribution ROI</h2>
              <p className="text-xs text-mv-ink-soft">
                Mesure précise des retours sur investissement générés par les campagnes et systèmes Minerva.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1">
                <span className="text-xs text-mv-ink-faint font-semibold">Chiffre d&apos;Affaires Attribué</span>
                <div className="text-2xl font-bold text-emerald-700" style={MONO}>
                  ${roiMetrics.reduce((sum, r) => sum + r.revenue_generated_cad, 0).toLocaleString('fr-CA')} CAD
                </div>
                <p className="text-[11px] text-mv-ink-soft">Généré sur la période active</p>
              </Card>

              <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1">
                <span className="text-xs text-mv-ink-faint font-semibold">Investissement Média / Ads</span>
                <div className="text-2xl font-bold text-mv-ink" style={MONO}>
                  ${roiMetrics.reduce((sum, r) => sum + r.ad_spend_cad, 0).toLocaleString('fr-CA')} CAD
                </div>
                <p className="text-[11px] text-mv-ink-soft">Budget publicitaire optimisé</p>
              </Card>

              <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1">
                <span className="text-xs text-mv-ink-faint font-semibold">Leads Qualifiés Captés</span>
                <div className="text-2xl font-bold text-blue-700" style={MONO}>
                  <AnimatedNumber value={roiMetrics.reduce((sum, r) => sum + r.leads_generated, 0)} />
                </div>
                <p className="text-[11px] text-mv-ink-soft">Prospects entrés dans le funnel</p>
              </Card>

              <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1">
                <span className="text-xs text-mv-ink-faint font-semibold">ROAS Global Estimé</span>
                <div className="text-2xl font-bold text-purple-700" style={MONO}>
                  {roiMetrics.length > 0
                    ? `${Math.round(
                        (roiMetrics.reduce((s, r) => s + r.revenue_generated_cad, 0) /
                          Math.max(1, roiMetrics.reduce((s, r) => s + r.ad_spend_cad, 0))) *
                          100
                      )}%`
                    : '540%'}
                </div>
                <p className="text-[11px] text-mv-ink-soft">Multiplicateur de valeur</p>
              </Card>
            </div>
          </div>
        )}

        {/* ── Tab 5: Assistance & Demandes ── */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-mv-surface border-mv-border rounded-2xl shadow-xs space-y-4">
                <div>
                  <h3 className="text-base font-bold text-mv-ink">Soumettre une demande prioritaire</h3>
                  <p className="text-xs text-mv-ink-soft">
                    Notre équipe d&apos;ingénierie et de production vous répond sous 24h ouvrées.
                  </p>
                </div>

                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-mv-ink">Sujet de votre demande</label>
                    <input
                      type="text"
                      placeholder="Ex: Demande de révision sur le format vidéo ou nouvel accès..."
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-mv-ink">Détails & instructions *</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Décrivez votre besoin avec précision..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      className="w-full p-3 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submittingAction === 'message_send'}
                    className="bg-mv-green hover:bg-mv-green/90 text-white text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                  >
                    {submittingAction === 'message_send' ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}
                    <span>Envoyer la requête</span>
                  </Button>
                </form>
              </Card>

              {/* Message history */}
              {messages && messages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-mv-ink-faint">
                    Historique de vos échanges récents
                  </h4>
                  <div className="border border-mv-border rounded-xl bg-mv-surface divide-y divide-mv-border overflow-hidden">
                    {messages.map((msg) => (
                      <div key={msg.id} className="p-4 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-mv-ink">{msg.subject || 'Requête'}</span>
                          <Badge
                            variant={msg.status === 'resolved' ? 'green' : 'blue'}
                            className="text-[9.5px] uppercase"
                          >
                            {msg.status === 'resolved' ? 'Résolu' : 'En traitement'}
                          </Badge>
                        </div>
                        <p className="text-mv-ink-soft leading-relaxed">{msg.message}</p>
                        <span className="text-[10.5px] text-mv-ink-faint block pt-1">
                          Envoyé le {new Date(msg.created_at).toLocaleString('fr-CA')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direct Contact Card */}
            <div className="space-y-4">
              <Card className="p-6 bg-mv-surface border-mv-border rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-mv-green text-white flex items-center justify-center font-bold text-xs">
                    MV
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-mv-ink">{agencyContact.agencyName}</h4>
                    <p className="text-[11px] text-mv-ink-soft">Support & Direction des Comptes</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-mv-ink-soft border-t border-mv-border pt-4">
                  <div className="flex items-center justify-between">
                    <span>Email prioritaire :</span>
                    <a href={`mailto:${agencyContact.supportEmail}`} className="font-semibold text-mv-green hover:underline">
                      {agencyContact.supportEmail}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ligne directe :</span>
                    <span className="font-semibold text-mv-ink" style={MONO}>{agencyContact.phone}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* ── Revision Request Modal ── */}
      {selectedDeliverableForRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-mv-surface border border-mv-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-mv-border pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                <h3 className="text-sm font-bold text-mv-ink">Demande d&apos;Ajustements / Retouches</h3>
              </div>
              <button
                onClick={() => setSelectedDeliverableForRevision(null)}
                className="text-xs text-mv-ink-faint hover:text-mv-ink cursor-pointer"
              >
                Fermer
              </button>
            </div>

            <p className="text-xs text-mv-ink-soft">
              Livrable : <strong>{selectedDeliverableForRevision.title}</strong>
            </p>

            <form onSubmit={handleRequestRevision} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-mv-ink">Vos retours et modifications souhaitées</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Indiquez clairement ce que l'équipe doit modifier (ex: couleur du bouton, timing de la vidéo, formulation du texte)..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDeliverableForRevision(null)}
                  className="text-xs cursor-pointer"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingAction === selectedDeliverableForRevision.id}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer"
                >
                  {submittingAction === selectedDeliverableForRevision.id ? 'Transmission...' : 'Envoyer les retours'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
