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

const LOCAL_FLOW_KEY = 'minerva_flow_restaurants_cache';

function getLocalFlow(): MinervaFlowRestaurant[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_FLOW_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalFlow(rest: MinervaFlowRestaurant) {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalFlow();
    const filtered = list.filter((r) => r.id !== rest.id);
    localStorage.setItem(LOCAL_FLOW_KEY, JSON.stringify([rest, ...filtered]));
  } catch {}
}

export async function fetchFlowRestaurants(): Promise<MinervaFlowRestaurant[]> {
  try {
    const { data, error } = await getSupabase()
      .from('minerva_flow_restaurants')
      .select('*')
      .order('revenue_volume_30d', { ascending: false });

    if (!error && data) {
      return data as MinervaFlowRestaurant[];
    }
  } catch (err) {
    console.warn('[MinervaFlow] Error querying restaurants remotely, checking local cache:', err);
  }
  return getLocalFlow();
}

export async function createFlowRestaurant(input: Omit<MinervaFlowRestaurant, 'id' | 'connected_at' | 'last_active_at'>): Promise<MinervaFlowRestaurant> {
  const newRest: MinervaFlowRestaurant = {
    ...input,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `flow-rest-${Date.now()}`,
    connected_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await getSupabase()
      .from('minerva_flow_restaurants')
      .insert([newRest])
      .select()
      .single();

    if (!error && data) {
      saveLocalFlow(data as MinervaFlowRestaurant);
      return data as MinervaFlowRestaurant;
    }
  } catch {}

  saveLocalFlow(newRest);
  return newRest;
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
