
-- Add subscription-related columns to promo_codes
ALTER TABLE public.promo_codes 
  ADD COLUMN IF NOT EXISTS promo_type text NOT NULL DEFAULT 'discount',
  ADD COLUMN IF NOT EXISTS free_months integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_duration_months integer DEFAULT 0;

-- COMMENT: promo_type values: 'discount' (legacy), 'free_months', 'subscription_percent'
-- free_months: number of free months offered
-- discount_duration_months: how many months the percentage discount applies

-- Create subscription_discounts table for admin-applied discounts to existing subscribers
CREATE TABLE public.subscription_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  apply_to_all boolean NOT NULL DEFAULT false,
  discount_percent integer NOT NULL DEFAULT 0,
  target_months text[] NOT NULL DEFAULT '{}',
  applied boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

-- RLS
ALTER TABLE public.subscription_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscription discounts"
  ON public.subscription_discounts
  FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Students can view own discounts"
  ON public.subscription_discounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = subscription_discounts.student_id
        AND students.user_id = auth.uid()
    )
  );
