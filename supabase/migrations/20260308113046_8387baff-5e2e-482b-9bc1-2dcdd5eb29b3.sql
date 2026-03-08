-- Enum para tipos de itens da loja
CREATE TYPE public.shop_item_type AS ENUM ('building', 'decoration', 'powerup', 'defense');

-- Enum para raridade dos itens
CREATE TYPE public.item_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');

-- Enum para tipo de missão
CREATE TYPE public.mission_type AS ENUM ('daily', 'weekly', 'monthly');

-- Tabela de itens da loja
CREATE TABLE public.shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  item_type shop_item_type NOT NULL,
  rarity item_rarity NOT NULL DEFAULT 'common',
  price_coins integer DEFAULT 0,
  price_diamonds integer DEFAULT 0,
  min_village_level integer DEFAULT 1,
  min_school_year school_year DEFAULT '1',
  defense_bonus integer DEFAULT 0,
  citizen_bonus integer DEFAULT 0,
  xp_bonus integer DEFAULT 0,
  image_url text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Inventário do jogador
CREATE TABLE public.player_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES shop_items(id),
  quantity integer DEFAULT 1,
  purchased_at timestamptz DEFAULT now(),
  UNIQUE(student_id, item_id)
);

-- Missões disponíveis
CREATE TABLE public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  mission_type mission_type NOT NULL,
  target_count integer NOT NULL DEFAULT 5,
  reward_coins integer DEFAULT 0,
  reward_diamonds integer DEFAULT 0,
  reward_xp integer DEFAULT 0,
  subject subject,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Progresso das missões do jogador
CREATE TABLE public.player_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES missions(id),
  progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Batalhas/Ataques
CREATE TABLE public.battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enemy_name text NOT NULL,
  enemy_type text NOT NULL,
  enemy_level integer NOT NULL DEFAULT 1,
  enemy_health integer NOT NULL,
  damage_dealt integer DEFAULT 0,
  battle_won boolean,
  rewards_coins integer DEFAULT 0,
  rewards_diamonds integer DEFAULT 0,
  rewards_xp integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Testes mensais
CREATE TABLE public.monthly_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  school_year school_year NOT NULL,
  subject subject NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  question_count integer DEFAULT 20,
  bonus_coins integer DEFAULT 100,
  bonus_diamonds integer DEFAULT 10,
  bonus_xp integer DEFAULT 500,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(school_year, subject, month, year)
);

-- Resultados dos testes mensais
CREATE TABLE public.monthly_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  test_id uuid NOT NULL REFERENCES monthly_tests(id),
  score integer NOT NULL,
  total_questions integer NOT NULL,
  percentage numeric(5,2) NOT NULL,
  bonus_earned boolean DEFAULT false,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(student_id, test_id)
);

-- Adicionar escola aos estudantes para rankings
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_name text;

-- RLS Policies
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop items" ON public.shop_items FOR SELECT USING (true);
CREATE POLICY "Students can view own inventory" ON public.player_inventory FOR SELECT USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_inventory.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Students can manage own inventory" ON public.player_inventory FOR ALL USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_inventory.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Anyone can view missions" ON public.missions FOR SELECT USING (true);
CREATE POLICY "Students can view own missions" ON public.player_missions FOR SELECT USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_missions.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Students can manage own missions" ON public.player_missions FOR ALL USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_missions.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Students can view own battles" ON public.battles FOR SELECT USING (EXISTS (SELECT 1 FROM students WHERE students.id = battles.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Students can manage own battles" ON public.battles FOR ALL USING (EXISTS (SELECT 1 FROM students WHERE students.id = battles.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Anyone can view monthly tests" ON public.monthly_tests FOR SELECT USING (true);
CREATE POLICY "Students can view own test results" ON public.monthly_test_results FOR SELECT USING (EXISTS (SELECT 1 FROM students WHERE students.id = monthly_test_results.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Students can insert own test results" ON public.monthly_test_results FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM students WHERE students.id = monthly_test_results.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Parents can view children inventory" ON public.player_inventory FOR SELECT USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_inventory.student_id AND students.parent_id = auth.uid()));
CREATE POLICY "Parents can view children missions" ON public.player_missions FOR SELECT USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_missions.student_id AND students.parent_id = auth.uid()));
CREATE POLICY "Parents can view children battles" ON public.battles FOR SELECT USING (EXISTS (SELECT 1 FROM students WHERE students.id = battles.student_id AND students.parent_id = auth.uid()));
CREATE POLICY "Parents can view children test results" ON public.monthly_test_results FOR SELECT USING (EXISTS (SELECT 1 FROM students WHERE students.id = monthly_test_results.student_id AND students.parent_id = auth.uid()));