ALTER TABLE public.students ADD COLUMN IF NOT EXISTS subscription_type text DEFAULT null;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS premium_bonus_applied boolean DEFAULT false;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS annual_bonus_building text DEFAULT null;