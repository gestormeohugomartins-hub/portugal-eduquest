-- ============================================
-- BACKUPDB - Backup completo da base de dados
-- Gerado em: 2026-03-14
-- Compatível com importação Supabase
-- ============================================

-- =====================
-- 1. ENUMS
-- =====================
DO $$ BEGIN
  CREATE TYPE public.admin_role AS ENUM ('admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('parent', 'student');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.district AS ENUM (
    'aveiro','beja','braga','braganca','castelo_branco','coimbra','evora','faro',
    'guarda','leiria','lisboa','portalegre','porto','santarem','setubal',
    'viana_castelo','vila_real','viseu','acores','madeira'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.friendship_status AS ENUM ('pending_parent_approval', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.item_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.mission_type AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.resource_type AS ENUM ('coins', 'diamonds', 'citizens');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.resource_type_natural AS ENUM ('wood', 'stone', 'iron', 'coal', 'food', 'leather', 'fish');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.school_year AS ENUM ('1', '2', '3', '4');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.shop_item_type AS ENUM ('building', 'decoration', 'powerup', 'defense');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subject AS ENUM ('portugues', 'matematica', 'estudo_meio', 'ingles');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================
-- 2. TABLES
-- =====================

-- Schools
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  district text NOT NULL,
  municipality text,
  school_group text,
  locality text,
  created_at timestamptz DEFAULT now()
);

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  email text NOT NULL,
  role app_role NOT NULL DEFAULT 'parent',
  district district,
  accessibility_colorblind_filter text,
  accessibility_dyslexia boolean DEFAULT false,
  accessibility_magnifier boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Students
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  parent_id uuid NOT NULL,
  display_name text NOT NULL,
  nickname text,
  gender text DEFAULT 'indefinido',
  school_year school_year NOT NULL DEFAULT '1',
  district district,
  school_id uuid REFERENCES public.schools(id),
  school_name text,
  coins integer NOT NULL DEFAULT 0,
  diamonds integer NOT NULL DEFAULT 0,
  xp integer NOT NULL DEFAULT 0,
  citizens integer NOT NULL DEFAULT 10,
  village_level integer NOT NULL DEFAULT 1,
  defense_level integer NOT NULL DEFAULT 1,
  is_premium boolean NOT NULL DEFAULT false,
  premium_expires_at timestamptz,
  premium_bonus_applied boolean DEFAULT false,
  subscription_type text,
  max_xp_free integer NOT NULL DEFAULT 500,
  association_code text,
  association_code_set_at timestamptz,
  annual_bonus_building text,
  quiz_reminders_enabled boolean NOT NULL DEFAULT true,
  accessibility_colorblind_filter text,
  accessibility_dyslexia boolean DEFAULT false,
  accessibility_magnifier boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Authorized Emails
CREATE TABLE IF NOT EXISTS public.authorized_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  email text NOT NULL,
  school_year school_year DEFAULT '1',
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role admin_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  title text NOT NULL,
  description text,
  icon text DEFAULT '🏆',
  xp_reward integer DEFAULT 0,
  coins_reward integer DEFAULT 0,
  diamonds_reward integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Player Achievements
CREATE TABLE IF NOT EXISTS public.player_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  achievement_id uuid NOT NULL REFERENCES public.achievements(id),
  unlocked_at timestamptz DEFAULT now()
);

-- Buildings
CREATE TABLE IF NOT EXISTS public.buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  building_type text NOT NULL,
  position_x integer NOT NULL DEFAULT 0,
  position_y integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Questions
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  subject subject NOT NULL,
  school_year school_year NOT NULL,
  difficulty integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Quiz History
CREATE TABLE IF NOT EXISTS public.quiz_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  question_id uuid NOT NULL REFERENCES public.questions(id),
  answered_correctly boolean NOT NULL,
  reward_type resource_type,
  reward_amount integer DEFAULT 0,
  answered_at timestamptz NOT NULL DEFAULT now()
);

-- Missions
CREATE TABLE IF NOT EXISTS public.missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  mission_type mission_type NOT NULL,
  target_count integer NOT NULL DEFAULT 5,
  subject subject,
  reward_xp integer DEFAULT 0,
  reward_coins integer DEFAULT 0,
  reward_diamonds integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Player Missions
CREATE TABLE IF NOT EXISTS public.player_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  mission_id uuid NOT NULL REFERENCES public.missions(id),
  progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  expires_at timestamptz NOT NULL,
  assigned_at timestamptz DEFAULT now()
);

-- Player Resources
CREATE TABLE IF NOT EXISTS public.player_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  resource_type resource_type_natural NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Gathering Log
CREATE TABLE IF NOT EXISTS public.gathering_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  resource_type resource_type_natural NOT NULL,
  terrain_element_id integer NOT NULL,
  amount integer NOT NULL DEFAULT 1,
  gathered_at timestamptz NOT NULL DEFAULT now()
);

-- Friendships
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.students(id),
  receiver_id uuid NOT NULL REFERENCES public.students(id),
  status friendship_status NOT NULL DEFAULT 'pending_parent_approval',
  requester_parent_approved boolean NOT NULL DEFAULT false,
  receiver_parent_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.students(id),
  receiver_id uuid NOT NULL REFERENCES public.students(id),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trade Offers
CREATE TABLE IF NOT EXISTS public.trade_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.students(id),
  receiver_id uuid NOT NULL REFERENCES public.students(id),
  offer_coins integer NOT NULL DEFAULT 0,
  offer_food integer NOT NULL DEFAULT 0,
  request_coins integer NOT NULL DEFAULT 0,
  request_food integer NOT NULL DEFAULT 0,
  message text,
  status text NOT NULL DEFAULT 'pending',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Battles
CREATE TABLE IF NOT EXISTS public.battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  enemy_name text NOT NULL,
  enemy_type text NOT NULL,
  enemy_health integer NOT NULL,
  enemy_level integer NOT NULL DEFAULT 1,
  damage_dealt integer DEFAULT 0,
  battle_won boolean,
  rewards_xp integer DEFAULT 0,
  rewards_coins integer DEFAULT 0,
  rewards_diamonds integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  title text NOT NULL,
  message text NOT NULL,
  icon text DEFAULT '🔔',
  type text NOT NULL DEFAULT 'general',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Push Subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Shop Items
CREATE TABLE IF NOT EXISTS public.shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  item_type shop_item_type NOT NULL,
  rarity item_rarity NOT NULL DEFAULT 'common',
  price_coins integer DEFAULT 0,
  price_diamonds integer DEFAULT 0,
  xp_bonus integer DEFAULT 0,
  citizen_bonus integer DEFAULT 0,
  defense_bonus integer DEFAULT 0,
  image_url text,
  is_available boolean DEFAULT true,
  min_village_level integer DEFAULT 1,
  min_school_year school_year DEFAULT '1',
  created_at timestamptz DEFAULT now()
);

-- Player Inventory
CREATE TABLE IF NOT EXISTS public.player_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  item_id uuid NOT NULL REFERENCES public.shop_items(id),
  quantity integer DEFAULT 1,
  purchased_at timestamptz DEFAULT now()
);

-- Monthly Tests
CREATE TABLE IF NOT EXISTS public.monthly_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject subject NOT NULL,
  school_year school_year NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  question_count integer DEFAULT 20,
  bonus_xp integer DEFAULT 500,
  bonus_coins integer DEFAULT 100,
  bonus_diamonds integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Monthly Test Results
CREATE TABLE IF NOT EXISTS public.monthly_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  test_id uuid NOT NULL REFERENCES public.monthly_tests(id),
  score integer NOT NULL,
  total_questions integer NOT NULL,
  percentage numeric NOT NULL,
  bonus_earned boolean DEFAULT false,
  completed_at timestamptz DEFAULT now()
);

-- Monument Info
CREATE TABLE IF NOT EXISTS public.monument_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_def_id text NOT NULL,
  full_name text NOT NULL,
  district text NOT NULL,
  description_short text NOT NULL,
  description_long text NOT NULL,
  year_built text,
  historical_period text,
  fun_fact text,
  educational_topic text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Monument Questions
CREATE TABLE IF NOT EXISTS public.monument_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monument_id uuid NOT NULL REFERENCES public.monument_info(id),
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  difficulty integer DEFAULT 1,
  school_year text DEFAULT '1',
  created_at timestamptz DEFAULT now()
);

-- Parent Associations
CREATE TABLE IF NOT EXISTS public.parent_associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  president_name text NOT NULL,
  president_role text NOT NULL DEFAULT 'president',
  school_id uuid NOT NULL REFERENCES public.schools(id),
  association_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  iban text,
  bank_account_holder text,
  bank_proof_url text,
  ata_document_url text,
  ata_updated_at timestamptz,
  total_raised numeric NOT NULL DEFAULT 0,
  total_paid numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Association Donations
CREATE TABLE IF NOT EXISTS public.association_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.parent_associations(id),
  student_id uuid NOT NULL REFERENCES public.students(id),
  amount numeric NOT NULL DEFAULT 1.00,
  payment_id text,
  created_at timestamptz DEFAULT now()
);

-- Subject Priorities
CREATE TABLE IF NOT EXISTS public.subject_priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id),
  subject subject NOT NULL,
  priority integer NOT NULL DEFAULT 1
);

-- Promo Codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  promo_type text NOT NULL DEFAULT 'discount',
  discount_percent integer DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  discount_duration_months integer DEFAULT 0,
  free_months integer DEFAULT 0,
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  target_user_id uuid,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Subscription Discounts
CREATE TABLE IF NOT EXISTS public.subscription_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id),
  discount_percent integer NOT NULL DEFAULT 0,
  target_months text[] NOT NULL DEFAULT '{}',
  apply_to_all boolean NOT NULL DEFAULT false,
  applied boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- 3. FUNCTIONS
-- =====================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id uuid, _role admin_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.notify_achievement_unlocked()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _achievement achievements%ROWTYPE;
BEGIN
  SELECT * INTO _achievement FROM achievements WHERE id = NEW.achievement_id;
  IF FOUND THEN
    INSERT INTO notifications (student_id, title, message, icon, type)
    VALUES (
      NEW.student_id,
      'Conquista desbloqueada!',
      _achievement.title || ' — ' || COALESCE(_achievement.description, ''),
      COALESCE(_achievement.icon, '🏆'),
      'achievement'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_daily_quiz_reminders()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO notifications (student_id, title, message, icon, type)
  SELECT s.id, 'Quiz diário! 📚', 'Não te esqueças de responder aos quizzes de hoje para ganhar moedas e XP!', '📚', 'quiz_reminder'
  FROM students s
  WHERE s.quiz_reminders_enabled = true
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.student_id = s.id AND n.type = 'quiz_reminder' AND n.created_at::date = CURRENT_DATE
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  child_emails jsonb;
  child_record jsonb;
  _student_data jsonb;
  _new_student_id uuid;
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'parent')
  );

  child_emails := NEW.raw_user_meta_data->'child_emails';
  IF child_emails IS NOT NULL AND jsonb_array_length(child_emails) > 0 THEN
    FOR child_record IN SELECT * FROM jsonb_array_elements(child_emails)
    LOOP
      INSERT INTO public.authorized_emails (parent_id, email, school_year)
      VALUES (
        NEW.id,
        lower(trim(child_record->>'email')),
        COALESCE((child_record->>'schoolYear')::school_year, '1')
      );
    END LOOP;
  END IF;

  IF NEW.raw_user_meta_data->>'district' IS NOT NULL AND NEW.raw_user_meta_data->>'district' != '' THEN
    UPDATE public.profiles SET district = (NEW.raw_user_meta_data->>'district')::district WHERE user_id = NEW.id;
  END IF;

  _student_data := NEW.raw_user_meta_data->'student_data';
  IF _student_data IS NOT NULL AND (NEW.raw_user_meta_data->>'role') = 'student' THEN
    INSERT INTO public.students (
      user_id, parent_id, display_name, nickname, school_year, district, gender, school_id, coins, diamonds
    ) VALUES (
      NEW.id,
      (_student_data->>'parent_id')::uuid,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      COALESCE(_student_data->>'nickname', split_part(NEW.email, '@', 1)),
      COALESCE((_student_data->>'school_year')::school_year, '1'),
      NULLIF(_student_data->>'district', '')::district,
      COALESCE(_student_data->>'gender', 'indefinido'),
      NULLIF(_student_data->>'school_id', '')::uuid,
      500, 10
    ) RETURNING id INTO _new_student_id;

    INSERT INTO public.player_resources (student_id, resource_type, amount) VALUES
      (_new_student_id, 'wood', 15), (_new_student_id, 'stone', 15),
      (_new_student_id, 'iron', 15), (_new_student_id, 'coal', 15),
      (_new_student_id, 'food', 15), (_new_student_id, 'leather', 15),
      (_new_student_id, 'fish', 15);

    UPDATE public.authorized_emails SET used = true WHERE id = (_student_data->>'authorized_email_id')::uuid;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================
-- 4. RLS POLICIES
-- =====================

-- Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gathering_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monument_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monument_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.association_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_priorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_discounts ENABLE ROW LEVEL SECURITY;

-- Schools
CREATE POLICY "Anyone can view schools" ON public.schools FOR SELECT TO public USING (true);

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Students
CREATE POLICY "Students can view their own data" ON public.students FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Students can insert their own record" ON public.students FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students can update their own data" ON public.students FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Parents can view their children" ON public.students FOR SELECT TO public USING (auth.uid() = parent_id);
CREATE POLICY "Parents can update their children" ON public.students FOR UPDATE TO public USING (auth.uid() = parent_id);
CREATE POLICY "Admins can view all students" ON public.students FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Authorized Emails
CREATE POLICY "Anyone can check if email is authorized" ON public.authorized_emails FOR SELECT TO public USING (true);
CREATE POLICY "Parents can manage their authorized emails" ON public.authorized_emails FOR ALL TO public USING (auth.uid() = parent_id);

-- User Roles
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Super admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_admin_role(auth.uid(), 'super_admin'));
CREATE POLICY "Super admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_admin_role(auth.uid(), 'super_admin'));

-- Achievements
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT TO public USING (true);

-- Player Achievements
CREATE POLICY "Students can view own achievements" ON public.player_achievements FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_achievements.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Students can insert own achievements" ON public.player_achievements FOR INSERT TO public WITH CHECK (EXISTS (SELECT 1 FROM students WHERE students.id = player_achievements.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Parents can view children achievements" ON public.player_achievements FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_achievements.student_id AND students.parent_id = auth.uid()));

-- Buildings
CREATE POLICY "Anyone can view buildings" ON public.buildings FOR SELECT TO public USING (true);
CREATE POLICY "Students can manage their buildings" ON public.buildings FOR ALL TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = buildings.student_id AND students.user_id = auth.uid()));

-- Questions
CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT TO public USING (true);

-- Quiz History
CREATE POLICY "Students can view their history" ON public.quiz_history FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = quiz_history.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Students can insert their answers" ON public.quiz_history FOR INSERT TO public WITH CHECK (EXISTS (SELECT 1 FROM students WHERE students.id = quiz_history.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Parents can view children quiz history" ON public.quiz_history FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = quiz_history.student_id AND students.parent_id = auth.uid()));

-- Missions
CREATE POLICY "Anyone can view missions" ON public.missions FOR SELECT TO public USING (true);

-- Player Missions
CREATE POLICY "Students can manage own missions" ON public.player_missions FOR ALL TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_missions.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Students can view own missions" ON public.player_missions FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_missions.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Parents can view children missions" ON public.player_missions FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_missions.student_id AND students.parent_id = auth.uid()));

-- Player Resources
CREATE POLICY "Students can manage own resources" ON public.player_resources FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_resources.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Students can view own resources" ON public.player_resources FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_resources.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Parents can view children resources" ON public.player_resources FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_resources.student_id AND students.parent_id = auth.uid()));

-- Gathering Log
CREATE POLICY "Students can manage own gathering log" ON public.gathering_log FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM students WHERE students.id = gathering_log.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Students can view own gathering log" ON public.gathering_log FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM students WHERE students.id = gathering_log.student_id AND students.user_id = auth.uid()));

-- Friendships
CREATE POLICY "Students can view their friendships" ON public.friendships FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE (students.id = friendships.requester_id OR students.id = friendships.receiver_id) AND students.user_id = auth.uid()));
CREATE POLICY "Students can request friendships" ON public.friendships FOR INSERT TO public WITH CHECK (EXISTS (SELECT 1 FROM students WHERE students.id = friendships.requester_id AND students.user_id = auth.uid()));
CREATE POLICY "Parents can view children friendships" ON public.friendships FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE (students.id = friendships.requester_id OR students.id = friendships.receiver_id) AND students.parent_id = auth.uid()));
CREATE POLICY "Parents can update children friendships" ON public.friendships FOR UPDATE TO public USING (EXISTS (SELECT 1 FROM students WHERE (students.id = friendships.requester_id OR students.id = friendships.receiver_id) AND students.parent_id = auth.uid()));

-- Chat Messages
CREATE POLICY "Students can view their messages" ON public.chat_messages FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE (students.id = chat_messages.sender_id OR students.id = chat_messages.receiver_id) AND students.user_id = auth.uid()));
CREATE POLICY "Students can send messages to friends" ON public.chat_messages FOR INSERT TO public WITH CHECK ((EXISTS (SELECT 1 FROM students WHERE students.id = chat_messages.sender_id AND students.user_id = auth.uid())) AND (EXISTS (SELECT 1 FROM friendships WHERE friendships.status = 'approved' AND ((friendships.requester_id = chat_messages.sender_id AND friendships.receiver_id = chat_messages.receiver_id) OR (friendships.requester_id = chat_messages.receiver_id AND friendships.receiver_id = chat_messages.sender_id)))));
CREATE POLICY "Parents can view children messages" ON public.chat_messages FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE (students.id = chat_messages.sender_id OR students.id = chat_messages.receiver_id) AND students.parent_id = auth.uid()));

-- Trade Offers
CREATE POLICY "Students can view own trades" ON public.trade_offers FOR SELECT TO authenticated USING ((EXISTS (SELECT 1 FROM students WHERE students.id = trade_offers.sender_id AND students.user_id = auth.uid())) OR (EXISTS (SELECT 1 FROM students WHERE students.id = trade_offers.receiver_id AND students.user_id = auth.uid())));
CREATE POLICY "Students can create trades" ON public.trade_offers FOR INSERT TO authenticated WITH CHECK ((EXISTS (SELECT 1 FROM students WHERE students.id = trade_offers.sender_id AND students.user_id = auth.uid())) AND (EXISTS (SELECT 1 FROM friendships WHERE friendships.status = 'approved' AND ((friendships.requester_id = trade_offers.sender_id AND friendships.receiver_id = trade_offers.receiver_id) OR (friendships.requester_id = trade_offers.receiver_id AND friendships.receiver_id = trade_offers.sender_id)))));
CREATE POLICY "Receiver can update trades" ON public.trade_offers FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM students WHERE students.id = trade_offers.receiver_id AND students.user_id = auth.uid()));
CREATE POLICY "Parents can view children trades" ON public.trade_offers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM students WHERE (students.id = trade_offers.sender_id OR students.id = trade_offers.receiver_id) AND students.parent_id = auth.uid()));

-- Battles
CREATE POLICY "Students can manage own battles" ON public.battles FOR ALL TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = battles.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Students can view own battles" ON public.battles FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = battles.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Parents can view children battles" ON public.battles FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = battles.student_id AND students.parent_id = auth.uid()));

-- Notifications
CREATE POLICY "Students can read own notifications" ON public.notifications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM students WHERE students.id = notifications.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Students can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM students WHERE students.id = notifications.student_id AND students.user_id = auth.uid()));
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM students WHERE students.id = notifications.student_id AND students.user_id = auth.uid()));

-- Push Subscriptions
CREATE POLICY "Students can manage own subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM students WHERE students.id = push_subscriptions.student_id AND students.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM students WHERE students.id = push_subscriptions.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Service can read all subscriptions" ON public.push_subscriptions FOR SELECT TO authenticated USING (true);

-- Shop Items
CREATE POLICY "Anyone can view shop items" ON public.shop_items FOR SELECT TO public USING (true);

-- Player Inventory
CREATE POLICY "Students can manage own inventory" ON public.player_inventory FOR ALL TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_inventory.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Students can view own inventory" ON public.player_inventory FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_inventory.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Parents can view children inventory" ON public.player_inventory FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = player_inventory.student_id AND students.parent_id = auth.uid()));

-- Monthly Tests
CREATE POLICY "Anyone can view monthly tests" ON public.monthly_tests FOR SELECT TO public USING (true);

-- Monthly Test Results
CREATE POLICY "Students can view own test results" ON public.monthly_test_results FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = monthly_test_results.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Students can insert own test results" ON public.monthly_test_results FOR INSERT TO public WITH CHECK (EXISTS (SELECT 1 FROM students WHERE students.id = monthly_test_results.student_id AND students.user_id = auth.uid()));
CREATE POLICY "Parents can view children test results" ON public.monthly_test_results FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = monthly_test_results.student_id AND students.parent_id = auth.uid()));

-- Monument Info
CREATE POLICY "Anyone can view monument info" ON public.monument_info FOR SELECT TO public USING (true);

-- Monument Questions
CREATE POLICY "Anyone can view monument questions" ON public.monument_questions FOR SELECT TO public USING (true);

-- Parent Associations
CREATE POLICY "Anyone can view approved associations" ON public.parent_associations FOR SELECT TO public USING (status = 'approved');
CREATE POLICY "Association owners can view own record" ON public.parent_associations FOR SELECT TO authenticated USING (email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text);
CREATE POLICY "Association owners can update own record" ON public.parent_associations FOR UPDATE TO authenticated USING (email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text);
CREATE POLICY "Authenticated users can register associations" ON public.parent_associations FOR INSERT TO authenticated WITH CHECK (email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text);
CREATE POLICY "Admins can view all associations" ON public.parent_associations FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update associations" ON public.parent_associations FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

-- Association Donations
CREATE POLICY "Anyone can view donation records for approved associations" ON public.association_donations FOR SELECT TO public USING (EXISTS (SELECT 1 FROM parent_associations pa WHERE pa.id = association_donations.association_id AND pa.status = 'approved'));
CREATE POLICY "Associations can view own donations" ON public.association_donations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM parent_associations pa WHERE pa.id = association_donations.association_id AND pa.email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text));

-- Subject Priorities
CREATE POLICY "Parents can manage subject priorities" ON public.subject_priorities FOR ALL TO public USING (auth.uid() = parent_id);
CREATE POLICY "Students can view their priorities" ON public.subject_priorities FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = subject_priorities.student_id AND students.user_id = auth.uid()));

-- Promo Codes
CREATE POLICY "Admins can manage promo codes" ON public.promo_codes FOR ALL TO public USING (is_admin(auth.uid()));
CREATE POLICY "Users can validate codes" ON public.promo_codes FOR SELECT TO public USING (is_active = true);

-- Subscription Discounts
CREATE POLICY "Admins can manage subscription discounts" ON public.subscription_discounts FOR ALL TO public USING (is_admin(auth.uid()));
CREATE POLICY "Students can view own discounts" ON public.subscription_discounts FOR SELECT TO public USING (EXISTS (SELECT 1 FROM students WHERE students.id = subscription_discounts.student_id AND students.user_id = auth.uid()));

-- =====================
-- FIM DO BACKUP
-- =====================
