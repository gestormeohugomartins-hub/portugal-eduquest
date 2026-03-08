
-- Parent Associations table
CREATE TABLE public.parent_associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  president_name text NOT NULL,
  president_role text NOT NULL DEFAULT 'president',
  iban text,
  bank_account_holder text,
  ata_document_url text,
  bank_proof_url text,
  ata_updated_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  association_code text UNIQUE NOT NULL,
  total_raised numeric NOT NULL DEFAULT 0,
  total_paid numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.parent_associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved associations"
  ON public.parent_associations FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Authenticated users can register associations"
  ON public.parent_associations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Association code on students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS association_code text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS association_code_set_at timestamp with time zone;

-- Donations tracking
CREATE TABLE public.association_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid REFERENCES public.parent_associations(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 1.00,
  payment_id text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.association_donations ENABLE ROW LEVEL SECURITY;

-- Storage bucket for association documents
INSERT INTO storage.buckets (id, name, public) VALUES ('association-docs', 'association-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload association docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'association-docs');

CREATE POLICY "Authenticated users can view own association docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'association-docs');
