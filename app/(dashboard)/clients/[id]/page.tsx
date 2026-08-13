'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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
} from 'lucide-react';
import {
  fetchClients,
  fetchLeads,
  fetchProjects,
  fetchClientPaymentLinks,
  fetchTasks,
  fetchContentPosts,
  fetchClientMessages,
} from '@/lib/services/supabase-data';
import { Client, Lead, Project, ClientPaymentLink, Task, ContentPost, ClientMessage } from '@/lib/types';

const HEALTH_BADGE: Record<Client['health_status'], 'lime' | 'amber' | 'green'> = {
  Ready: 'lime',
  'On Track': 'green',
  'At Risk': 'amber',
};

const PAYMENT_STATUS_BADGE: Record<ClientPaymentLink['status'], 'green' | 'amber' | 'neutral'> = {
  paid: 'green',
  pending: 'amber',
  expired: 'neutral',
};

const TASK_STATUS_BADGE: Record<Task['status'], 'neutral' | 'amber' | 'green'> = {
  todo: 'neutral',
  in_progress: 'amber',
  done: 'green',
};

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [client, setClient] = useState<Client | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<ClientPaymentLink[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contentPosts, setContentPosts] = useState<ContentPost[]>([]);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

      const [leadsData, projectsData, paymentLinksData, tasksData, postsData, messagesData] = await Promise.all([
        fetchLeads(targetClient.id),
        fetchProjects(),
        fetchClientPaymentLinks(),
        fetchTasks(),
        fetchContentPosts(),
        fetchClientMessages(targetClient.id),
      ]);

      setLeads(leadsData);
      setProjects(projectsData.filter((p) => p.client_id === targetClient.id));
      setPaymentLinks(paymentLinksData.filter((l) => l.client_id === targetClient.id));
      setTasks(tasksData.filter((t) => t.client_id === targetClient.id));
      setContentPosts(postsData.filter((p) => p.client_id === targetClient.id));
      setMessages(messagesData);
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
      <div className="bg-mv-surface border border-mv-border rounded-xl p-6 shadow-mv-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={client.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(client.name)}&backgroundColor=1c9a6f&fontColor=ffffff`}
            alt={client.name}
            className="w-14 h-14 rounded-xl object-cover border border-mv-border shadow-mv-sm"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl lg:text-2xl font-extrabold text-mv-ink font-display">{client.name}</h1>
              <Badge variant={client.status === 'Active' ? 'green' : 'amber'}>{client.status}</Badge>
              <Badge variant={HEALTH_BADGE[client.health_status]}>● {client.health_status}</Badge>
            </div>
            <p className="text-xs text-mv-ink-soft mt-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> {client.industry}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <InviteClientButton clientId={client.id} />
          <Link href={`/clients/${client.id}/roi-tracker`}>
            <Button variant="primary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
              Suivi ROI
            </Button>
          </Link>
        </div>
      </div>

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
          <EmptyState icon={FolderKanban} title="Aucun projet" description="Aucun projet n'est encore associé à ce client." />
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
                <Badge variant={p.health === 'Ready' ? 'lime' : p.health === 'On Track' ? 'green' : 'amber'}>
                  {p.progress_pct}%
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>

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
            <EmptyState icon={Target} title="Aucun lead" description="Aucun lead n'est encore lié à ce client." />
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border text-xs">
                  <div>
                    <div className="font-bold text-mv-ink">{lead.contact_name}</div>
                    <div className="text-mv-ink-soft mt-0.5">{lead.service_requested}</div>
                  </div>
                  <Badge variant={lead.status === 'Gagné' ? 'green' : lead.status === 'Perdu' ? 'red' : 'neutral'}>
                    {lead.status}
                  </Badge>
                </div>
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
            <EmptyState icon={CheckSquare} title="Aucune tâche" description="Aucune tâche n'est encore liée à ce client." />
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
                  <Badge variant={TASK_STATUS_BADGE[task.status]}>{task.status}</Badge>
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
            <EmptyState icon={Film} title="Aucun contenu" description="Aucune publication n'est encore associée à ce client." />
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
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className="p-3 rounded-lg bg-mv-cream-soft border border-mv-border text-xs">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant={msg.sender_role === 'client' ? 'lime' : 'green'}>
                    {msg.sender_role === 'client' ? 'Client' : 'Équipe'}
                  </Badge>
                  <span className="text-mv-ink-faint">{new Date(msg.created_at).toLocaleString('fr-CA')}</span>
                </div>
                <p className="text-mv-ink">{msg.body}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
