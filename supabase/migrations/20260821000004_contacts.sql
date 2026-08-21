-- ============================================================================
-- CONTACTS
-- A team-wide professional rolodex, distinct from the sales-pipeline `leads`
-- table -- people met at events/networking, with a note/SMS/email history
-- and an explicit "convert to lead" path once real interest is confirmed.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    company TEXT,
    role_title TEXT,
    sector TEXT,
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    facebook_url TEXT,
    website_url TEXT,
    met_at_event TEXT,
    met_at_location TEXT,
    met_at_date DATE,
    follow_up_date DATE,
    follow_up_note TEXT,
    converted_to_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contact_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'note' CHECK (channel IN ('note', 'sms', 'email')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.contacts;
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;

-- Team-wide (admin + member), no client access -- matches the "toute
-- l'équipe pour l'instant" decision. Not gated by member_can() the way
-- leads_select/leads_manage are, since there's deliberately no permission
-- toggle for this yet.
DROP POLICY IF EXISTS "contacts_team" ON public.contacts;
CREATE POLICY "contacts_team" ON public.contacts FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'))
    WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));

DROP POLICY IF EXISTS "contact_notes_team" ON public.contact_notes;
CREATE POLICY "contact_notes_team" ON public.contact_notes FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'))
    WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));
