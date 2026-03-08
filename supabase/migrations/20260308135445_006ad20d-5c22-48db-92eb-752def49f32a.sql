
CREATE TABLE public.trade_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  offer_coins INTEGER NOT NULL DEFAULT 0,
  offer_food INTEGER NOT NULL DEFAULT 0,
  request_coins INTEGER NOT NULL DEFAULT 0,
  request_food INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.trade_offers ENABLE ROW LEVEL SECURITY;

-- Students can view trades they're part of
CREATE POLICY "Students can view own trades" ON public.trade_offers
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = trade_offers.sender_id AND students.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM students WHERE students.id = trade_offers.receiver_id AND students.user_id = auth.uid())
  );

-- Students can create trades as sender
CREATE POLICY "Students can create trades" ON public.trade_offers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE students.id = trade_offers.sender_id AND students.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM friendships WHERE friendships.status = 'approved' AND (
      (friendships.requester_id = trade_offers.sender_id AND friendships.receiver_id = trade_offers.receiver_id)
      OR (friendships.requester_id = trade_offers.receiver_id AND friendships.receiver_id = trade_offers.sender_id)
    ))
  );

-- Receiver can update (accept/reject)
CREATE POLICY "Receiver can update trades" ON public.trade_offers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = trade_offers.receiver_id AND students.user_id = auth.uid())
  );

-- Parents can view children's trades
CREATE POLICY "Parents can view children trades" ON public.trade_offers
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM students WHERE (students.id = trade_offers.sender_id OR students.id = trade_offers.receiver_id) AND students.parent_id = auth.uid())
  );
