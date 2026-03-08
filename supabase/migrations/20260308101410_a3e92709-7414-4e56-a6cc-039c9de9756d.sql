
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('parent', 'student');

-- Create enum for school years
CREATE TYPE public.school_year AS ENUM ('1', '2', '3', '4');

-- Create enum for subjects
CREATE TYPE public.subject AS ENUM ('portugues', 'matematica', 'estudo_meio', 'ingles');

-- Create enum for friendship status
CREATE TYPE public.friendship_status AS ENUM ('pending_parent_approval', 'approved', 'rejected');

-- Create enum for resource type
CREATE TYPE public.resource_type AS ENUM ('coins', 'diamonds', 'citizens');

-- Create enum for district
CREATE TYPE public.district AS ENUM (
  'aveiro', 'beja', 'braga', 'braganca', 'castelo_branco',
  'coimbra', 'evora', 'faro', 'guarda', 'leiria',
  'lisboa', 'portalegre', 'porto', 'santarem',
  'setubal', 'viana_castelo', 'vila_real', 'viseu',
  'acores', 'madeira'
);

-- Profiles table (for parents)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'parent',
  district district,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Authorized student emails (set by parents)
CREATE TABLE public.authorized_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.authorized_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage their authorized emails" ON public.authorized_emails FOR ALL USING (auth.uid() = parent_id);
CREATE POLICY "Anyone can check if email is authorized" ON public.authorized_emails FOR SELECT USING (true);

-- Students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  school_year school_year NOT NULL DEFAULT '1',
  district district,
  coins INTEGER NOT NULL DEFAULT 0,
  diamonds INTEGER NOT NULL DEFAULT 0,
  citizens INTEGER NOT NULL DEFAULT 10,
  village_level INTEGER NOT NULL DEFAULT 1,
  defense_level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own data" ON public.students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can update their own data" ON public.students FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Parents can view their children" ON public.students FOR SELECT USING (auth.uid() = parent_id);
CREATE POLICY "Parents can update their children" ON public.students FOR UPDATE USING (auth.uid() = parent_id);
CREATE POLICY "Students can insert their own record" ON public.students FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subject priorities (set by parents)
CREATE TABLE public.subject_priorities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject subject NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  UNIQUE(student_id, subject)
);

ALTER TABLE public.subject_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage subject priorities" ON public.subject_priorities FOR ALL USING (auth.uid() = parent_id);
CREATE POLICY "Students can view their priorities" ON public.subject_priorities FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE students.id = student_id AND students.user_id = auth.uid())
);

-- Questions bank
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_year school_year NOT NULL,
  subject subject NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT USING (true);

-- Quiz history
CREATE TABLE public.quiz_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answered_correctly BOOLEAN NOT NULL,
  reward_type resource_type,
  reward_amount INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their history" ON public.quiz_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE students.id = student_id AND students.user_id = auth.uid())
);
CREATE POLICY "Students can insert their answers" ON public.quiz_history FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.students WHERE students.id = student_id AND students.user_id = auth.uid())
);
CREATE POLICY "Parents can view children quiz history" ON public.quiz_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE students.id = student_id AND students.parent_id = auth.uid())
);

-- Friendships
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status friendship_status NOT NULL DEFAULT 'pending_parent_approval',
  requester_parent_approved BOOLEAN NOT NULL DEFAULT false,
  receiver_parent_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their friendships" ON public.friendships FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE (students.id = requester_id OR students.id = receiver_id) AND students.user_id = auth.uid())
);
CREATE POLICY "Students can request friendships" ON public.friendships FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.students WHERE students.id = requester_id AND students.user_id = auth.uid())
);
CREATE POLICY "Parents can view children friendships" ON public.friendships FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE (students.id = requester_id OR students.id = receiver_id) AND students.parent_id = auth.uid())
);
CREATE POLICY "Parents can update children friendships" ON public.friendships FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.students WHERE (students.id = requester_id OR students.id = receiver_id) AND students.parent_id = auth.uid())
);

-- Chat messages (only between approved friends)
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their messages" ON public.chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE (students.id = sender_id OR students.id = receiver_id) AND students.user_id = auth.uid())
);
CREATE POLICY "Students can send messages to friends" ON public.chat_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.students WHERE students.id = sender_id AND students.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE status = 'approved' 
    AND ((requester_id = sender_id AND receiver_id = chat_messages.receiver_id) OR (requester_id = chat_messages.receiver_id AND receiver_id = sender_id))
  )
);
CREATE POLICY "Parents can view children messages" ON public.chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.students WHERE (students.id = sender_id OR students.id = receiver_id) AND students.parent_id = auth.uid())
);

-- Buildings in village
CREATE TABLE public.buildings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  building_type TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their buildings" ON public.buildings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.students WHERE students.id = student_id AND students.user_id = auth.uid())
);
CREATE POLICY "Anyone can view buildings" ON public.buildings FOR SELECT USING (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'parent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
