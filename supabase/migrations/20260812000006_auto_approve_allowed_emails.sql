-- Migration: auto approve allowed emails and minervaflow domain in trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'member',
    (
      split_part(lower(NEW.email), '@', 2) IN ('minervaflow.com', 'minerva.com')
      OR EXISTS (SELECT 1 FROM public.allowed_emails WHERE lower(email) = lower(NEW.email))
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
