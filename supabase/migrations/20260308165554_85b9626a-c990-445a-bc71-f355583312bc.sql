
-- Monument educational info table
CREATE TABLE public.monument_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_def_id text NOT NULL UNIQUE,
  district text NOT NULL,
  full_name text NOT NULL,
  historical_period text,
  year_built text,
  description_short text NOT NULL,
  description_long text NOT NULL,
  fun_fact text,
  educational_topic text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.monument_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view monument info"
  ON public.monument_info FOR SELECT
  USING (true);

-- Monument questions table
CREATE TABLE public.monument_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monument_id uuid REFERENCES public.monument_info(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  difficulty integer DEFAULT 1,
  school_year text DEFAULT '1',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.monument_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view monument questions"
  ON public.monument_questions FOR SELECT
  USING (true);
