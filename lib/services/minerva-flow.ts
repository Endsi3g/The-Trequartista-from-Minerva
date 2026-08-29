// Minerva Flow Service — SaaS Operations, Restaurant Telemetry & Commission Calculator
import { getSupabase } from '@/lib/supabase/client';
import type { MinervaFlowRestaurant, FlowTelemetrySummary, RestaurantAudit } from '@/lib/types';

export const DEFAULT_COMMISSION_RATE_PCT = 28.0; // Typical UberEats / DoorDash commission in QC (25-30%)
export const MINERVA_FLOW_MONTHLY_PRICE_CAD = 149.0;

export interface CommissionSavingsResult {
  monthlyVolumeCad: number;
  commissionRatePct: number;
  monthlyCommissionPaidCad: number;
  annualCommissionPaidCad: number;
  flowAnnualCostCad: number;
  netAnnualSavingsCad: number;
  savingsRoiPercentage: number;
}

export function calculateCommissionSavings(
  monthlyDeliveryVolumeCad: number,
  commissionRatePct: number = DEFAULT_COMMISSION_RATE_PCT
): CommissionSavingsResult {
  const vol = Math.max(0, Number(monthlyDeliveryVolumeCad) || 0);
  const rate = Math.max(1, Number(commissionRatePct) || DEFAULT_COMMISSION_RATE_PCT);

  const monthlyCommissionPaid = Math.round(vol * (rate / 100) * 100) / 100;
  const annualCommissionPaid = Math.round(monthlyCommissionPaid * 12 * 100) / 100;
  const flowAnnualCost = Math.round(MINERVA_FLOW_MONTHLY_PRICE_CAD * 12 * 100) / 100;
  const netAnnualSavings = Math.max(0, Math.round((annualCommissionPaid - flowAnnualCost) * 100) / 100);
  const savingsRoiPercentage = flowAnnualCost > 0 ? Math.round((netAnnualSavings / flowAnnualCost) * 100) : 0;

  return {
    monthlyVolumeCad: vol,
    commissionRatePct: rate,
    monthlyCommissionPaidCad: monthlyCommissionPaid,
    annualCommissionPaidCad: annualCommissionPaid,
    flowAnnualCostCad: flowAnnualCost,
    netAnnualSavingsCad: netAnnualSavings,
    savingsRoiPercentage,
  };
}

export const FALLBACK_FLOW_RESTAURANTS: MinervaFlowRestaurant[] = [
  {
    id: 'flow-rest-1',
    name: 'Café & Torréfacteur Saint-Henri',
    type: 'cafe',
    address: '3632 Rue Notre-Dame O, Montréal',
    city: 'Montréal',
    owner_name: 'Alexandre Bouchard',
    owner_email: 'alex@sainthenri.ca',
    owner_phone: '+1 (514) 932-0101',
    mrr_plan_cad: 149.0,
    orders_count_30d: 1420,
    revenue_volume_30d: 28400.0,
    commission_saved_30d: 7952.0,
    health_score: 98,
    status: 'active',
    pos_connected: true,
    qr_menu_active: true,
    has_studio_upsell: true,
    studio_upsell_notes: 'Pack 8 Reels Culinaires commandé + Ads Meta en cours.',
    connected_at: '2026-03-10T10:00:00Z',
    last_active_at: new Date().toISOString(),
  },
  {
    id: 'flow-rest-2',
    name: 'Pizzeria Napolitana Mile-End',
    type: 'restaurant',
    address: '189 Rue Saint-Viateur O, Montréal',
    city: 'Montréal',
    owner_name: 'Matteo Rossi',
    owner_email: 'matteo@napolitanamtl.com',
    owner_phone: '+1 (514) 279-8800',
    mrr_plan_cad: 199.0,
    orders_count_30d: 2180,
    revenue_volume_30d: 65400.0,
    commission_saved_30d: 18312.0,
    health_score: 94,
    status: 'active',
    pos_connected: true,
    qr_menu_active: true,
    has_studio_upsell: false,
    studio_upsell_notes: 'Fiche Google My Business à optimiser + Opportunité de refonte Framer.',
    connected_at: '2026-04-18T14:30:00Z',
    last_active_at: new Date().toISOString(),
  },
  {
    id: 'flow-rest-3',
    name: 'Bistro & Buvette Laurier',
    type: 'bistro',
    address: '1240 Avenue Laurier E, Montréal',
    city: 'Montréal',
    owner_name: 'Camille Gagnon',
    owner_email: 'camille@buvettelaurier.ca',
    owner_phone: '+1 (514) 526-9090',
    mrr_plan_cad: 149.0,
    orders_count_30d: 890,
    revenue_volume_30d: 31150.0,
    commission_saved_30d: 8722.0,
    health_score: 72,
    status: 'churn_risk',
    pos_connected: true,
    qr_menu_active: false,
    has_studio_upsell: false,
    studio_upsell_notes: 'Baisse de commandes en direct : proposer shooting vidéo menu printemps.',
    connected_at: '2026-05-02T11:15:00Z',
    last_active_at: new Date().toISOString(),
  },
  {
    id: 'flow-rest-4',
    name: 'Boulangerie & Pâtisserie L’Épi Doré',
    type: 'boulangerie',
    address: '450 Rue Rachel E, Montréal',
    city: 'Montréal',
    owner_name: 'Jean-Luc Moreau',
    owner_email: 'jl@epidore.ca',
    owner_phone: '+1 (514) 844-3322',
    mrr_plan_cad: 149.0,
    orders_count_30d: 1120,
    revenue_volume_30d: 19600.0,
    commission_saved_30d: 5488.0,
    health_score: 96,
    status: 'active',
    pos_connected: true,
    qr_menu_active: true,
    has_studio_upsell: true,
    studio_upsell_notes: 'Refonte Site Framer livrée avec succès.',
    connected_at: '2026-06-12T09:00:00Z',
    last_active_at: new Date().toISOString(),
  },
];

export async function fetchFlowRestaurants(): Promise<MinervaFlowRestaurant[]> {
  try {
    const { data, error } = await getSupabase()
      .from('minerva_flow_restaurants')
      .select('*')
      .order('revenue_volume_30d', { ascending: false });

    if (error || !data || data.length === 0) {
      return FALLBACK_FLOW_RESTAURANTS;
    }
    return data as MinervaFlowRestaurant[];
  } catch {
    return FALLBACK_FLOW_RESTAURANTS;
  }
}

export function computeFlowTelemetrySummary(restaurants: MinervaFlowRestaurant[]): FlowTelemetrySummary {
  const active = restaurants.filter((r) => r.status === 'active' || r.status === 'trial');
  const churnRisk = restaurants.filter((r) => r.status === 'churn_risk');
  const totalRev = restaurants.reduce((acc, r) => acc + (Number(r.revenue_volume_30d) || 0), 0);
  const totalSaved = restaurants.reduce((acc, r) => acc + (Number(r.commission_saved_30d) || 0), 0);
  const mrrTotal = active.reduce((acc, r) => acc + (Number(r.mrr_plan_cad) || 0), 0);
  const upsellOpp = restaurants.filter((r) => !r.has_studio_upsell).length;

  return {
    total_restaurants: restaurants.length,
    active_restaurants: active.length,
    churn_risk_restaurants: churnRisk.length,
    total_revenue_processed_cad: totalRev,
    total_commissions_saved_cad: totalSaved,
    mrr_saas_cad: mrrTotal,
    upsell_opportunities_count: upsellOpp,
  };
}

export async function createRestaurantAudit(payload: {
  restaurant_name: string;
  contact_name: string;
  email?: string;
  phone?: string;
  monthly_ubereats_volume_cad: number;
  commission_rate_pct?: number;
  website_url?: string;
  gmb_rating?: number;
}): Promise<RestaurantAudit> {
  const rate = payload.commission_rate_pct || DEFAULT_COMMISSION_RATE_PCT;
  const calc = calculateCommissionSavings(payload.monthly_ubereats_volume_cad, rate);
  const token = `aud_flow_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  const auditObj: RestaurantAudit = {
    id: `audit-${Date.now()}`,
    restaurant_name: payload.restaurant_name,
    contact_name: payload.contact_name,
    email: payload.email || null,
    phone: payload.phone || null,
    monthly_ubereats_volume_cad: calc.monthlyVolumeCad,
    commission_rate_pct: calc.commissionRatePct,
    annual_loss_cad: calc.annualCommissionPaidCad,
    projected_flow_savings_cad: calc.netAnnualSavingsCad,
    gmb_rating: payload.gmb_rating || 4.3,
    website_url: payload.website_url || null,
    audit_token: token,
    status: 'new',
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await getSupabase()
      .from('restaurant_audits')
      .insert([auditObj])
      .select()
      .single();

    if (error || !data) {
      console.warn('[MinervaFlow] Audit saved locally fallback:', error);
      return auditObj;
    }
    return data as RestaurantAudit;
  } catch {
    return auditObj;
  }
}

export async function fetchRestaurantAuditByToken(token: string): Promise<RestaurantAudit | null> {
  try {
    const { data, error } = await getSupabase()
      .from('restaurant_audits')
      .select('*')
      .eq('audit_token', token)
      .maybeSingle();

    if (error || !data) {
      // Fallback preview
      return {
        id: 'audit-demo-1',
        restaurant_name: 'Bistro & Grill Urbain',
        contact_name: 'Propriétaire',
        email: 'direction@grillurbain.ca',
        phone: '+1 (514) 555-0198',
        monthly_ubereats_volume_cad: 18500.0,
        commission_rate_pct: 28.0,
        annual_loss_cad: 62160.0,
        projected_flow_savings_cad: 60372.0,
        gmb_rating: 4.1,
        website_url: 'https://minervaflow.framer.website/',
        audit_token: token,
        status: 'viewed',
        created_at: new Date().toISOString(),
      };
    }
    return data as RestaurantAudit;
  } catch {
    return null;
  }
}
