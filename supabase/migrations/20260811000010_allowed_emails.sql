-- Migration: allowed_emails table for manual email whitelist
-- Allows admins to grant access to non-@minervaflow.com emails

create table if not exists public.allowed_emails (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  note        text,
  added_by    uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

alter table public.allowed_emails enable row level security;

-- Only admins can manage allowed emails
create policy "Admins can manage allowed_emails"
  on public.allowed_emails
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Anyone authenticated can read (needed for auth validation)
create policy "Authenticated can read allowed_emails"
  on public.allowed_emails
  for select
  using (auth.role() = 'authenticated');

-- Seed: allow kbelceus776@gmail.com
insert into public.allowed_emails (email, note)
values ('kbelceus776@gmail.com', 'Accès manuel — compte fondateur')
on conflict (email) do nothing;
