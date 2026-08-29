-- ============================================================================
-- MINERVA TREQUARTISTA — MINERVA FLOW & STUDIO MARKETPLACE MIGRATION
-- Migration: 20260828000002_minerva_flow_and_studio.sql
-- ============================================================================

-- 1. Restaurants connectés à Minerva Flow (SaaS)
CREATE TABLE IF NOT EXISTS public.minerva_flow_restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'restaurant' CHECK (type IN ('restaurant', 'cafe', 'bistro', 'bar', 'boulangerie', 'fast_casual')),
    address TEXT,
    city TEXT DEFAULT 'Montréal',
    owner_name TEXT NOT NULL,
    owner_email TEXT,
    owner_phone TEXT,
    mrr_plan_cad NUMERIC(10,2) NOT NULL DEFAULT 149.00,
    orders_count_30d INT NOT NULL DEFAULT 0,
    revenue_volume_30d NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    commission_saved_30d NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    health_score INT NOT NULL DEFAULT 95 CHECK (health_score BETWEEN 0 AND 100),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'churn_risk', 'churned')),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    pos_connected BOOLEAN DEFAULT TRUE,
    qr_menu_active BOOLEAN DEFAULT TRUE,
    has_studio_upsell BOOLEAN DEFAULT FALSE,
    studio_upsell_notes TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Catalogue de Packs & Services Studio
CREATE TABLE IF NOT EXISTS public.studio_service_packages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('production_video', 'web_framer', 'acquisition_ads', 'operations_pos', 'branding')),
    description TEXT NOT NULL,
    price_cad NUMERIC(10,2) NOT NULL,
    recurring BOOLEAN DEFAULT FALSE,
    deliverable_days INT NOT NULL DEFAULT 7,
    features_list JSONB NOT NULL DEFAULT '[]',
    is_popular BOOLEAN DEFAULT FALSE,
    icon_name TEXT DEFAULT 'Sparkles',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Commandes de Services Studio depuis le Portail
CREATE TABLE IF NOT EXISTS public.studio_service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    package_id TEXT NOT NULL REFERENCES public.studio_service_packages(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_production', 'delivered', 'cancelled')),
    total_cad NUMERIC(10,2) NOT NULL,
    stripe_payment_link_url TEXT,
    notes TEXT,
    ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Audits & Diagnostics Restaurants (Passerelle Inbound Framer)
CREATE TABLE IF NOT EXISTS public.restaurant_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    monthly_ubereats_volume_cad NUMERIC(10,2) NOT NULL DEFAULT 15000.00,
    commission_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 28.00,
    annual_loss_cad NUMERIC(10,2) NOT NULL DEFAULT 50400.00,
    projected_flow_savings_cad NUMERIC(10,2) NOT NULL DEFAULT 42000.00,
    gmb_rating NUMERIC(3,1) DEFAULT 4.2,
    website_url TEXT,
    audit_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'contacted', 'converted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_flow_restaurants_status ON public.minerva_flow_restaurants(status);
CREATE INDEX IF NOT EXISTS idx_flow_restaurants_client_id ON public.minerva_flow_restaurants(client_id);
CREATE INDEX IF NOT EXISTS idx_studio_orders_client_id ON public.studio_service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_audits_token ON public.restaurant_audits(audit_token);

-- RLS & Sécurité
ALTER TABLE public.minerva_flow_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_audits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'minerva_flow_restaurants' AND policyname = 'flow_restaurants_auth_all') THEN
        CREATE POLICY "flow_restaurants_auth_all" ON public.minerva_flow_restaurants FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'studio_service_packages' AND policyname = 'studio_packages_read_all') THEN
        CREATE POLICY "studio_packages_read_all" ON public.studio_service_packages FOR SELECT TO authenticated, anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'studio_service_orders' AND policyname = 'studio_orders_auth_all') THEN
        CREATE POLICY "studio_orders_auth_all" ON public.studio_service_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'restaurant_audits' AND policyname = 'restaurant_audits_all') THEN
        CREATE POLICY "restaurant_audits_all" ON public.restaurant_audits FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
    END IF;
END $$;
