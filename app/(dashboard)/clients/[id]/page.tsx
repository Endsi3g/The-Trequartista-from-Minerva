'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2,
  Mail,
  DollarSign,
  ExternalLink,
  FolderKanban,
  CheckSquare,
  CreditCard,
  MessageSquare,
  Phone,
  Globe,
  MapPin,
  Instagram,
  Facebook,
  Linkedin,
  Pencil,
  UploadCloud,
  Loader2,
  Receipt,
  ShieldCheck,
  Layers,
  Copy,
  Check,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Send,
  X,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Trash2,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { AreaChart } from '@/components/charts/AreaChart';
import { UserAvatar } from '@/components/ui/user-avatar';
import { TrialLifecycleTracker } from '@/components/clients/TrialLifecycleTracker';
import { useToast } from '@/components/providers/ToastProvider';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useClientChatThread } from '@/hooks/use-client-chat-thread';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import {
  fetchClients,
  fetchLeads,
  fetchProjects,
  fetchTasks,
  updateClient,
  deleteClient,
  fetchClientMrrHistory,
  logClientMrrChange,
} from '@/lib/services/supabase-data';
import { fetchInvoices } from '@/lib/services/invoicing';
import {
  fetchClientDeliverables,
  ensureClientPortalToken,
  createClientDeliverable,
} from '@/lib/services/client-portal';
import { computeClientHealthScore } from '@/lib/services/client-retention';
import { ClientHealthScoreWidget } from '@/components/clients/ClientHealthScoreWidget';
import type {
  Client,
  Lead,
  Project,
  Task,
  ClientMrrHistoryEntry,
  Invoice,
  ClientDeliverable,
} from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { toastSuccess, toastError, toastInfo } = useToast();
  const { id: currentUserId, fullName: currentUserName } = useCurrentUser();

  const [client, setClient] = useState<Client | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mrrHistory, setMrrHistory] = useState<ClientMrrHistoryEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deliverables, setDeliverables] = useState<ClientDeliverable[]>([]);
  const [portalToken, setPortalToken] = useState<string>('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPortalLink, setCopiedPortalLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Left Column Tabs: livrables | projects | invoices | mrr | trial
  const [activeTab, setActiveTab] = useState<'livrables' | 'projects' | 'invoices' | 'mrr' | 'trial'>('livrables');

  // Inline Quick Creation inside Livrables tab
  const [showAddDeliverableRow, setShowAddDeliverableRow] = useState(false);
  const [newDeliverableTitle, setNewDeliverableTitle] = useState('');
  const [newDeliverableType, setNewDeliverableType] = useState<ClientDeliverable['type']>('design');
  const [isCreatingDeliverable, setIsCreatingDeliverable] = useState(false);

  // Chat Thread in Right Column
  const { messages, send: sendReply } = useClientChatThread(
    clientId,
    currentUserId,
    currentUserName || 'Équipe Minerva',
    'team'
  );
  const [chatDraft, setChatDraft] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Co-pilotage interactive checklist state
  const [protocolChecklist, setProtocolChecklist] = useState<Record<string, boolean>>({
    monthly_review: true,
    market_watch: true,
    seo_local: false,
    new_packs: false,
  });

  // Slide-Over Drawer for Client Profile & Contacts Editing
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isSavingDrawer, setIsSavingDrawer] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Drawer Form State
  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editStatus, setEditStatus] = useState<Client['status']>('Active');
  const [editMrr, setEditMrr] = useState<number>(0);
  const [editContactName, setEditContactName] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
  const [editGoogleBusinessUrl, setEditGoogleBusinessUrl] = useState('');
  const [editInstagramUrl, setEditInstagramUrl] = useState('');
  const [editFacebookUrl, setEditFacebookUrl] = useState('');
  const [editLinkedinUrl, setEditLinkedinUrl] = useState('');

  const quickAddInputRef = useRef<HTMLInputElement>(null);

  // Fetch all client data
  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const allClients = await fetchClients();
        const target = allClients.find((c) => c.id === clientId) || null;

        if (!target) {
          if (active) {
            setClient(null);
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        if (!active) return;
        setNotFound(false);
        setClient(target);

        // Populate drawer fields
        setEditName(target.name || '');
        setEditIndustry(target.industry || '');
        setEditStatus(target.status);
        setEditMrr(target.mrr || 0);
        setEditContactName(target.contact_name || '');
        setEditContactEmail(target.contact_email || '');
        setEditContactPhone(target.contact_phone || '');
        setEditLogoUrl(target.logo_url || '');
        setEditWebsiteUrl(target.website_url || '');
        setEditGoogleBusinessUrl(target.google_business_url || '');
        setEditInstagramUrl(target.instagram_url || '');
        setEditFacebookUrl(target.facebook_url || '');
        setEditLinkedinUrl(target.linkedin_url || '');

        const [leadsData, projectsData, tasksData, mrrData, invoicesData, deliverablesData, tokenStr] =
          await Promise.all([
            fetchLeads(target.id),
            fetchProjects(),
            fetchTasks(),
            fetchClientMrrHistory(target.id),
            fetchInvoices({ clientId: target.id }),
            fetchClientDeliverables(target.id),
            ensureClientPortalToken(target.id),
          ]);

        if (!active) return;
        setLeads(leadsData);
        setProjects(projectsData.filter((p) => p.client_id === target.id));
        setTasks(tasksData.filter((t) => t.client_id === target.id));
        setMrrHistory(mrrData);
        setInvoices(invoicesData);
        setDeliverables(deliverablesData);
        setPortalToken(tokenStr);

        // If client is in trial, default to trial tab
        if (target.trial_status === 'active') {
          setActiveTab('trial');
        }
      } catch (err) {
        console.warn('[Client 360] Erreur de chargement:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [clientId]);

  // Keyboard Shortcuts: 'C' to add deliverable, '/' to focus search/inputs, ⌘+Enter to save drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.key === 'c' || e.key === 'C') && !isInputFocused && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setActiveTab('livrables');
        setShowAddDeliverableRow(true);
        setTimeout(() => quickAddInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        if (isEditDrawerOpen) {
          setIsEditDrawerOpen(false);
        } else if (showAddDeliverableRow) {
          setShowAddDeliverableRow(false);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (isEditDrawerOpen) {
          e.preventDefault();
          handleSaveDrawer();
        } else if (showAddDeliverableRow && newDeliverableTitle.trim()) {
          e.preventDefault();
          handleCreateDeliverableSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditDrawerOpen, showAddDeliverableRow, newDeliverableTitle, editName, editMrr, client]);

  // Copy email
  const handleCopyEmail = (emailStr: string) => {
    navigator.clipboard.writeText(emailStr);
    setCopiedEmail(true);
    toastSuccess('Courriel copié !', emailStr);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Copy portal token magic link
  const handleCopyPortalLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/portal/${portalToken || client?.id}`;
    navigator.clipboard.writeText(url);
    setCopiedPortalLink(true);
    toastSuccess('Lien portail copié !', url);
    setTimeout(() => setCopiedPortalLink(false), 2000);
  };

  // Quick Chat Send
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatDraft.trim() || isSendingChat) return;

    setIsSendingChat(true);
    try {
      await sendReply(chatDraft.trim());
      setChatDraft('');
    } catch {
      toastError('Erreur', 'Impossible d’envoyer le message.');
    } finally {
      setIsSendingChat(false);
    }
  };

  // Add Deliverable Submit
  const handleCreateDeliverableSubmit = async () => {
    if (!client || !newDeliverableTitle.trim() || isCreatingDeliverable) return;
    setIsCreatingDeliverable(true);
    try {
      const created = await createClientDeliverable({
        client_id: client.id,
        title: newDeliverableTitle.trim(),
        type: newDeliverableType,
        status: 'pending_review',
      });
      if (created) {
        setDeliverables((prev) => [created, ...prev]);
        setNewDeliverableTitle('');
        setShowAddDeliverableRow(false);
        toastSuccess('Livrable ajouté !', created.title);
      }
    } catch {
      toastError('Erreur', 'Impossible d’ajouter le livrable.');
    } finally {
      setIsCreatingDeliverable(false);
    }
  };

  // Upload Logo
  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const supabase = createSupabaseClient();
      const filePath = `client-logos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const { error } = await supabase.storage.from('client-assets').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (error) {
        toastError('Erreur', 'Impossible de téléverser le logo.');
        return;
      }
      const { data } = supabase.storage.from('client-assets').getPublicUrl(filePath);
      setEditLogoUrl(data.publicUrl);
      toastSuccess('Logo téléversé avec succès');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Save Drawer (Profile + Contact)
  const handleSaveDrawer = async () => {
    if (!client || !editName.trim()) return;
    setIsSavingDrawer(true);
    try {
      const prevMrr = client.mrr;
      const nextMrr = Number(editMrr) || 0;

      const updated = await updateClient(client.id, {
        name: editName.trim(),
        industry: editIndustry.trim(),
        status: editStatus,
        mrr: nextMrr,
        contact_name: editContactName.trim(),
        contact_email: editContactEmail.trim(),
        contact_phone: editContactPhone.trim(),
        logo_url: editLogoUrl,
        website_url: editWebsiteUrl.trim(),
        google_business_url: editGoogleBusinessUrl.trim(),
        instagram_url: editInstagramUrl.trim(),
        facebook_url: editFacebookUrl.trim(),
        linkedin_url: editLinkedinUrl.trim(),
      });

      if (updated) {
        setClient(updated);
        setIsEditDrawerOpen(false);
        toastSuccess('Fiche client mise à jour !');

        // Log MRR history if changed
        if (nextMrr !== prevMrr && currentUserId) {
          await logClientMrrChange({
            client_id: client.id,
            mrr: nextMrr,
            note: `Mise à jour Fiche 360° (${prevMrr} $ → ${nextMrr} $)`,
            created_by: currentUserId,
          });
          const freshHistory = await fetchClientMrrHistory(client.id);
          setMrrHistory(freshHistory);
        }
      } else {
        toastError('Erreur', 'Impossible de mettre à jour le profil.');
      }
    } catch {
      toastError('Erreur réseau', 'Échec de l’enregistrement.');
    } finally {
      setIsSavingDrawer(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!client) return;
    if (!confirm(`Supprimer définitivement le compte client « ${client.name} » ? Attention, cette action supprimera également toutes les données associées.`)) return;
    try {
      const ok = await deleteClient(client.id);
      if (ok) {
        toastSuccess('Client supprimé', `Le compte client ${client.name} a été supprimé.`);
        router.push('/clients');
      } else {
        toastError('Erreur', 'Impossible de supprimer ce client.');
      }
    } catch {
      toastError('Erreur', 'Une erreur est survenue lors de la suppression.');
    }
  };

  // Unified items for Livrables & Tâches
  const unifiedProductionItems = useMemo(() => {
    const list: {
      id: string;
      title: string;
      kind: 'Livrable' | 'Tâche';
      formatOrStage: string;
      status: 'done' | 'in_progress' | 'todo';
      dueDate: string | null;
      version?: number;
      revisionCount?: number;
      assetUrl?: string | null;
    }[] = [];

    deliverables.forEach((d) => {
      list.push({
        id: `del-${d.id}`,
        title: d.title,
        kind: 'Livrable',
        formatOrStage: d.type === 'video' ? 'Pack Reels 4K' : d.type === 'design' ? 'Design System' : 'Flow POS',
        status: d.status === 'approved' ? 'done' : d.status === 'revision_requested' ? 'todo' : 'in_progress',
        dueDate: d.created_at,
        version: d.version ?? 1,
        revisionCount: d.revision_comments?.length || 0,
        assetUrl: d.asset_url,
      });
    });

    tasks.forEach((t) => {
      list.push({
        id: `tsk-${t.id}`,
        title: t.title,
        kind: 'Tâche',
        formatOrStage: t.priority || 'Standard',
        status: t.status === 'done' ? 'done' : t.status === 'in_progress' ? 'in_progress' : 'todo',
        dueDate: t.due_date,
      });
    });

    return list;
  }, [deliverables, tasks]);

  // Computed Financials
  const clientMrr = client?.mrr || 500;
  const computedLtv = useMemo(() => {
    if (!client) return 1500;
    const paidInvoicesTotal = invoices
      .filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total_cad || 0), 0);
    return Math.max(paidInvoicesTotal, clientMrr * 3);
  }, [client, invoices, clientMrr]);

  // Health Score & Retention Churn Risk Engine (0-100)
  const clientHealth = useMemo(() => {
    if (!client) return null;
    return computeClientHealthScore(client, deliverables, invoices, messages.length, true);
  }, [client, deliverables, invoices, messages.length]);

  if (loading) {
    return (
      <div className="h-48 flex flex-col items-center justify-center space-y-2 text-zinc-400 font-mono text-xs" style={MONO}>
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Chargement de la Fiche Client 360°...</span>
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="h-48 flex flex-col items-center justify-center space-y-2 text-xs">
        <p className="font-bold text-zinc-900">Client introuvable.</p>
        <p className="text-zinc-500">Ce compte n'existe pas ou a été archivé.</p>
        <Link href="/clients" className="text-emerald-700 hover:underline font-mono text-[11px]" style={MONO}>
          ← Retour au registre des clients
        </Link>
      </div>
    );
  }

  return (
    <PageFadeIn className="space-y-3 pb-8">
      {/* ── 1. Linear-Style Header & Toolbar Compacte (h-10 / 40px) ── */}
      <div className="h-10 bg-white border border-zinc-200 rounded-lg px-3.5 flex items-center justify-between shadow-2xs">
        {/* Breadcrumb & Badges */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono" style={MONO}>
            <Link href="/clients" className="hover:text-zinc-600 transition-colors">
              Clients
            </Link>
            <span>/</span>
            <span className="text-zinc-900 font-semibold truncate max-w-[140px] sm:max-w-[200px]">
              {client.name}
            </span>
            <span className="text-zinc-300 hidden md:inline">
              (ID: #{client.id.slice(0, 8)})
            </span>
          </div>

          <span className="text-zinc-200 hidden sm:inline">|</span>

          {/* Account Status Badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold" style={MONO}>
              {client.status === 'Active' ? 'Actif' : client.status}
            </span>
            <span
              className={cn(
                'text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase tracking-wider',
                client.health_status === 'At Risk'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              )}
              style={MONO}
            >
              ● {client.health_status}
            </span>
            <span className="hidden lg:inline-flex text-[10px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 rounded" style={MONO}>
              Minerva Flow
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsEditDrawerOpen(true)}
            className="h-7 px-2 text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
            title="Modifier la fiche client"
          >
            <Pencil className="w-3 h-3 text-zinc-500" />
            <span className="hidden sm:inline">Modifier la fiche</span>
          </button>

          <a
            href={`/portal/${portalToken || client.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-7 px-2 text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-1 transition-colors"
            title="Accès au portail client sécurisé"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span className="hidden md:inline">Portail Client</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>

          <button
            type="button"
            onClick={handleCopyPortalLink}
            className="h-7 px-2 text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
            title="Copier le lien sécurisé du portail client"
          >
            {copiedPortalLink ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-500" />
            )}
            <span className="hidden sm:inline">{copiedPortalLink ? 'Lien copié' : 'Copier lien'}</span>
          </button>

          <a
            href="https://minerva-flow.vercel.app/login"
            target="_blank"
            rel="noopener noreferrer"
            className="h-7 px-2 text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-1 transition-colors"
            title="Ouvrir dans Minerva Flow SaaS"
          >
            <Globe className="w-3 h-3 text-blue-600" />
            <span className="hidden lg:inline">Ouvrir Flow</span>
            <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
          </a>

          <button
            onClick={handleDeleteClient}
            className="h-7 px-2 text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center gap-1 transition-colors cursor-pointer"
            title="Supprimer ce client"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Supprimer</span>
          </button>

          <Link
            href={`/clients/${client.id}/roi-tracker`}
            className="h-7 px-2.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 transition-colors shadow-2xs"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Suivi ROI</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Ruban Métrique & Financier Monolithique (h-14 / 56px) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-x divide-zinc-100 shadow-2xs overflow-hidden">
        {/* Metric 1: MRR / Retainer */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              MRR / Retainer
            </span>
            <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded" style={MONO}>
              Mensuel
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
              {clientMrr.toLocaleString('fr-CA')} $ CAD
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              / mois
            </span>
          </div>
        </div>

        {/* Metric 2: Valeur Cumulée LTV */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Valeur Cumulée LTV
            </span>
            <span className="text-[10px] font-bold font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded" style={MONO}>
              Encaissé
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono tabular-nums text-emerald-600" style={MONO}>
              {computedLtv.toLocaleString('fr-CA')} $ CAD
            </span>
            <span className="text-[11px] text-emerald-600 font-mono font-medium" style={MONO}>
              Total historique
            </span>
          </div>
        </div>

        {/* Metric 3: Santé / Risque Churn */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Santé / Risque Churn
            </span>
            <span
              className={cn(
                'text-[10px] font-bold font-mono px-1.5 py-0.2 rounded border',
                clientHealth?.tier === 'critical'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : clientHealth?.tier === 'warning'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : clientHealth?.tier === 'stable'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              )}
              style={MONO}
            >
              {clientHealth?.tier_label || (client.health_status === 'At Risk' ? 'À surveiller' : 'Faible risque')}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
              {clientHealth?.score ?? (client.health_status === 'At Risk' ? 68 : 96)}/100
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              Engine 4-piliers
            </span>
          </div>
        </div>

        {/* Metric 4: Prochain Renouvellement */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Prochain Renouvellement
            </span>
            <span className="text-[10px] font-bold font-mono text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 rounded" style={MONO}>
              Automatique
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
              2026-10-01
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              Stripe Billing
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Grille Opérationnelle 2-Colonnes (65% / 35%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Colonne Gauche (65% - 8 cols on lg): Production & Livrables */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden flex flex-col">
          {/* Segmented Control Header (h-9) */}
          <div className="h-9 px-3 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
            <div className="h-7 bg-zinc-100 p-0.5 rounded-md flex items-center text-xs overflow-x-auto">
              <button
                onClick={() => setActiveTab('livrables')}
                className={cn(
                  'px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0',
                  activeTab === 'livrables'
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}
              >
                <CheckSquare className="w-3 h-3 text-zinc-500" />
                <span>Livrables &amp; Tâches ({unifiedProductionItems.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('projects')}
                className={cn(
                  'px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0',
                  activeTab === 'projects'
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}
              >
                <FolderKanban className="w-3 h-3 text-zinc-500" />
                <span>Projets ({projects.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('invoices')}
                className={cn(
                  'px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0',
                  activeTab === 'invoices'
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}
              >
                <Receipt className="w-3 h-3 text-zinc-500" />
                <span>Facturation &amp; Devis ({invoices.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('mrr')}
                className={cn(
                  'px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0',
                  activeTab === 'mrr'
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}
              >
                <TrendingUp className="w-3 h-3 text-zinc-500" />
                <span>Évolution MRR</span>
              </button>

              {client.trial_status === 'active' && (
                <button
                  onClick={() => setActiveTab('trial')}
                  className={cn(
                    'px-2.5 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0',
                    activeTab === 'trial'
                      ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                      : 'text-emerald-600 hover:text-emerald-800'
                  )}
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Essai 14j</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline" style={MONO}>
                Raccourci C pour ajouter
              </span>
            </div>
          </div>

          {/* Tab 1: Livrables & Tâches */}
          {activeTab === 'livrables' && (
            <div>
              {/* Column Headers */}
              <div className="grid grid-cols-12 h-7 px-3.5 border-b border-zinc-100 bg-zinc-50/40 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 items-center">
                <span className="col-span-5">Livrable / Tâche</span>
                <span className="col-span-2">Format / Type</span>
                <span className="col-span-2">Statut</span>
                <span className="col-span-2">Échéance</span>
                <span className="col-span-1 text-right">Action</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-zinc-100">
                {unifiedProductionItems.length === 0 ? (
                  <div className="h-16 px-3.5 flex items-center justify-between text-xs text-zinc-500 bg-zinc-50/30">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Aucun livrable ni tâche en cours pour ce compte.</span>
                    </div>
                    <button
                      onClick={() => setShowAddDeliverableRow(true)}
                      className="text-[11px] text-emerald-700 hover:underline font-mono cursor-pointer"
                      style={MONO}
                    >
                      + Ajouter un livrable (C) →
                    </button>
                  </div>
                ) : (
                  unifiedProductionItems.map((item) => {
                    const isDel = item.kind === 'Livrable';
                    const isDone = item.status === 'done';
                    const isProgress = item.status === 'in_progress';
                    const dateStr = item.dueDate
                      ? new Date(item.dueDate).toISOString().slice(0, 10)
                      : '—';

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 h-9 px-3.5 items-center text-xs text-zinc-800 hover:bg-zinc-50/80 transition-colors group"
                      >
                        {/* Col 1: Titre */}
                        <div className="col-span-5 flex items-center gap-1.5 min-w-0 pr-2">
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full shrink-0',
                              isDone ? 'bg-zinc-300' : 'bg-emerald-500'
                            )}
                          />
                          <span className={cn('font-medium truncate', isDone ? 'text-zinc-400 line-through' : 'text-zinc-900')}>
                            {item.title}
                          </span>
                          {isDel && item.version && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 font-bold shrink-0" style={MONO}>
                              v{item.version}
                            </span>
                          )}
                          {isDel && item.revisionCount && item.revisionCount > 0 ? (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0 flex items-center gap-0.5" style={MONO}>
                              <MessageSquare className="w-2 h-2" />
                              <span>{item.revisionCount}</span>
                            </span>
                          ) : null}
                        </div>

                        {/* Col 2: Type Pill */}
                        <div className="col-span-2">
                          <span
                            className={cn(
                              'text-[10px] font-mono px-1.5 py-0.2 rounded border',
                              isDel
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            )}
                            style={MONO}
                          >
                            {item.formatOrStage}
                          </span>
                        </div>

                        {/* Col 3: Statut */}
                        <div className="col-span-2">
                          <span
                            className={cn(
                              'text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase tracking-wider',
                              isDone
                                ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                : isProgress
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                            )}
                            style={MONO}
                          >
                            {isDone ? 'Livré' : isProgress ? 'En cours' : 'À faire'}
                          </span>
                        </div>

                        {/* Col 4: Échéance */}
                        <div className="col-span-2 font-mono text-[11px] text-zinc-500 tabular-nums" style={MONO}>
                          {dateStr}
                        </div>

                        {/* Col 5: Actions hover */}
                        <div className="col-span-1 flex items-center justify-end">
                          <Link
                            href="/tasks"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-900"
                            title="Gérer dans les tâches"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Inline Quick Add Input (when triggered by C or click) */}
              {showAddDeliverableRow ? (
                <div className="p-2.5 bg-zinc-50 border-t border-zinc-200 flex items-center gap-2">
                  <input
                    ref={quickAddInputRef}
                    type="text"
                    value={newDeliverableTitle}
                    onChange={(e) => setNewDeliverableTitle(e.target.value)}
                    placeholder="Nom du livrable (ex: Pack 8 Reels 4K - Batch Septembre)..."
                    className="h-7 px-2 text-xs bg-white border border-zinc-200 rounded flex-1 focus:outline-none focus:border-emerald-600"
                  />
                  <select
                    value={newDeliverableType}
                    onChange={(e) => setNewDeliverableType(e.target.value as ClientDeliverable['type'])}
                    className="h-7 px-2 text-xs bg-white border border-zinc-200 rounded text-zinc-700 focus:outline-none cursor-pointer"
                  >
                    <option value="video">Vidéo 4K</option>
                    <option value="design">Design / Framer</option>
                    <option value="document">Opérations POS</option>
                  </select>
                  <button
                    onClick={handleCreateDeliverableSubmit}
                    disabled={isCreatingDeliverable || !newDeliverableTitle.trim()}
                    className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors cursor-pointer"
                  >
                    {isCreatingDeliverable ? 'Ajout...' : 'Ajouter (↵)'}
                  </button>
                  <button
                    onClick={() => setShowAddDeliverableRow(false)}
                    className="h-7 px-2 text-xs text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <div className="h-8 px-3.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setShowAddDeliverableRow(true)}
                    className="text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1 font-mono text-[11px] cursor-pointer"
                    style={MONO}
                  >
                    <span>+ Ajouter un livrable ou une tâche [C]</span>
                  </button>
                  <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
                    Synchronisé avec le portail
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Projets */}
          {activeTab === 'projects' && (
            <div>
              <div className="grid grid-cols-12 h-7 px-3.5 border-b border-zinc-100 bg-zinc-50/40 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 items-center">
                <span className="col-span-5">Projet</span>
                <span className="col-span-3">Échéance</span>
                <span className="col-span-2">Statut</span>
                <span className="col-span-2 text-right">Action</span>
              </div>

              <div className="divide-y divide-zinc-100">
                {projects.length === 0 ? (
                  <div className="h-16 px-3.5 flex items-center justify-between text-xs text-zinc-500 bg-zinc-50/30">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Aucun projet actif associé à ce client.</span>
                    </div>
                    <Link
                      href={`/projects/new?client_id=${client.id}`}
                      className="text-[11px] text-emerald-700 hover:underline font-mono"
                      style={MONO}
                    >
                      + Lancer un projet pour ce client [Entrée] →
                    </Link>
                  </div>
                ) : (
                  projects.map((p) => (
                    <div
                      key={p.id}
                      className="grid grid-cols-12 h-9 px-3.5 items-center text-xs text-zinc-800 hover:bg-zinc-50/80 transition-colors group"
                    >
                      <div className="col-span-5 font-semibold text-zinc-900 truncate">
                        {p.name}
                      </div>
                      <div className="col-span-3 font-mono text-[11px] text-zinc-500 tabular-nums" style={MONO}>
                        {p.due_date ? new Date(p.due_date).toISOString().slice(0, 10) : 'Flexible'}
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" style={MONO}>
                          {p.health || 'On Track'}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end">
                        <Link
                          href="/projects"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-900 flex items-center gap-1 text-[11px]"
                        >
                          <span>Voir</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Facturation & Devis */}
          {activeTab === 'invoices' && (
            <div>
              <div className="grid grid-cols-12 h-7 px-3.5 border-b border-zinc-100 bg-zinc-50/40 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 items-center">
                <span className="col-span-3">Numéro</span>
                <span className="col-span-3">Montant Total</span>
                <span className="col-span-3">Date</span>
                <span className="col-span-2">Statut</span>
                <span className="col-span-1 text-right">Lien</span>
              </div>

              <div className="divide-y divide-zinc-100">
                {invoices.length === 0 ? (
                  <div className="h-16 px-3.5 flex items-center justify-between text-xs text-zinc-500 bg-zinc-50/30">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Aucune facture émise pour ce client pour le moment.</span>
                    </div>
                    <Link
                      href="/invoices"
                      className="text-[11px] text-emerald-700 hover:underline font-mono"
                      style={MONO}
                    >
                      + Émettre une facture Stripe [Entrée] →
                    </Link>
                  </div>
                ) : (
                  invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="grid grid-cols-12 h-9 px-3.5 items-center text-xs text-zinc-800 hover:bg-zinc-50/80 transition-colors group"
                    >
                      <div className="col-span-3 font-mono text-[11px] text-zinc-900 font-semibold truncate" style={MONO}>
                        {inv.invoice_number}
                      </div>
                      <div className="col-span-3 font-mono text-[11px] text-zinc-900 font-bold tabular-nums" style={MONO}>
                        {(inv.total_cad || 0).toLocaleString('fr-CA')} $ CAD
                      </div>
                      <div className="col-span-3 font-mono text-[11px] text-zinc-500 tabular-nums" style={MONO}>
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
                          {inv.status === 'paid' ? 'Payée' : inv.status}
                        </span>
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <Link
                          href="/invoices"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-900"
                          title="Détails facture"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Évolution du MRR */}
          {activeTab === 'mrr' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900">
                  Progression Historique du Retainer
                </span>
                <span className="font-mono text-xs text-emerald-700 font-bold tabular-nums" style={MONO}>
                  Actuel : {clientMrr.toLocaleString('fr-CA')} $ / mois
                </span>
              </div>

              {mrrHistory.length > 1 ? (
                <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50/50">
                  <AreaChart
                    data={mrrHistory.map((h) => ({
                      label: new Date(h.recorded_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }),
                      value: h.mrr,
                    }))}
                    valueSuffix=" $"
                    height={140}
                  />
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center text-xs text-zinc-400 font-mono border border-zinc-200 rounded-lg bg-zinc-50" style={MONO}>
                  Retainer stable à {clientMrr.toLocaleString('fr-CA')} $ CAD.
                </div>
              )}

              <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-lg overflow-hidden text-xs">
                {[...mrrHistory].reverse().map((h) => (
                  <div key={h.id} className="h-8 px-3 flex items-center justify-between font-mono" style={MONO}>
                    <span className="text-zinc-500">
                      {new Date(h.recorded_at).toISOString().slice(0, 10)} {h.note && `· ${h.note}`}
                    </span>
                    <span className="font-bold text-zinc-900">{h.mrr.toLocaleString('fr-CA')} $</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Essai 14j (si actif) */}
          {activeTab === 'trial' && client.trial_status === 'active' && (
            <div className="p-3.5">
              <TrialLifecycleTracker client={client} onClientUpdated={(updated) => setClient(updated)} />
            </div>
          )}
        </div>

        {/* Colonne Droite (35% - 4 cols on lg): Métadonnées & Console Interactive Ancrée */}
        <div className="lg:col-span-4 space-y-3 sticky top-4">
          {clientHealth && <ClientHealthScoreWidget health={clientHealth} />}

          <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs divide-y divide-zinc-100">
            {/* Bloc 1: Contact Principal */}
          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Contact Principal
              </span>
              <button
                onClick={() => setIsEditDrawerOpen(true)}
                className="text-[10px] text-zinc-500 hover:text-zinc-900 transition-colors"
                title="Modifier"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-900">
                {client.contact_name || 'Direction de l’établissement'}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500 truncate">{client.contact_email}</span>
                {client.contact_email && (
                  <button
                    onClick={() => handleCopyEmail(client.contact_email)}
                    className="h-5 px-1.5 rounded text-[10px] font-mono border border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900 flex items-center gap-1 cursor-pointer"
                    title="Copier le courriel"
                  >
                    {copiedEmail ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copiedEmail ? 'Copié' : 'Copier'}</span>
                  </button>
                )}
              </div>
              {client.contact_phone && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 pt-0.5">
                  <Phone className="w-3 h-3 text-zinc-400" />
                  <a href={`tel:${client.contact_phone}`} className="hover:text-emerald-700 font-mono text-[11px]" style={MONO}>
                    {client.contact_phone}
                  </a>
                </div>
              )}
            </div>

            {/* Social & Web Micro-Pills */}
            <div className="flex items-center gap-1 flex-wrap pt-1">
              {client.website_url && (
                <a
                  href={client.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-[10px] font-mono text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
                >
                  <Globe className="w-2.5 h-2.5" />
                  <span>Site web</span>
                </a>
              )}
              {client.google_business_url && (
                <a
                  href={client.google_business_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-[10px] font-mono text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
                >
                  <MapPin className="w-2.5 h-2.5 text-red-500" />
                  <span>Fiche Google</span>
                </a>
              )}
              {client.instagram_url && (
                <a
                  href={client.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-[10px] font-mono text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
                >
                  <Instagram className="w-2.5 h-2.5 text-purple-600" />
                  <span>Instagram</span>
                </a>
              )}
            </div>
          </div>

          {/* Bloc 2: Protocole & Accord Mensuel (Checklist Compacte) */}
          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Protocole &amp; Accord Mensuel
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200" style={MONO}>
                500$/mo
              </span>
            </div>

            <div className="space-y-1">
              {[
                { id: 'monthly_review', label: 'Réunion mensuelle de cadrage métriques' },
                { id: 'market_watch', label: 'Veille concurrentielle & offres locales' },
                { id: 'seo_local', label: 'Optimisation SEO & Fiche Google Maps' },
                { id: 'new_packs', label: 'Déploiement nouveaux packs & QR codes' },
              ].map((item) => (
                <div key={item.id} className="h-6 flex items-center gap-2 text-xs text-zinc-700">
                  <input
                    type="checkbox"
                    checked={protocolChecklist[item.id]}
                    onChange={() =>
                      setProtocolChecklist((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                    }
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer w-3.5 h-3.5"
                  />
                  <span className={cn('text-[11px] truncate', protocolChecklist[item.id] ? 'text-zinc-900 font-medium' : 'text-zinc-400')}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] border-t border-zinc-100">
              <span className="text-zinc-400 font-mono" style={MONO}>
                Prochaine session : 2026-10-01
              </span>
              <Link href="/booking" className="text-emerald-700 hover:underline font-semibold font-mono text-[10px]" style={MONO}>
                Planifier →
              </Link>
            </div>
          </div>

          {/* Bloc 3: Fil de Discussion Rapide / Journal Interne */}
          <div className="p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Journal &amp; Discussion Rapide
              </span>
              <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                {messages.length} message{messages.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Micro-Feed */}
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <p className="text-[11px] text-zinc-400 py-2 text-center font-mono" style={MONO}>
                  Aucun message d'équipe pour l'instant.
                </p>
              ) : (
                messages.slice(-3).map((msg) => (
                  <div key={msg.id} className="p-1.5 rounded bg-zinc-50 border border-zinc-100 text-[11px] space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono" style={MONO}>
                      <span className="font-semibold text-zinc-700">{msg.sender_name}</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-zinc-800 leading-tight">{msg.body}</p>
                  </div>
                ))
              )}
            </div>

            {/* Inline Input Box */}
            <form onSubmit={handleSendChat} className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder="Note interne ou message client..."
                className="h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md flex-1 focus:bg-white focus:border-emerald-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatDraft.trim()}
                className="h-8 w-8 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                title="Envoyer (↵)"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

      {/* ── 4. Slide-Over Drawer Linear-Style (Modifier la Fiche) ── */}
      {isEditDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white border-l border-zinc-200 shadow-2xl h-full flex flex-col justify-between overflow-hidden">
            {/* Drawer Header */}
            <div className="h-12 px-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/60">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Modifier la Fiche Client 360°
                </h3>
              </div>
              <button
                onClick={() => setIsEditDrawerOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                title="Fermer (Échap)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body: 2 Columns */}
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Column 1: Profil Entreprise & Retainer */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block border-b border-zinc-100 pb-1">
                  1. Entreprise &amp; Retainer
                </span>

                {/* Logo Upload */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    Logo de l'établissement
                  </label>
                  <div className="flex items-center gap-3">
                    <UserAvatar src={editLogoUrl} name={editName || 'Client'} size="lg" shape="rounded" />
                    <label className="h-7 px-2.5 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-medium flex items-center gap-1 cursor-pointer">
                      {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                      <span>{uploadingLogo ? 'Upload...' : 'Changer logo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingLogo}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    Nom du client *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    Secteur d'activité
                  </label>
                  <input
                    type="text"
                    value={editIndustry}
                    onChange={(e) => setEditIndustry(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      Statut
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as Client['status'])}
                      className="w-full h-8 px-2 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Onboarding">Onboarding</option>
                      <option value="Paused">En pause</option>
                      <option value="Archived">Archivé</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                      MRR (CAD)
                    </label>
                    <input
                      type="number"
                      value={editMrr}
                      onChange={(e) => setEditMrr(Number(e.target.value) || 0)}
                      className="w-full h-8 px-2 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none"
                      style={MONO}
                    />
                  </div>
                </div>
              </div>

              {/* Column 2: Contact & Réseaux */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block border-b border-zinc-100 pb-1">
                  2. Coordonnées &amp; Réseaux
                </span>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    Nom du contact
                  </label>
                  <input
                    type="text"
                    value={editContactName}
                    onChange={(e) => setEditContactName(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    Courriel contact
                  </label>
                  <input
                    type="email"
                    value={editContactEmail}
                    onChange={(e) => setEditContactEmail(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={editContactPhone}
                    onChange={(e) => setEditContactPhone(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                    style={MONO}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    Site web
                  </label>
                  <input
                    type="url"
                    value={editWebsiteUrl}
                    onChange={(e) => setEditWebsiteUrl(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                    style={MONO}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    Fiche Google Business
                  </label>
                  <input
                    type="url"
                    value={editGoogleBusinessUrl}
                    onChange={(e) => setEditGoogleBusinessUrl(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                    style={MONO}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={editInstagramUrl}
                    onChange={(e) => setEditInstagramUrl(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-md focus:bg-white focus:border-emerald-600 focus:outline-none"
                    style={MONO}
                  />
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="h-12 px-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
                ⌘ + ↵ pour enregistrer • Échap pour fermer
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditDrawerOpen(false)}
                  className="h-8 px-3 rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-medium cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveDrawer}
                  disabled={isSavingDrawer}
                  className="h-8 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSavingDrawer ? 'Enregistrement...' : 'Enregistrer (⌘+↵)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
