
-- Fix: Make association insert policy more restrictive
DROP POLICY IF EXISTS "Authenticated users can register associations" ON public.parent_associations;
CREATE POLICY "Authenticated users can register associations"
  ON public.parent_associations FOR INSERT
  TO authenticated
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Add update policy for own association
CREATE POLICY "Association owners can update own record"
  ON public.parent_associations FOR UPDATE
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Add select policy for own pending association
CREATE POLICY "Association owners can view own record"
  ON public.parent_associations FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Add policies for association_donations
CREATE POLICY "Associations can view own donations"
  ON public.association_donations FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM parent_associations pa 
    WHERE pa.id = association_donations.association_id 
    AND pa.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ));

-- Public can view donation totals (via parent_associations)
CREATE POLICY "Anyone can view donation records for approved associations"
  ON public.association_donations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM parent_associations pa 
    WHERE pa.id = association_donations.association_id 
    AND pa.status = 'approved'
  ));
