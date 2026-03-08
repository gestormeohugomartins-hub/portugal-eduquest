
-- Achievements definitions
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon text DEFAULT '🏆',
  xp_reward integer DEFAULT 0,
  coins_reward integer DEFAULT 0,
  diamonds_reward integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- Player achievements (unlocked)
CREATE TABLE public.player_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(student_id, achievement_id)
);

ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own achievements" ON public.player_achievements FOR SELECT USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = player_achievements.student_id AND students.user_id = auth.uid())
);
CREATE POLICY "Students can insert own achievements" ON public.player_achievements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM students WHERE students.id = player_achievements.student_id AND students.user_id = auth.uid())
);
CREATE POLICY "Parents can view children achievements" ON public.player_achievements FOR SELECT USING (
  EXISTS (SELECT 1 FROM students WHERE students.id = player_achievements.student_id AND students.parent_id = auth.uid())
);

-- Promo/gift codes
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent integer DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  target_user_id uuid,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage promo codes" ON public.promo_codes FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can validate codes" ON public.promo_codes FOR SELECT USING (is_active = true);

-- Seed default achievements
INSERT INTO public.achievements (key, title, description, icon, xp_reward, coins_reward, diamonds_reward) VALUES
  ('first_building', 'Primeiro Tijolo', 'Constrói o teu primeiro edifício', '🧱', 50, 20, 0),
  ('ten_buildings', 'Mestre Construtor', 'Constrói 10 edifícios', '🏘️', 150, 50, 5),
  ('village_level_3', 'Aldeia em Crescimento', 'Atinge o nível 3 da aldeia', '📈', 100, 30, 2),
  ('village_level_5', 'Grande Aldeia', 'Atinge o nível 5 da aldeia', '🏰', 300, 100, 10),
  ('quiz_10', 'Estudante Aplicado', 'Responde corretamente a 10 quizzes', '📚', 50, 20, 0),
  ('quiz_50', 'Sábio da Aldeia', 'Responde corretamente a 50 quizzes', '🎓', 200, 80, 5),
  ('quiz_100', 'Mestre do Conhecimento', 'Responde corretamente a 100 quizzes', '🧠', 500, 200, 15),
  ('first_trade', 'Comerciante', 'Faz a tua primeira troca', '🤝', 30, 15, 0),
  ('first_battle_win', 'Guerreiro', 'Ganha a tua primeira batalha', '⚔️', 50, 25, 2),
  ('premium_member', 'Membro Premium', 'Ativa a subscrição Premium', '👑', 100, 50, 10);
