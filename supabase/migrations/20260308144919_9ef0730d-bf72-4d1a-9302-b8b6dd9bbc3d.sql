
-- Push subscriptions table
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own subscriptions"
  ON public.push_subscriptions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM students WHERE students.id = push_subscriptions.student_id AND students.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM students WHERE students.id = push_subscriptions.student_id AND students.user_id = auth.uid()));

CREATE POLICY "Service can read all subscriptions"
  ON public.push_subscriptions FOR SELECT
  TO authenticated
  USING (true);
