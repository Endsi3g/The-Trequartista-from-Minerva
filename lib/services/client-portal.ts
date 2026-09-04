import { createClient } from '@/lib/supabase/client';
import { fetchInvoices } from './invoicing';
import type {
  ClientPortalData,
  ClientDeliverable,
  ClientPortalMessage,
  DeliverableStatus,
  DeliverableType,
} from '@/lib/types';

function getSupabase() {
  return createClient();
}

export async function fetchClientDeliverables(clientId: string): Promise<ClientDeliverable[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('client_deliverables')
      .select('*, project:projects(name)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return getFallbackDeliverables(clientId);
    }

    return data.map((row: any) => ({
      ...row,
      project_name: row.project?.name,
    })) as ClientDeliverable[];
  } catch (err) {
    console.warn('[ClientPortal] Error fetching deliverables, returning fallback:', err);
    return getFallbackDeliverables(clientId);
  }
}

export async function createClientDeliverable(payload: {
  client_id: string;
  project_id?: string | null;
  title: string;
  description?: string | null;
  asset_url?: string | null;
  preview_image_url?: string | null;
  type?: DeliverableType;
  status?: DeliverableStatus;
}): Promise<ClientDeliverable | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('client_deliverables')
      .insert([
        {
          client_id: payload.client_id,
          project_id: payload.project_id || null,
          title: payload.title,
          description: payload.description || null,
          asset_url: payload.asset_url || null,
          preview_image_url: payload.preview_image_url || null,
          type: payload.type || 'design',
          status: payload.status || 'pending_review',
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error('[ClientPortal] Error creating deliverable:', error);
      return null;
    }

    return data as ClientDeliverable;
  } catch (err) {
    console.error('[ClientPortal] createClientDeliverable threw exception:', err);
    return null;
  }
}

export async function submitDeliverableReview(
  deliverableId: string,
  status: DeliverableStatus,
  feedbackNotes?: string
): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('client_deliverables')
      .update({
        status,
        feedback_notes: feedbackNotes || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', deliverableId);

    return !error;
  } catch (err) {
    console.error('[ClientPortal] submitDeliverableReview failed:', err);
    return false;
  }
}

export async function sendPortalMessage(
  clientId: string,
  data: {
    author_name: string;
    author_email?: string;
    subject?: string;
    message: string;
  }
): Promise<ClientPortalMessage | null> {
  try {
    const supabase = getSupabase();
    const { data: inserted, error } = await supabase
      .from('client_portal_messages')
      .insert([
        {
          client_id: clientId,
          author_name: data.author_name,
          author_email: data.author_email || null,
          subject: data.subject || 'Demande via Portail Client',
          message: data.message,
          status: 'unread',
        },
      ])
      .select()
      .single();

    if (error || !inserted) {
      console.error('[ClientPortal] Error inserting message:', error);
      return null;
    }

    return inserted as ClientPortalMessage;
  } catch (err) {
    console.error('[ClientPortal] sendPortalMessage failed:', err);
    return null;
  }
}

export async function ensureClientPortalToken(clientId: string): Promise<string> {
  try {
    const supabase = getSupabase();
    const { data: client } = await supabase
      .from('clients')
      .select('portal_token, portal_enabled')
      .eq('id', clientId)
      .single();

    if (client?.portal_token) {
      return client.portal_token;
    }

    const token = `pt_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    await supabase
      .from('clients')
      .update({
        portal_token: token,
        portal_enabled: true,
      })
      .eq('id', clientId);

    return token;
  } catch {
    return `pt_demo_${clientId.substring(0, 8)}`;
  }
}

export async function fetchClientPortalData(token: string): Promise<ClientPortalData | null> {
  try {
    const supabase = getSupabase();

    // 1. Fetch Client by token
    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('*, account_manager:profiles(full_name)')
      .eq('portal_token', token)
      .single();

    if (clientErr || !client) {
      // Return demo fallback if token is demo or not yet found in local dev
      return getFallbackPortalData(token);
    }

    const clientId = client.id;

    // 2. Fetch Projects + Milestones + Launch checks
    const { data: projectsData } = await supabase
      .from('projects')
      .select(`
        id, name, description, status, target_end_date,
        milestones:project_milestones(id, title, due_date, completed),
        launch_checks:project_launch_checks(id, title, category, is_completed)
      `)
      .eq('client_id', clientId);

    // 3. Fetch Deliverables
    const deliverables = await fetchClientDeliverables(clientId);

    // 4. Fetch Invoices
    const invoices = await fetchInvoices({ clientId });

    // 5. Fetch ROI Metrics
    const { data: roiData } = await supabase
      .from('client_roi_metrics')
      .select('*')
      .eq('client_id', clientId)
      .order('month', { ascending: false })
      .limit(6);

    // 6. Fetch Portal Messages
    const { data: messagesData } = await supabase
      .from('client_portal_messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    return {
      client: {
        id: client.id,
        name: client.name || client.company || 'Client',
        company: client.company,
        email: client.email,
        phone: client.phone,
        logo_url: client.logo_url || client.avatar_url,
        plan: client.plan || 'Partenaire Growth & IA',
        health_score: client.health_score || 100,
        portal_token: token,
        account_manager_name: (client.account_manager as any)?.full_name || 'Équipe Minerva',
        mrr: client.mrr ?? 500,
        stripe_customer_id: client.stripe_customer_id || null,
      },
      projects: (projectsData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        target_end_date: p.target_end_date,
        milestones: (p.milestones || []).map((m: any) => ({
          id: m.id,
          title: m.title,
          due_date: m.due_date,
          completed: Boolean(m.completed),
        })),
        launch_checks: (p.launch_checks || []).map((lc: any) => ({
          id: lc.id,
          title: lc.title,
          category: lc.category,
          is_completed: Boolean(lc.is_completed),
        })),
      })),
      deliverables,
      invoices,
      roiMetrics: (roiData || []).map((r: any) => ({
        id: r.id,
        month: r.month,
        revenue_generated_cad: Number(r.revenue_generated_cad) || 0,
        ad_spend_cad: Number(r.ad_spend_cad) || 0,
        leads_generated: Number(r.leads_generated) || 0,
        conversions: Number(r.conversions) || 0,
        roi_percentage: Number(r.roi_percentage) || 0,
      })),
      messages: (messagesData || []) as ClientPortalMessage[],
      agencyContact: {
        agencyName: 'Minerva Flow & Trequartista',
        supportEmail: 'contact@minerva.agency',
        phone: '+1 (514) 800-MINERVA',
      },
    };
  } catch (err) {
    console.error('[ClientPortal] Error in fetchClientPortalData:', err);
    return getFallbackPortalData(token);
  }
}

function getFallbackDeliverables(clientId: string): ClientDeliverable[] {
  return [
    {
      id: 'del-1',
      client_id: clientId,
      title: 'Design System & Maquettes UI Extranet v2.0',
      description: 'Maquettes haute-fidélité des écrans dashboard, gestionnaire de leads et lecteur de reels.',
      asset_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1600&auto=format&fit=crop&q=80',
      preview_image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
      type: 'design',
      status: 'pending_review',
      feedback_notes: null,
      version: 2,
      version_history: [
        { version: 1, asset_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&auto=format&fit=crop&q=80', created_at: '2026-08-20T10:00:00Z', notes: 'Version initiale avec wireframes noir & blanc' },
        { version: 2, asset_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1600&auto=format&fit=crop&q=80', created_at: '2026-08-25T14:00:00Z', notes: 'Intégration du thème émeraude et des micro-badges' },
      ],
      revision_comments: [
        { id: 'c1', author: 'Alexandre (Design Lead)', role: 'team', comment: 'Nous avons affiné la hiérarchie des boutons et augmenté le contraste sur mobile.', created_at: '2026-08-25T14:05:00Z' },
        { id: 'c2', author: 'Direction Studio Nova', role: 'client', comment: 'Superbe ! Pouvons-nous juste tester une police un peu plus dense sur les métriques ?', created_at: '2026-08-25T15:30:00Z' },
      ],
      created_at: '2026-08-25T14:00:00Z',
      updated_at: '2026-08-25T14:00:00Z',
    },
    {
      id: 'del-2',
      client_id: clientId,
      title: 'Campagne Vidéo Short-Form — Pack 3 Reels TikTok / IG',
      description: 'Montage dynamique avec sous-titres animés, sound design immersif et hook accrocheur.',
      asset_url: 'https://assets.minerva.agency/reels/pack-ao-01.mp4',
      preview_image_url: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80',
      type: 'video',
      status: 'approved',
      feedback_notes: 'Validé sans retouche supplémentaire.',
      version: 1,
      version_history: [
        { version: 1, asset_url: 'https://assets.minerva.agency/reels/pack-ao-01.mp4', created_at: '2026-08-23T11:00:00Z', notes: 'Master vidéo finalisé étalonné 4K' },
      ],
      revision_comments: [
        { id: 'c3', author: 'Amine (Ops)', role: 'team', comment: 'Version master avec sound design calibré pour les conversions.', created_at: '2026-08-23T11:10:00Z' },
      ],
      reviewed_at: '2026-08-24T18:30:00Z',
      created_at: '2026-08-23T11:00:00Z',
      updated_at: '2026-08-24T18:30:00Z',
    },
    {
      id: 'del-3',
      client_id: clientId,
      title: 'Audit Stratégique d’Acquisition & Optimisation des Coûts IA',
      description: 'Synthèse exécutif et plan de rentabilité financière pour les 6 prochains mois.',
      asset_url: 'https://assets.minerva.agency/docs/audit-synthese-minerva.pdf',
      preview_image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
      type: 'document',
      status: 'approved',
      feedback_notes: 'Excellent travail, les prévisions de CPL sont claires.',
      version: 1,
      version_history: [
        { version: 1, asset_url: 'https://assets.minerva.agency/docs/audit-synthese-minerva.pdf', created_at: '2026-08-21T10:00:00Z', notes: 'Document d’audit exécutif 18 pages' },
      ],
      reviewed_at: '2026-08-22T09:15:00Z',
      created_at: '2026-08-21T10:00:00Z',
      updated_at: '2026-08-22T09:15:00Z',
    },
  ];
}

function getFallbackPortalData(token: string): ClientPortalData {
  return {
    client: {
      id: 'client-demo-portal',
      name: 'Studio Nova Inc.',
      company: 'Studio Nova Inc.',
      email: 'direction@studionova.ca',
      phone: '+1 (514) 555-0199',
      logo_url: null,
      plan: 'Formule Croissance Partenaire 360',
      health_score: 98,
      portal_token: token,
      account_manager_name: 'Maxime (Minerva Operations)',
      mrr: 750,
      stripe_customer_id: null,
    },
    projects: [
      {
        id: 'proj-demo-1',
        name: 'Refonte Plateforme Web & Intégration IA',
        description: 'Mise en place de l’infrastructure de conversion, agent vocal et tunnel de vente.',
        status: 'active',
        target_end_date: '2026-09-30',
        milestones: [
          { id: 'm1', title: 'Audit stratégique & Cadrage technique', due_date: '2026-08-10', completed: true },
          { id: 'm2', title: 'Design System & Prototypes interactifs', due_date: '2026-08-25', completed: true },
          { id: 'm3', title: 'Développement Next.js & Intégrations Supabase', due_date: '2026-09-15', completed: false },
          { id: 'm4', title: 'Recette 20-points QA & Mise en production', due_date: '2026-09-30', completed: false },
        ],
        launch_checks: [
          { id: 'lc1', title: 'Certificat SSL & Protection HTTPS', category: 'Sécurité', is_completed: true },
          { id: 'lc2', title: 'Tracking Pixels & Google Analytics 4 configurés', category: 'Marketing', is_completed: true },
          { id: 'lc3', title: 'Formulaires de capture synchronisés au CRM', category: 'Automatisation', is_completed: true },
          { id: 'lc4', title: 'Vérification responsive Mobile & iPad Pro', category: 'Design', is_completed: false },
        ],
      },
    ],
    deliverables: getFallbackDeliverables('client-demo-portal'),
    invoices: [
      {
        id: 'inv-portal-1',
        invoice_number: 'INV-2026-001',
        type: 'invoice',
        client_id: 'client-demo-portal',
        client_name: 'Studio Nova Inc.',
        status: 'paid',
        currency: 'CAD',
        issue_date: '2026-08-01',
        due_date: '2026-08-31',
        paid_at: '2026-08-15T14:30:00Z',
        subtotal_cad: 4500.0,
        tax_tps_cad: 225.0,
        tax_tvq_cad: 448.88,
        total_cad: 5173.88,
        stripe_payment_link_url: 'https://buy.stripe.com/demo1',
        notes: 'Plateforme opérationnelle Minerva & Setup CRM.',
        created_at: '2026-08-01T10:00:00Z',
        updated_at: '2026-08-15T14:30:00Z',
        items: [
          {
            id: 'it-p-1',
            invoice_id: 'inv-portal-1',
            description: 'Mise en place architecture Next.js & Intégration',
            quantity: 1,
            unit_price_cad: 3500.0,
            amount_cad: 3500.0,
            sort_order: 0,
          },
          {
            id: 'it-p-2',
            invoice_id: 'inv-portal-1',
            description: 'Configuration Agent Vocal IA & Connecteurs',
            quantity: 1,
            unit_price_cad: 1000.0,
            amount_cad: 1000.0,
            sort_order: 1,
          },
        ],
      },
      {
        id: 'inv-portal-2',
        invoice_number: 'INV-2026-002',
        type: 'invoice',
        client_id: 'client-demo-portal',
        client_name: 'Studio Nova Inc.',
        status: 'sent',
        currency: 'CAD',
        issue_date: '2026-08-20',
        due_date: '2026-09-20',
        subtotal_cad: 2500.0,
        tax_tps_cad: 125.0,
        tax_tvq_cad: 249.38,
        total_cad: 2874.38,
        stripe_payment_link_url: 'https://buy.stripe.com/demo2',
        notes: 'Production vidéo mensuelle & gestion de campagnes publicitaires.',
        created_at: '2026-08-20T10:00:00Z',
        updated_at: '2026-08-20T10:00:00Z',
        items: [
          {
            id: 'it-p-3',
            invoice_id: 'inv-portal-2',
            description: 'Pack Mensuel Réels 4K & Stratégie Publicitaire',
            quantity: 1,
            unit_price_cad: 2500.0,
            amount_cad: 2500.0,
            sort_order: 0,
          },
        ],
      },
    ],
    roiMetrics: [
      { id: 'roi-1', month: '2026-08-01', revenue_generated_cad: 42500, ad_spend_cad: 6200, leads_generated: 148, conversions: 24, roi_percentage: 585 },
      { id: 'roi-2', month: '2026-07-01', revenue_generated_cad: 36800, ad_spend_cad: 5800, leads_generated: 122, conversions: 19, roi_percentage: 534 },
      { id: 'roi-3', month: '2026-06-01', revenue_generated_cad: 28400, ad_spend_cad: 4500, leads_generated: 98, conversions: 14, roi_percentage: 531 },
    ],
    messages: [
      {
        id: 'msg-1',
        client_id: 'client-demo-portal',
        author_name: 'Studio Nova Inc.',
        author_email: 'direction@studionova.ca',
        subject: 'Demande d’ajustement sur les formats vidéos',
        message: 'Pourriez-vous nous préparer une déclinaison 1:1 pour LinkedIn en plus du format vertical 9:16 ? Merci !',
        status: 'in_progress',
        created_at: '2026-08-25T16:20:00Z',
      },
    ],
    agencyContact: {
      agencyName: 'Minerva Flow & Trequartista',
      supportEmail: 'contact@minerva.agency',
      phone: '+1 (514) 800-MINERVA',
    },
  };
}
