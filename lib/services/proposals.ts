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
  {
    id: 'ecommerce-and-ai-pack',
    title: 'Offre E-Commerce & Automatisation IA — Boutique & Assistant Support',
    deliverables: [
      {
        id: 'del-1',
        title: 'Boutique E-Commerce Shopify / Next.js Haute Conversion',
        category: 'Développement Web',
        description: 'Design sur-mesure, catalogue produits, paiement Stripe/Apple Pay et tunnel d’achat optimisé.',
        price_cad: 4500.0,
      },
      {
        id: 'del-2',
        title: 'Agent IA Support Client & Intégrations Automatisées',
        category: 'IA & Systèmes',
        description: 'Assistant IA connecté aux stocks et commandes (WhatsApp/Web), séquences de relance paniers.',
        price_cad: 1200.0,
      },
    ],
    total_monthly_cad: 299.0,
    scope_phases: [
      {
        phase_number: 1,
        title: 'Architecture & Cadrage IA',
        duration_weeks: 1,
        description: 'Cartographie des flux de données, arborescence e-commerce et prompt engineering de l’assistant.',
        deliverables: ['Schéma d’intégration', 'Base de connaissances IA'],
      },
      {
        phase_number: 2,
        title: 'Développement Web & Entraînement IA',
        duration_weeks: 2,
        description: 'Intégration du catalogue, tests de paiements et validation des réponses de l’agent virtuel.',
        deliverables: ['Boutique en staging', 'Simulations d’achats'],
      },
      {
        phase_number: 3,
        title: 'Déploiement en Production & Formation',
        duration_weeks: 1,
        description: 'Bascule DNS, activation des flux automatiques et session de formation pour l’équipe.',
        deliverables: ['Site en production', 'Guide vidéo de gestion'],
      },
    ],
  },
  {
    id: 'elite-retainer-pack',
    title: 'Offre Retainer Agence Élite 360 — Production Vidéo, Ads & Systèmes',
    deliverables: [
      {
        id: 'del-1',
        title: 'Accompagnement Retainer Mensuel Élite (Contrat 6 Mois)',
        category: 'Retainer Stratégique',
        description: '16 vidéos 4K par mois, gestion continue des campagnes Ads Meta/Google, maintenance technique & CRO.',
        price_cad: 2500.0,
      },
      {
        id: 'del-2',
        title: 'Setup Initial & Audit de Croissance Complet',
        category: 'Stratégie & Audit',
        description: 'Audit concurrentiel, refonte des tunnels de vente et configuration des tableaux de bord ROI.',
        price_cad: 950.0,
      },
    ],
    total_monthly_cad: 2500.0,
    scope_phases: [
      {
        phase_number: 1,
        title: 'Sprint Initial d’Audit & Production Batch 1',
        duration_weeks: 2,
        description: 'Tournage des 8 premières vidéos vedettes et restructuration des campagnes Ads.',
        deliverables: ['8 vidéos 4K livrées', 'Nouvelles campagnes actives'],
      },
      {
        phase_number: 2,
        title: 'Itération Hebdomadaire & Rituels de Croissance',
        duration_weeks: 4,
        description: 'Publication hebdomadaire, optimisation du ROAS et reporting mensuel avec la direction.',
        deliverables: ['Reporting ROI bi-mensuel', '8 vidéos additionnelles'],
      },
    ],
  },
];

export const STANDARD_CONTRACT_CLAUSES = [
  {
    title: '1. Objet et Portée du Contrat',
    content: "Le présent contrat de services professionnels régit la fourniture des livrables et prestations décrits au devis par Minerva Studio & Agence au profit du Client identifié. Toute prestation additionnelle non mentionnée fera l'objet d'un avenant écrit préalable.",
  },
  {
    title: '2. Modalités Financières, Acompte et Taxes',
    content: "Un acompte initial obligatoire de cinquante pour cent (50%) non remboursable est exigible dès la signature électronique pour déclencher la phase de cadrage. Le solde de cinquante pour cent (50%) est payable à la livraison finale. Les taxes applicables au Québec (TPS 5% et TVQ 9.975%) sont appliquées sur l'ensemble des montants en dollars canadiens (CAD).",
  },
  {
    title: '3. Propriété Intellectuelle et Droits d’Auteur',
    content: "Tous les droits de propriété intellectuelle sur les créations visuelles, montages vidéo, codes sources et configurations personnalisées demeurent la propriété exclusive de Minerva jusqu'au règlement intégral et complet de toutes les factures dues. Dès encaissement complet, les droits d'exploitation commerciale sont transférés au Client pour son usage direct.",
  },
  {
    title: '4. Cycles de Révision et Approbations',
    content: "Chaque livrable intermédiaire bénéficie d'un maximum de deux (2) cycles de révision inclus dans le forfait, devant être soumis par écrit dans un délai de sept (7) jours ouvrables suivant la présentation. À défaut de retour écrit dans ce délai, le livrable est réputé définitivement accepté et validé.",
  },
  {
    title: '5. Droit Applicable et Juridiction Compétente',
    content: "Le présent contrat est régi et interprété conformément aux lois en vigueur dans la province de Québec et aux lois fédérales du Canada qui s'y appliquent. En cas de différend non résolu à l'amiable, les parties attribuent compétence exclusive aux tribunaux du district judiciaire de Montréal.",
  },
];

const LOCAL_PROPOSALS_KEY = 'minerva_commercial_proposals_cache';

function getLocalProposals(): CommercialProposal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_PROPOSALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalProposal(prop: CommercialProposal) {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalProposals();
    const filtered = list.filter((p) => p.id !== prop.id);
    localStorage.setItem(LOCAL_PROPOSALS_KEY, JSON.stringify([prop, ...filtered]));
  } catch {}
}

function removeLocalProposal(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalProposals();
    localStorage.setItem(LOCAL_PROPOSALS_KEY, JSON.stringify(list.filter((p) => p.id !== id)));
  } catch {}
}

export async function fetchProposals(): Promise<CommercialProposal[]> {
  try {
    const { data, error } = await getSupabase()
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as CommercialProposal[];
    }
  } catch (err) {
    console.warn('[ProposalsService] Supabase query failed, checking local cache:', err);
  }
  return getLocalProposals();
}

export async function fetchProposalByToken(token: string): Promise<CommercialProposal | null> {
  try {
    const { data, error } = await getSupabase()
      .from('proposals')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (!error && data) {
      return data as CommercialProposal;
    }
  } catch {}
  return getLocalProposals().find((p) => p.token === token) || null;
}

export async function deleteProposal(id: string): Promise<boolean> {
  try {
    const { error } = await getSupabase().from('proposals').delete().eq('id', id);
    removeLocalProposal(id);
    return !error;
  } catch {
    removeLocalProposal(id);
    return true;
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
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prop-${Date.now()}`,
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
    const { data, error } = await getSupabase().from('proposals').insert([proposalObj]).select().single();
    if (!error && data) {
      saveLocalProposal(data as CommercialProposal);
      return data as CommercialProposal;
    }
  } catch {}

  saveLocalProposal(proposalObj);
  return proposalObj;
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
