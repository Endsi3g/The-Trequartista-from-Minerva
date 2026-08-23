-- Adds bio column to public.contacts to store Instagram biography / account description
-- separately from follow_up_note (which is reserved for manual opener / follow-up notes).

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS bio TEXT;
