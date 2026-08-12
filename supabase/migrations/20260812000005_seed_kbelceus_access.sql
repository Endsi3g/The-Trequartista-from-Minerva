-- Fix: ensure kbelceus776@gmail.com can access the app
-- Run this in the Supabase SQL Editor if the migration was not applied

-- 1. Add to allowed_emails whitelist
insert into public.allowed_emails (email, note)
values ('kbelceus776@gmail.com', 'Accès manuel — compte fondateur')
on conflict (email) do nothing;

-- 2. If the user has already signed up, approve their profile automatically
update public.profiles
set approved = true
where id = (
  select id from auth.users
  where email = 'kbelceus776@gmail.com'
  limit 1
)
and approved = false;
