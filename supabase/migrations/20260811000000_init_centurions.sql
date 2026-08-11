-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: Profiles (Minerva Team Members)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Manager', 'Collaborateur')),
  job_title TEXT NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  industry TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Onboarding', 'Paused', 'Archived')),
  mrr NUMERIC DEFAULT 0,
  health_status TEXT NOT NULL CHECK (health_status IN ('Ready', 'On Track', 'At Risk')),
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Client ROI Metrics
CREATE TABLE IF NOT EXISTS public.client_roi_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  leads_sent_30d INTEGER DEFAULT 0,
  leads_change_pct NUMERIC DEFAULT 0,
  sales_completed INTEGER DEFAULT 0,
  conversion_rate_pct NUMERIC DEFAULT 0,
  cost_per_lead NUMERIC DEFAULT 0,
  pipeline_value NUMERIC DEFAULT 0,
  roi_multiplier NUMERIC DEFAULT 0,
  total_invested NUMERIC DEFAULT 0,
  total_generated NUMERIC DEFAULT 0,
  top_keywords_rank_top3 INTEGER DEFAULT 0,
  total_keywords_tracked INTEGER DEFAULT 0,
  gmb_reviews_count INTEGER DEFAULT 0,
  gmb_rating NUMERIC DEFAULT 5.0,
  gmb_calls_count INTEGER DEFAULT 0,
  google_ads_spent NUMERIC DEFAULT 0,
  google_ads_leads INTEGER DEFAULT 0,
  google_ads_roas NUMERIC DEFAULT 0,
  weekly_leads_trend JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  current_stage TEXT NOT NULL CHECK (current_stage IN ('Onboarding', 'Design Framer', 'Launch Check', 'Live Production')),
  health TEXT NOT NULL CHECK (health IN ('Ready', 'On Track', 'Needs Review')),
  progress_pct INTEGER DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 5: Project Launch Checks (20 points)
CREATE TABLE IF NOT EXISTS public.project_launch_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  score_pct INTEGER DEFAULT 0,
  check_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 6: Content Posts
CREATE TABLE IF NOT EXISTS public.content_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('Reel 60s', 'Carrousel IG', 'Post LinkedIn', 'Story')),
  scheduled_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Idéation', 'Rédigé', 'Enregistré', 'Publié')),
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 7: Team Performance & 1-on-1 Reviews
CREATE TABLE IF NOT EXISTS public.team_performance_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  next_1on1_date TIMESTAMPTZ,
  okrs JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  feedbacks_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 8: Academy SOPs
CREATE TABLE IF NOT EXISTS public.academy_sops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  read_time_min INTEGER DEFAULT 5,
  author TEXT NOT NULL,
  video_url TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_roi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_launch_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_sops ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all tables
CREATE POLICY "Allow team read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow team read clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Allow team read client_roi_metrics" ON public.client_roi_metrics FOR SELECT USING (true);
CREATE POLICY "Allow team read projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow team read project_launch_checks" ON public.project_launch_checks FOR SELECT USING (true);
CREATE POLICY "Allow team read content_posts" ON public.content_posts FOR SELECT USING (true);
CREATE POLICY "Allow team read team_performance_reviews" ON public.team_performance_reviews FOR SELECT USING (true);
CREATE POLICY "Allow team read academy_sops" ON public.academy_sops FOR SELECT USING (true);

-- Allow authenticated users to insert/update data
CREATE POLICY "Allow team write clients" ON public.clients FOR ALL USING (true);
CREATE POLICY "Allow team write projects" ON public.projects FOR ALL USING (true);
CREATE POLICY "Allow team write project_launch_checks" ON public.project_launch_checks FOR ALL USING (true);
CREATE POLICY "Allow team write content_posts" ON public.content_posts FOR ALL USING (true);
CREATE POLICY "Allow team write team_performance_reviews" ON public.team_performance_reviews FOR ALL USING (true);
