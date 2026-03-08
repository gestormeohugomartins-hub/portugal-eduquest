
-- Schools table for all Portuguese primary schools by district
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  district text NOT NULL,
  municipality text,
  school_group text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view schools" ON public.schools FOR SELECT USING (true);

-- Add premium and progression fields to students
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id),
  ADD COLUMN IF NOT EXISTS max_xp_free integer NOT NULL DEFAULT 500;

-- Index for fast lookups
CREATE INDEX idx_schools_district ON public.schools(district);
CREATE INDEX idx_schools_name ON public.schools(name);
