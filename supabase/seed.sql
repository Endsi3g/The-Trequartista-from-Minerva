-- Seed Initial Profiles
INSERT INTO public.profiles (id, email, full_name, role, job_title, department)
VALUES 
  ('a1b2c3d4-0000-0000-0000-000000000001', 'alex@minervaflow.com', 'Alex Tremblay', 'Admin', 'Développeur Fullstack & Lead IA', 'Tech & IA'),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'sarah@minervaflow.com', 'Sarah Bouchard', 'Manager', 'Head of Client Growth & Success', 'Operations')
ON CONFLICT (email) DO NOTHING;

-- Seed Initial Clients
INSERT INTO public.clients (id, name, industry, status, mrr, health_status, contact_name, contact_email)
VALUES 
  ('c1b2c3d4-0000-0000-0000-000000000001', 'Apex Roofing', 'Toiture & Bâtiment', 'Active', 3800, 'Ready', 'David Miller', 'david@apexroofing.ca'),
  ('c1b2c3d4-0000-0000-0000-000000000002', 'Café Saint-Henri', 'Restauration & Cafés', 'Active', 2400, 'On Track', 'Sophie Tremblay', 'sophie@sthenricafe.com')
ON CONFLICT DO NOTHING;

-- Seed Initial Projects
INSERT INTO public.projects (id, client_id, name, current_stage, health, progress_pct, due_date)
VALUES 
  ('p1b2c3d4-0000-0000-0000-000000000001', 'c1b2c3d4-0000-0000-0000-000000000001', 'Refonte Site Framer & Automation Leads', 'Launch Check', 'Ready', 90, '2026-08-15'),
  ('p1b2c3d4-0000-0000-0000-000000000002', 'c1b2c3d4-0000-0000-0000-000000000002', 'Site Mobile-First & Click-to-WhatsApp', 'Design Framer', 'On Track', 65, '2026-08-22')
ON CONFLICT DO NOTHING;
