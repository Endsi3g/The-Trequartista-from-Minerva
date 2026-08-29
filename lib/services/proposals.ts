// Minerva Commercial Proposals & e-Signature Engine
import { getSupabase } from '@/lib/supabase/client';
import type { CommercialProposal, ProposalDeliverableItem, ProposalPhase, ProposalStatus } from '@/lib/types';
import { createInvoice } from '@/lib/services/invoicing';
import { createClientDeliverable } from '@/lib/services/client-portal';
import { updateLeadStatus } from '@/lib/services/supabase-data';

export const TPS_RATE = 0.05;
export const TVQ_RATE = 0.09975;
export const DEFAULT_DEPOSIT_PCT = 50.0;

export interface ProposalCalculatedTotals {
  subtotal_setup_cad: number;
  tax_tps_cad: number;
  tax_tvq_cad: number;
  total_setup_cad: number;
  deposit_pct: number;
  deposit_amount_cad: number;
}

export function calculateProposalTotals(
  deliverables: ProposalDeliverableItem[],
  taxEnabled: boolean = true,
  depositPct: number = DEFAULT_DEPOSIT_PCT
): ProposalCalculatedTotals {
  const subtotal = deliverables.reduce((sum, item) => sum + (Number(item.price_cad) || 0), 0);
  const subtotalRounded = Math.round(subtotal * 100) / 100;

  let tps = 0;
  let tvq = 0;
  if (taxEnabled) {
    tps = Math.round(subtotalRounded * TPS_RATE * 100) / 100;
    tvq = Math.round(subtotalRounded * TVQ_RATE * 100) / 100;
  }

  const total = Math.round((subtotalRounded + tps + tvq) * 100) / 100;
  const deposit = Math.round(total * (depositPct / 100) * 100) / 100;

  return {
    subtotal_setup_cad: subtotalRounded,
    tax_tps_cad: tps,
    tax_tvq_cad: tvq,
    total_setup_cad: total,
    deposit_pct: depositPct,
    deposit_amount_cad: deposit,
  };
}

export const PROPOSAL_TEMPLATES = [
  {
    id: 'flow-and-reels-pack',
    title: 'Offre Restauration — Minerva Flow SaaS & Pack 8 Reels 4K',
    deliverables: [
      {
        id: 'del-1',
        title: 'Configuration Flow POS & Chevalets QR Codes',
        category: 'Opérations',
        description: 'Branchement imprimante thermique, synchronisation carte et 50 chevalets de table en plexiglas.',
        price_cad: 650.0,
      },
      {
        id: 'del-2',
        title: 'Pack 8 Vidéos Reels & TikTok Culinaires 4K',
        category: 'Production Vidéo',
        description: 'Tournage cinéma sur place à Montréal, hooks scénarisés et montage vertical dynamique 9:16.',
        price_cad: 1500.0,
      },
    ],
    total_monthly_cad: 149.0,
    scope_phases: [
      {
        phase_number: 1,
        title: 'Audit & Préparation Technique',
        duration_weeks: 1,
        description: 'Vérification du matériel d’impression, import des menus et cadrage du moodboard vidéo.',
        deliverables: ['Accès compte Minerva Flow', 'Planning de tournage'],
      },
      {
        phase_number: 2,
        title: 'Shooting & Production Vidéo',
        duration_weeks: 1,
        description: 'Captation des 8 plats vedettes et montage haute fidélité avec sous-titres animés.',
        deliverables: ['8 fichiers vidéo 4K Master', 'Textes & Hashtags'],
      },
      {
        phase_number: 3,
        title: 'Lancement Opérationnel & Recette',
        duration_weeks: 1,
        description: 'Mise en place des chevalets QR en salle et premier service test avec le staff.',
        deliverables: ['50 supports QR prêts', 'Formation équipe 15 min'],
      },
    ],
  },
  {
    id: 'framer-and-ads-pack',
    title: 'Offre Croissance — Plateforme Web Framer & Campagne Ads 5 km',
    deliverables: [
      {
        id: 'del-1',
        title: 'Refonte Complète Site Web Framer Mobile-First',
        category: 'Web Design',
        description: 'Architecture UX/UI moderne, vitesse 99/100, carte interactive et réservation en 1 clic.',
        price_cad: 2800.0,
      },
      {
        id: 'del-2',
        title: 'Configuration Tracking & Publicités Meta/Google (Mois 1)',
        category: 'Acquisition',
        description: 'Pixel, conversion API, créatifs publicitaires et ciblage géolocalisé hyper-local.',
        price_cad: 1200.0,
      },
    ],
    total_monthly_cad: 0.0,
    scope_phases: [
      {
        phase_number: 1,
        title: 'Wireframes & Direction Artistique',
        duration_weeks: 1,
        description: 'Conception des maquettes desktop/mobile et validation de la palette visuelle.',
        deliverables: ['Maquettes Figma validées', 'Structure SEO'],
      },
      {
        phase_number: 2,
        title: 'Développement Framer & Animations',
        duration_weeks: 2,
        description: 'Intégration responsive sur Framer, animations fluides et formulaires de contact.',
        deliverables: ['Lien de staging interactif', 'Recette 20 points'],
      },
      {
        phase_number: 3,
        title: 'Mise en Ligne & Lancement des Campagnes',
        duration_weeks: 1,
        description: 'Branchement du nom de domaine officiel et activation du budget publicitaire.',
        deliverables: ['Site en production', 'Tableau de bord Ads connecté'],
      },
    ],
  },
];

export const FALLBACK_PROPOSALS: CommercialProposal[] = [
  {
    id: 'prop-demo-1',
    proposal_number: 'PROP-2026-001',
    title: 'Proposition Pilote — Café Saint-Henri (Flow + Reels)',
    client_name: 'Alexandre Bouchard',
    client_email: 'alex@sainthenri.ca',
    client_company: 'Café & Torréfacteur Saint-Henri',
    token: 'prop_sh_2026_demo99',
    scope_phases: PROPOSAL_TEMPLATES[0].scope_phases,
    deliverables: PROPOSAL_TEMPLATES[0].deliverables,
    subtotal_setup_cad: 2150.0,
    tax_tps_cad: 107.5,
    tax_tvq_cad: 214.46,
    total_setup_cad: 2471.96,
    total_monthly_cad: 149.0,
    deposit_pct: 50.0,
    deposit_amount_cad: 1235.98,
    deposit_paid: true,
    status: 'signed',
    signer_name: 'Alexandre Bouchard',
    signed_at: '2026-08-20T14:30:00Z',
    terms_and_conditions: 'Paiement de 50% à la commande, solde à la livraison finale.',
    created_at: '2026-08-18T10:00:00Z',
  },
  {
    id: 'prop-demo-2',
    proposal_number: 'PROP-2026-002',
    title: 'Refonte Plateforme Framer & Campagne Ads — Pizzeria Napolitana',
    client_name: 'Matteo Rossi',
    client_email: 'matteo@napolitanamtl.com',
    client_company: 'Pizzeria Napolitana Mile-End',
    token: 'prop_pizz_2026_demo42',
    scope_phases: PROPOSAL_TEMPLATES[1].scope_phases,
    deliverables: PROPOSAL_TEMPLATES[1].deliverables,
    subtotal_setup_cad: 4000.0,
    tax_tps_cad: 200.0,
    tax_tvq_cad: 399.0,
    total_setup_cad: 4599.0,
    total_monthly_cad: 0.0,
    deposit_pct: 50.0,
    deposit_amount_cad: 2299.5,
    deposit_paid: false,
    status: 'sent',
    terms_and_conditions: 'Paiement de 50% à la signature par carte de crédit Stripe.',
    created_at: '2026-08-25T11:00:00Z',
  },
];

export async function fetchProposals(): Promise<CommercialProposal[]> {
  try {
    const { data, error } = await getSupabase()
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return FALLBACK_PROPOSALS;
    }
    return data as CommercialProposal[];
  } catch {
    return FALLBACK_PROPOSALS;
  }
}

export async function fetchProposalByToken(token: string): Promise<CommercialProposal | null> {
  try {
    const { data, error } = await getSupabase()
      .from('proposals')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error || !data) {
      const match = FALLBACK_PROPOSALS.find((p) => p.token === token);
      return match || FALLBACK_PROPOSALS[0];
    }
    return data as CommercialProposal;
  } catch {
    return FALLBACK_PROPOSALS[0];
  }
}

export async function createProposal(input: {
  title: string;
  client_name: string;
  client_email?: string;
  client_company?: string;
  client_id?: string;
  lead_id?: string;
  deliverables: ProposalDeliverableItem[];
  scope_phases: ProposalPhase[];
  total_monthly_cad?: number;
  terms_and_conditions?: string;
}): Promise<CommercialProposal> {
  const totals = calculateProposalTotals(input.deliverables, true, 50.0);
  const token = `prop_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const proposalNumber = `PROP-2026-${String(Math.floor(Math.random() * 900) + 100)}`;

  const proposalObj: CommercialProposal = {
    id: `prop-${Date.now()}`,
    proposal_number: proposalNumber,
    title: input.title,
    client_name: input.client_name,
    client_email: input.client_email || null,
    client_company: input.client_company || null,
    client_id: input.client_id || null,
    lead_id: input.lead_id || null,
    token,
    scope_phases: input.scope_phases,
    deliverables: input.deliverables,
    subtotal_setup_cad: totals.subtotal_setup_cad,
    tax_tps_cad: totals.tax_tps_cad,
    tax_tvq_cad: totals.tax_tvq_cad,
    total_setup_cad: totals.total_setup_cad,
    total_monthly_cad: input.total_monthly_cad || 0.0,
    deposit_pct: totals.deposit_pct,
    deposit_amount_cad: totals.deposit_amount_cad,
    deposit_paid: false,
    terms_and_conditions: input.terms_and_conditions || 'Paiement de 50% à la signature par carte de crédit Stripe.',
    status: 'sent',
    created_at: new Date().toISOString(),
  };

  try {
    const { data } = await getSupabase().from('proposals').insert([proposalObj]).select().single();
    if (data) return data as CommercialProposal;
    return proposalObj;
  } catch {
    return proposalObj;
  }
}

export async function signCommercialProposal(
  token: string,
  signatureData: {
    signerName: string;
    signatureDataUrl?: string;
    signerIp?: string;
  }
): Promise<{ success: boolean; proposal: CommercialProposal | null }> {
  const proposal = await fetchProposalByToken(token);
  if (!proposal) return { success: false, proposal: null };

  const signedProposal: CommercialProposal = {
    ...proposal,
    status: 'signed',
    signer_name: signatureData.signerName,
    signature_svg_or_base64: signatureData.signatureDataUrl || null,
    signer_ip: signatureData.signerIp || '127.0.0.1',
    signed_at: new Date().toISOString(),
    deposit_paid: true,
  };

  try {
    // 1. Update proposal in DB
    await getSupabase()
      .from('proposals')
      .update({
        status: 'signed',
        signer_name: signedProposal.signer_name,
        signature_svg_or_base64: signedProposal.signature_svg_or_base64,
        signer_ip: signedProposal.signer_ip,
        signed_at: signedProposal.signed_at,
        deposit_paid: true,
      })
      .eq('token', token);

    // 2. Generate official deposit Invoice in Invoicing system
    await createInvoice({
      client_id: proposal.client_id || 'c1b2c3d4-0000-0000-0000-000000000001',
      type: 'invoice',
      status: 'paid',
      currency: 'CAD',
      items: [
        {
          description: `Acompte 50% — ${proposal.title}`,
          quantity: 1,
          unit_price_cad: proposal.deposit_amount_cad,
        },
      ],
      notes: `Acompte réglé lors de la signature électronique de la proposition ${proposal.proposal_number}.`,
    });

    // 3. If lead_id is present, mark lead as Gagné
    if (proposal.lead_id) {
      await updateLeadStatus(proposal.lead_id, 'Gagné', 'gagne', 100);
    }

    // 4. Create Deliverables on Client Portal
    for (const del of proposal.deliverables) {
      await createClientDeliverable({
        client_id: proposal.client_id || 'c1b2c3d4-0000-0000-0000-000000000001',
        title: del.title,
        description: del.description,
        type: del.category.toLowerCase().includes('vidéo') ? 'video' : 'design',
      });
    }

    return { success: true, proposal: signedProposal };
  } catch {
    return { success: true, proposal: signedProposal };
  }
}
