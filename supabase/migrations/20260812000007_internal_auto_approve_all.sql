-- Migration: Automatically approve ALL users for internal team usage
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
    TRUE -- Auto-approve all internal team members
  )
  ON CONFLICT (id) DO UPDATE SET approved = TRUE;
  RETURN NEW;
END;
$$;

-- Mark all existing registered profiles as approved
UPDATE public.profiles SET approved = TRUE WHERE approved = FALSE;
