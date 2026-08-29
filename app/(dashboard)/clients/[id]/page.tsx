'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InviteClientButton } from '@/components/clients/InviteClientButton';
import {
  Building2,
  Mail,
  DollarSign,
  ExternalLink,
  FolderKanban,
  Target,
  CheckSquare,
  CreditCard,
  Film,
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
} from 'lucide-react';
import {
  fetchClients,
  fetchLeads,
  fetchProjects,
  fetchClientPaymentLinks,
  fetchTasks,
  fetchContentPosts,
  updateClient,
  fetchClientMrrHistory,
  logClientMrrChange,
} from '@/lib/services/supabase-data';
import { AreaChart } from '@/components/charts/AreaChart';
import { useToast } from '@/components/providers/ToastProvider';
import { useAppPermissions } from '@/components/providers/AppPermissionsProvider';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useClientChatThread } from '@/hooks/use-client-chat-thread';
import { Client, Lead, Project, ClientPaymentLink, Task, ContentPost, ClientMrrHistoryEntry, Invoice, ClientDeliverable } from '@/lib/types';
import { UserAvatar } from '@/components/ui/user-avatar';
import { CoPilotageTracker } from '@/components/clients/CoPilotageTracker';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { fetchInvoices } from '@/lib/services/invoicing';
import { fetchClientDeliverables, ensureClientPortalToken } from '@/lib/services/client-portal';

const HEALTH_BADGE: Record<Client['health_status'], 'blue' | 'amber' | 'green'> = {
  Ready: 'blue',
  'On Track': 'green',
  'At Risk': 'amber',
};

const PAYMENT_STATUS_BADGE: Record<ClientPaymentLink['status'], 'green' | 'amber' | 'neutral'> = {
  paid: 'green',
  pending: 'amber',
  expired: 'neutral',
};

const TASK_STATUS_LABEL: Record<Task['status'], string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
};

const TASK_STATUS_BADGE: Record<Task['status'], 'neutral' | 'amber' | 'green'> = {
  todo: 'neutral',
  in_progress: 'amber',
  done: 'green',
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [client, setClient] = useState<Client | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<ClientPaymentLink[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contentPosts, setContentPosts] = useState<ContentPost[]>([]);
  const [mrrHistory, setMrrHistory] = useState<ClientMrrHistoryEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deliverables, setDeliverables] = useState<ClientDeliverable[]>([]);
  const [portalToken, setPortalToken] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { toastSuccess, toastError, toastInfo } = useToast();
  const { can } = useAppPermissions();
  const { id: currentUserId, fullName: currentUserName } = useCurrentUser();
  const { messages, send: sendReply } = useClientChatThread(clientId, currentUserId, currentUserName || 'Équipe Minerva', 'team');
  const [replyDraft, setReplyDraft] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const [editingContact, setEditingContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [status, setStatus] = useState<Client['status']>('Active');
  const [mrr, setMrr] = useState(0);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    async function loadData() {
      setLoading(true);
      const clients = await fetchClients();
      const targetClient = clients.find((c) => c.id === clientId) || null;

      if (!targetClient) {
        setClient(null);
        setNotFound(true);
        setLoading(false);
        return;
      }
      setNotFound(false);
      setClient(targetClient);
      setContactPhone(targetClient.contact_phone || '');
      setWebsiteUrl(targetClient.website_url || '');
      setGoogleBusinessUrl(targetClient.google_business_url || '');
      setInstagramUrl(targetClient.instagram_url || '');
      setFacebookUrl(targetClient.facebook_url || '');
      setLinkedinUrl(targetClient.linkedin_url || '');
      setName(targetClient.name || '');
      setIndustry(targetClient.industry || '');
      setStatus(targetClient.status);
      setMrr(targetClient.mrr || 0);
      setContactName(targetClient.contact_name || '');
      setContactEmail(targetClient.contact_email || '');
      setLogoUrl(targetClient.logo_url || '');

      const [leadsData, projectsData, paymentLinksData, tasksData, postsData, mrrHistoryData, invoicesData, deliverablesData, tokenStr] = await Promise.all([
        fetchLeads(targetClient.id),
        fetchProjects(),
        fetchClientPaymentLinks(),
        fetchTasks(),
        fetchContentPosts(),
        fetchClientMrrHistory(targetClient.id),
        fetchInvoices({ clientId: targetClient.id }),
        fetchClientDeliverables(targetClient.id),
        ensureClientPortalToken(targetClient.id),
      ]);

      setLeads(leadsData);
      setProjects(projectsData.filter((p) => p.client_id === targetClient.id));
      setPaymentLinks(paymentLinksData.filter((l) => l.client_id === targetClient.id));
      setTasks(tasksData.filter((t) => t.client_id === targetClient.id));
      setContentPosts(postsData.filter((p) => p.client_id === targetClient.id));
      setMrrHistory(mrrHistoryData);
      setInvoices(invoicesData);
      setDeliverables(deliverablesData);
      setPortalToken(tokenStr);
      setLoading(false);
    }
    loadData();
  }, [clientId]);

  if (loading) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="h-6 shimmer-bg rounded w-1/3 mx-auto animate-mv-shimmer" />
        <div className="h-24 shimmer-bg rounded w-full animate-mv-shimmer" />
      </div>
    );
  }

  const handleSaveContact = async () => {
    if (!client) return;
    setSavingContact(true);
    const updated = await updateClient(client.id, {
      contact_phone: contactPhone,
      website_url: websiteUrl,
      google_business_url: googleBusinessUrl,
      instagram_url: instagramUrl,
      facebook_url: facebookUrl,
      linkedin_url: linkedinUrl,
    });
    setSavingContact(false);
    if (updated) {
      setClient(updated);
      setEditingContact(false);
      toastSuccess('Coordonnées mises à jour');
    } else {
      toastError('Erreur', "Impossible d'enregistrer. Les nouveaux champs nécessitent peut-être le déploiement de la migration en attente.");
    }
  };

  const handleSaveProfile = async () => {
    if (!client || !name.trim() || !industry.trim()) return;
    setSavingProfile(true);
    const previousMrr = client.mrr;
    const nextMrr = Number(mrr);
    const updated = await updateClient(client.id, {
      name: name.trim(),
      industry: industry.trim(),
      status,
      mrr: nextMrr,
      contact_name: contactName.trim(),
      contact_email: contactEmail.trim(),
      logo_url: logoUrl,
    });
    if (updated && nextMrr !== previousMrr && currentUserId) {
      await logClientMrrChange({
        client_id: client.id,
        mrr: nextMrr,
        note: `Mis à jour depuis la fiche client (${previousMrr.toLocaleString('fr-CA')} $ → ${nextMrr.toLocaleString('fr-CA')} $)`,
        created_by: currentUserId,
      });
      setMrrHistory(await fetchClientMrrHistory(client.id));
    }
    setSavingProfile(false);
    if (updated) {
      setClient(updated);
      setEditingProfile(false);
      toastSuccess('Fiche client mise à jour');
    } else {
      toastError('Erreur', "Impossible d'enregistrer les modifications.");
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const supabase = createSupabaseClient();
      const filePath = `client-logos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const { error } = await supabase.storage.from('client-assets').upload(filePath, file, { cacheControl: '3600', upsert: true });
      if (error) {
        toastError('Erreur', 'Impossible de téléverser le logo.');
        return;
      }
      const { data } = supabase.storage.from('client-assets').getPublicUrl(filePath);
      setLogoUrl(data.publicUrl);
    } finally {
      setUploadingLogo(false);
    }
  };

  if (notFound || !client) {
    return (
      <div className="p-12 text-center space-y-2">
        <p className="text-sm font-bold text-mv-ink">Client introuvable.</p>
        <p className="text-xs text-mv-ink-soft">Ce client n'existe pas ou a été retiré.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      {editingProfile ? (
        <div className="bg-mv-surface border border-mv-border rounded-xl p-5 sm:p-6 shadow-mv-sm space-y-4">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <UserAvatar src={logoUrl} name={name || 'Client'} size="xl" shape="rounded" />
              <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-mv-green text-white flex items-center justify-center shadow-mv-sm cursor-pointer hover:bg-mv-green-dark transition-colors">
                {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
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
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Nom du client</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Secteur d&apos;activité</label>
                <input value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Statut</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as Client['status'])} className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer">
                  <option value="Active">Active</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Paused">En pause</option>
                  <option value="Archived">Archivé</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">MRR mensuel (CAD)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="number" value={mrr} onChange={(e) => setMrr(Number(e.target.value))} className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink font-mono focus:outline-none focus:border-mv-green transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Nom du contact</label>
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Courriel du contact</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => setEditingProfile(false)} disabled={savingProfile}>Annuler</Button>
            <Button variant="primary" size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-mv-surface border border-mv-border rounded-xl p-5 sm:p-6 shadow-mv-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <UserAvatar
              src={client.logo_url}
              name={client.name}
              size="xl"
              shape="rounded"
              className="shrink-0 shadow-mv-sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl lg:text-2xl font-extrabold text-mv-ink font-display truncate">{client.name}</h1>
                <Badge variant={client.status === 'Active' ? 'green' : 'amber'}>{client.status}</Badge>
                <Badge variant={HEALTH_BADGE[client.health_status]}>● {client.health_status}</Badge>
              </div>
              <p className="text-xs text-mv-ink-soft mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> {client.industry}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {can('edit_client_financials') ? (
              <button
                onClick={() => setEditingProfile(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-mv-cream-soft border border-mv-border text-xs font-bold text-mv-ink hover:border-mv-green/50 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" /> Modifier la fiche
              </button>
            ) : (
              <span
                title="Réservé aux administrateurs (ou aux membres autorisés dans Paramètres > Permissions)"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-mv-cream-soft border border-mv-border text-xs font-bold text-mv-ink-faint cursor-not-allowed"
              >
                <Pencil className="w-3.5 h-3.5" /> Modifier la fiche
              </span>
            )}
            <InviteClientButton clientId={client.id} />
            <a
              href={`/portal/${portalToken || client.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-mv-green/10 border border-mv-green/30 text-xs font-bold text-mv-green hover:bg-mv-green hover:text-white transition-colors cursor-pointer"
              title="Ouvrir le portail client sécurisé"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Portail Client</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
            <Link href={`/clients/${client.id}/roi-tracker`}>
              <Button variant="primary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                Suivi ROI
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Core Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs text-mv-ink-soft mb-1">Contact Principal</div>
          <div className="font-bold text-sm text-mv-ink">{client.contact_name}</div>
          <div className="text-xs text-mv-ink-soft mt-1 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> {client.contact_email}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-mv-ink-soft mb-1">MRR</div>
          <div className="font-mono font-extrabold text-mv-green text-lg flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" /> {client.mrr.toLocaleString('fr-CA')} $
          </div>
        </Card>
        <Card>
          <div className="text-xs text-mv-ink-soft mb-1">Focus Actuel</div>
          <div className="text-sm text-mv-ink font-semibold">
            {client.current_focus || 'Aucun focus défini pour le moment.'}
          </div>
        </Card>
      </div>

      {/* MRR Evolution */}
      <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Évolution du MRR</h3>}>
        {mrrHistory.length === 0 ? (
          <p className="text-xs text-mv-ink-soft py-6 text-center">
            Aucun historique de MRR pour le moment. Les changements faits sur cette fiche seront enregistrés ici.
          </p>
        ) : (
          <div className="space-y-4">
            <AreaChart
              data={mrrHistory.map((h) => ({
                label: new Date(h.recorded_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }),
                value: h.mrr,
              }))}
              valuePrefix=""
              valueSuffix=" $"
              height={160}
            />
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {[...mrrHistory].reverse().map((h) => (
                <div key={h.id} className="flex items-center justify-between text-xs border-t border-mv-border/60 pt-1.5 first:border-0 first:pt-0">
                  <span className="text-mv-ink-soft">
                    {new Date(h.recorded_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {h.author_name && ` · ${h.author_name}`}
                  </span>
                  <span className="font-mono font-bold text-mv-ink">{h.mrr.toLocaleString('fr-CA')} $</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Coordonnées & réseaux */}
      <Card
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-mv-green" />
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Coordonnées &amp; réseaux</h3>
            </div>
            {!editingContact && (
              <button
                onClick={() => setEditingContact(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-mv-green hover:underline cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" /> Modifier
              </button>
            )}
          </div>
        }
      >
        {editingContact ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Téléphone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="514 555-0100"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Site web</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://client.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Fiche Google Business</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="url" value={googleBusinessUrl} onChange={(e) => setGoogleBusinessUrl(e.target.value)} placeholder="https://g.page/…"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Instagram</label>
                <div className="relative">
                  <Instagram className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/…"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Facebook</label>
                <div className="relative">
                  <Facebook className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/…"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">LinkedIn</label>
                <div className="relative">
                  <Linkedin className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/company/…"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-1">
              <Button variant="secondary" size="sm" onClick={() => setEditingContact(false)} disabled={savingContact}>Annuler</Button>
              <Button variant="primary" size="sm" onClick={handleSaveContact} disabled={savingContact}>
                {savingContact ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {client.contact_phone && (
              <a href={`tel:${client.contact_phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-semibold text-mv-ink hover:border-mv-green/50 transition-colors">
                <Phone className="w-3.5 h-3.5 text-mv-green" /> {client.contact_phone}
              </a>
            )}
            {client.website_url && (
              <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-semibold text-mv-ink hover:border-mv-green/50 transition-colors">
                <Globe className="w-3.5 h-3.5 text-mv-green" /> Site web
              </a>
            )}
            {client.google_business_url && (
              <a href={client.google_business_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-semibold text-mv-ink hover:border-mv-green/50 transition-colors">
                <MapPin className="w-3.5 h-3.5 text-mv-green" /> Google Business
              </a>
            )}
            {client.instagram_url && (
              <a href={client.instagram_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-semibold text-mv-ink hover:border-mv-green/50 transition-colors">
                <Instagram className="w-3.5 h-3.5 text-mv-green" /> Instagram
              </a>
            )}
            {client.facebook_url && (
              <a href={client.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-semibold text-mv-ink hover:border-mv-green/50 transition-colors">
                <Facebook className="w-3.5 h-3.5 text-mv-green" /> Facebook
              </a>
            )}
            {client.linkedin_url && (
              <a href={client.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-semibold text-mv-ink hover:border-mv-green/50 transition-colors">
                <Linkedin className="w-3.5 h-3.5 text-mv-green" /> LinkedIn
              </a>
            )}
            {!client.contact_phone && !client.website_url && !client.google_business_url && !client.instagram_url && !client.facebook_url && !client.linkedin_url && (
              <p className="text-xs text-mv-ink-faint">Aucune coordonnée ni réseau renseigné pour le moment.</p>
            )}
          </div>
        )}
      </Card>

      {/* Co-Pilotage Mensuel & Suivi de Valeur ($300-$500/mo) */}
      <CoPilotageTracker clientId={client.id} clientName={client.name} initialMrr={client.mrr} />

      {/* Projects */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-mv-green" />
            <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Projets</h3>
          </div>
        }
      >
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Aucun projet"
            description="Aucun projet n'est encore associé à ce client."
            actionLabel="Créer un projet"
            onAction={() => router.push('/projects/new')}
          />
        ) : (
          <div className="space-y-2">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}/roadmap`}
                className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border hover:border-mv-green/50 transition-colors text-xs"
              >
                <div>
                  <div className="font-bold text-mv-ink">{p.name}</div>
                  <div className="text-mv-ink-soft mt-0.5">{p.current_stage}</div>
                </div>
                <Badge variant={p.health === 'Ready' ? 'blue' : p.health === 'On Track' ? 'green' : 'amber'}>
                  {p.progress_pct}%
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Factures & Devis + Livrables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Factures Client */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-mv-green" />
                <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Facturation & Devis</h3>
              </div>
              <Link href="/invoices">
                <Button size="sm" variant="ghost" className="text-xs text-mv-green h-7 px-2">
                  <span>Gérer tout</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          }
        >
          {invoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Aucune facture"
              description="Aucune facture ou devis n'a été émis pour ce client."
              actionLabel="Créer une facture"
              onAction={() => router.push('/invoices')}
            />
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border hover:border-mv-green/50 transition-colors text-xs"
                >
                  <div>
                    <div className="font-bold text-mv-ink font-mono">{inv.invoice_number}</div>
                    <div className="text-mv-ink-soft mt-0.5">
                      ${Number(inv.total_cad).toLocaleString('fr-CA', { minimumFractionDigits: 2 })} {inv.currency}
                    </div>
                  </div>
                  <Badge variant={inv.status === 'paid' ? 'green' : inv.status === 'sent' ? 'blue' : 'neutral'}>
                    {inv.status === 'paid' ? 'Payé' : inv.status === 'sent' ? 'Envoyé' : inv.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Livrables & Approbation */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-mv-green" />
                <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Livrables du Portail</h3>
              </div>
              <a
                href={`/portal/${portalToken || client.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-mv-green font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Vue Client</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          }
        >
          {deliverables.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Aucun livrable"
              description="Aucun fichier de production en attente de validation."
            />
          ) : (
            <div className="space-y-2">
              {deliverables.map((del) => (
                <div
                  key={del.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-mv-ink truncate">{del.title}</div>
                    <div className="text-mv-ink-faint text-[10.5px] capitalize mt-0.5">{del.type}</div>
                  </div>
                  <Badge
                    variant={
                      del.status === 'approved'
                        ? 'green'
                        : del.status === 'revision_requested'
                        ? 'amber'
                        : 'blue'
                    }
                  >
                    {del.status === 'approved'
                      ? 'Approuvé'
                      : del.status === 'revision_requested'
                      ? 'Retouches'
                      : 'En attente'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Leads + Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          header={
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-mv-green" />
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Leads Associés</h3>
            </div>
          }
        >
          {leads.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Aucun lead"
              description="Aucun lead n'est encore lié à ce client."
              actionLabel="Créer un lead"
              onAction={() => router.push('/leads/new')}
            />
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border hover:border-mv-green/50 transition-colors text-xs"
                >
                  <div>
                    <div className="font-bold text-mv-ink">{lead.contact_name}</div>
                    <div className="text-mv-ink-soft mt-0.5">{lead.service_requested}</div>
                  </div>
                  <Badge variant={lead.status === 'Gagné' ? 'green' : lead.status === 'Perdu' ? 'red' : 'neutral'}>
                    {lead.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card
          header={
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-mv-green" />
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Tâches</h3>
            </div>
          }
        >
          {tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="Aucune tâche"
              description="Aucune tâche n'est encore liée à ce client."
              actionLabel="Créer une tâche"
              onAction={() => router.push('/tasks/new')}
            />
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border hover:border-mv-green/50 transition-colors text-xs"
                >
                  <div>
                    <div className="font-bold text-mv-ink">{task.title}</div>
                    {task.assignee_name && <div className="text-mv-ink-soft mt-0.5">{task.assignee_name}</div>}
                  </div>
                  <Badge variant={TASK_STATUS_BADGE[task.status]}>{TASK_STATUS_LABEL[task.status]}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Payment Links + Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          header={
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-mv-green" />
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Liens de Paiement</h3>
            </div>
          }
        >
          {paymentLinks.length === 0 ? (
            <EmptyState icon={CreditCard} title="Aucun lien" description="Aucun lien de paiement Stripe généré pour ce client." />
          ) : (
            <div className="space-y-2">
              {paymentLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border hover:border-mv-green/50 transition-colors text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-mv-ink">
                      {link.amount.toLocaleString('fr-CA')} {link.currency.toUpperCase()}
                    </div>
                    <div className="text-mv-ink-soft mt-0.5">
                      {new Date(link.created_at).toLocaleDateString('fr-CA')}
                    </div>
                  </div>
                  <Badge variant={PAYMENT_STATUS_BADGE[link.status]}>{link.status}</Badge>
                </a>
              ))}
            </div>
          )}
        </Card>

        <Card
          header={
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-mv-green" />
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Contenus</h3>
            </div>
          }
        >
          {contentPosts.length === 0 ? (
            <EmptyState
              icon={Film}
              title="Aucun contenu"
              description="Aucune publication n'est encore associée à ce client."
              actionLabel="Planifier un réel"
              onAction={() => router.push('/content-planner/new')}
            />
          ) : (
            <div className="space-y-2">
              {contentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border text-xs">
                  <div>
                    <div className="font-bold text-mv-ink">{post.title}</div>
                    <div className="text-mv-ink-soft mt-0.5">{post.format}</div>
                  </div>
                  <Badge variant="neutral">{post.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Portal Messages */}
      <Card
        header={
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-mv-green" />
            <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Messages du Portail</h3>
          </div>
        }
      >
        {messages.length === 0 ? (
          <EmptyState icon={MessageSquare} title="Aucun message" description="Aucun échange n'a encore eu lieu via le portail client." />
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto mb-3">
            {messages.map((msg) => (
              <div key={msg.id} className="p-3 rounded-lg bg-mv-cream-soft border border-mv-border text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <Badge variant={msg.sender_role === 'client' ? 'blue' : 'green'}>
                      {msg.sender_role === 'client' ? 'Client' : 'Équipe'}
                    </Badge>
                    <span className="font-semibold text-mv-ink">{msg.sender_name}</span>
                  </span>
                  <span className="text-mv-ink-faint">{new Date(msg.created_at).toLocaleString('fr-CA')}</span>
                </div>
                <p className="text-mv-ink">{msg.body}</p>
              </div>
            ))}
          </div>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!replyDraft.trim()) return;
            setSendingReply(true);
            const ok = await sendReply(replyDraft);
            setSendingReply(false);
            if (ok) setReplyDraft('');
          }}
          className="flex items-center gap-2 pt-2 border-t border-mv-border"
        >
          <input
            type="text"
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            placeholder="Répondre au client…"
            className="flex-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3.5 py-2 text-xs text-mv-ink focus:outline-none focus:border-mv-green"
          />
          <button
            type="submit"
            disabled={sendingReply || !replyDraft.trim()}
            className="px-3 py-2 rounded-xl bg-mv-green hover:bg-mv-green-dark text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            {sendingReply ? '…' : 'Envoyer'}
          </button>
        </form>
      </Card>
    </div>
  );
}
