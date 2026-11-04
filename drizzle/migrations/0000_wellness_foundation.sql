ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone text, ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;
INSERT INTO public.profiles (id, display_name) SELECT u.id, split_part(u.email,'@',1) FROM auth.users u ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Wellness profile (typed columns)
CREATE TABLE public.wellness_profiles (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '', age text NOT NULL DEFAULT '', gender text NOT NULL DEFAULT '', relationship text NOT NULL DEFAULT '', children text NOT NULL DEFAULT '', interests text NOT NULL DEFAULT '', personal_goals text NOT NULL DEFAULT '',
  occupation text NOT NULL DEFAULT '', working_hours text NOT NULL DEFAULT '', commute text NOT NULL DEFAULT '', responsibilities text NOT NULL DEFAULT '', typical_schedule text NOT NULL DEFAULT '', free_time text NOT NULL DEFAULT '', family_responsibilities text NOT NULL DEFAULT '',
  activity_level text NOT NULL DEFAULT '', training_experience text NOT NULL DEFAULT '', fitness_level text NOT NULL DEFAULT '', limitations text NOT NULL DEFAULT '', pain text NOT NULL DEFAULT '', physical_energy text NOT NULL DEFAULT '',
  nutrition_habits text NOT NULL DEFAULT '', nutrition_preferences text NOT NULL DEFAULT '', nutrition_goals text NOT NULL DEFAULT '', nutrition_restrictions text NOT NULL DEFAULT '', nutrition_consistency text NOT NULL DEFAULT '',
  stress text NOT NULL DEFAULT '', mood text NOT NULL DEFAULT '', motivation text NOT NULL DEFAULT '', social_connection text NOT NULL DEFAULT '', outdoor text NOT NULL DEFAULT '', hobbies text NOT NULL DEFAULT '', reading text NOT NULL DEFAULT '', entertainment text NOT NULL DEFAULT '', personal_time text NOT NULL DEFAULT '', sleep_routine text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  local_date date NOT NULL,
  mood text NOT NULL CHECK (mood IN ('great','good','okay','not-great','bad')),
  energy smallint NOT NULL CHECK (energy BETWEEN 1 AND 5),
  stress smallint NOT NULL CHECK (stress BETWEEN 1 AND 5),
  motivation smallint NOT NULL CHECK (motivation BETWEEN 1 AND 5),
  sleep smallint NOT NULL CHECK (sleep BETWEEN 1 AND 5),
  needs text[] NOT NULL DEFAULT '{}',
  note text,
  legacy_id text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, local_date)
);

CREATE TABLE public.mission_definitions (
  id text PRIMARY KEY, title text NOT NULL, detail text NOT NULL DEFAULT '',
  area text NOT NULL CHECK (area IN ('movement','training','nutrition','mind','social','personal')),
  total_steps smallint NOT NULL DEFAULT 1, step_targets text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.user_mission_progress (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id text NOT NULL REFERENCES public.mission_definitions(id) ON DELETE CASCADE,
  step smallint NOT NULL DEFAULT 1, started_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mission_id)
);
CREATE TABLE public.mission_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id text NOT NULL REFERENCES public.mission_definitions(id) ON DELETE CASCADE,
  local_date date NOT NULL, step smallint, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id, local_date)
);

CREATE TABLE public.challenge_definitions (
  id text PRIMARY KEY, title text NOT NULL, detail text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.challenge_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id text NOT NULL REFERENCES public.challenge_definitions(id) ON DELETE CASCADE,
  local_date date NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id, local_date)
);

CREATE TABLE public.bucket_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL, why text NOT NULL DEFAULT '', category text NOT NULL DEFAULT '', target_date text NOT NULL DEFAULT '',
  progress smallint NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  completed_at timestamptz, legacy_id text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.experiment_definitions (
  id text PRIMARY KEY, title text NOT NULL, hypothesis text NOT NULL DEFAULT '',
  days smallint NOT NULL CHECK (days > 0), measures text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.user_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  experiment_id text NOT NULL REFERENCES public.experiment_definitions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  start_date date NOT NULL, end_date date, days_done smallint NOT NULL DEFAULT 0, result_summary text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.experiment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_experiment_id uuid NOT NULL REFERENCES public.user_experiments(id) ON DELETE CASCADE,
  local_date date NOT NULL, measurements jsonb NOT NULL DEFAULT '{}', note text, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_experiment_id, local_date)
);

CREATE TABLE public.recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  local_date date, level text NOT NULL DEFAULT 'primary' CHECK (level IN ('primary','secondary','optional')),
  kind text NOT NULL, area text, headline text NOT NULL DEFAULT '', action text NOT NULL DEFAULT '', reason text NOT NULL DEFAULT '',
  product text, status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','completed','dismissed')),
  mission_id text REFERENCES public.mission_definitions(id) ON DELETE SET NULL,
  challenge_id text REFERENCES public.challenge_definitions(id) ON DELETE SET NULL,
  check_in_id uuid REFERENCES public.check_ins(id) ON DELETE SET NULL,
  completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.coach_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.coach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.coach_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','coach','system')), text text NOT NULL,
  recommendation_id uuid REFERENCES public.recommendations(id) ON DELETE SET NULL,
  check_in_id uuid REFERENCES public.check_ins(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ritual_definitions (
  id text PRIMARY KEY, slot text NOT NULL UNIQUE CHECK (slot IN ('morning','midday','evening')),
  title text NOT NULL, detail text NOT NULL DEFAULT '', sort_order int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ritual_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  ritual_id text NOT NULL REFERENCES public.ritual_definitions(id) ON DELETE CASCADE,
  local_date date NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ritual_id, local_date)
);

CREATE TABLE public.wellness_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_type text NOT NULL CHECK (period_type IN ('weekly','monthly','custom')),
  period_start date NOT NULL, period_end date NOT NULL, summary text NOT NULL DEFAULT '',
  trends jsonb NOT NULL DEFAULT '[]', created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_type, period_start)
);

CREATE TABLE public.legacy_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_key text NOT NULL, fingerprint text NOT NULL,
  status text NOT NULL DEFAULT 'started' CHECK (status IN ('started','completed','failed')),
  counts jsonb NOT NULL DEFAULT '{}', error text,
  started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
  UNIQUE (user_id, source_key, fingerprint)
);

-- Indexes
CREATE INDEX ON public.check_ins (user_id, local_date DESC);
CREATE INDEX ON public.mission_completions (user_id, local_date DESC);
CREATE INDEX ON public.challenge_completions (user_id, local_date DESC);
CREATE INDEX ON public.bucket_goals (user_id, created_at DESC);
CREATE INDEX ON public.user_experiments (user_id);
CREATE INDEX ON public.experiment_logs (user_id, local_date DESC);
CREATE INDEX ON public.recommendations (user_id, local_date DESC);
CREATE INDEX ON public.coach_conversations (user_id, updated_at DESC);
CREATE INDEX ON public.coach_messages (conversation_id, created_at);
CREATE INDEX ON public.coach_messages (user_id);
CREATE INDEX ON public.ritual_completions (user_id, local_date DESC);
CREATE INDEX ON public.wellness_reviews (user_id, period_start DESC);

-- updated_at triggers
CREATE TRIGGER t_upd BEFORE UPDATE ON public.wellness_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_upd BEFORE UPDATE ON public.check_ins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_upd BEFORE UPDATE ON public.user_mission_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_upd BEFORE UPDATE ON public.bucket_goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_upd BEFORE UPDATE ON public.user_experiments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_upd BEFORE UPDATE ON public.coach_conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Definitions: read-only for signed-in users
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['mission_definitions','challenge_definitions','experiment_definitions','ritual_definitions'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Signed-in users can read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['wellness_profiles','check_ins','user_mission_progress','mission_completions','challenge_completions','bucket_goals','user_experiments','experiment_logs','recommendations','coach_conversations','coach_messages','ritual_completions','wellness_reviews','legacy_imports'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Own rows: select" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Own rows: insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Own rows: update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Own rows: delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t);
  END LOOP;
END $$;

-- Seed definitions (keep existing ids)
INSERT INTO public.mission_definitions (id,title,detail,area,total_steps,step_targets,sort_order) VALUES
 ('m-walk','Walk after lunch','A short walk after your main meal steadies energy for the afternoon.','movement',4,ARRAY['10 minutes'],1),
 ('m-read','Read before bed','Replaces screen time and helps your sleep routine settle.','personal',4,ARRAY['2 pages'],2),
 ('m-train','Train this week','Consistency first. Two sessions is enough to build the habit.','training',3,ARRAY['2 sessions'],3),
 ('m-call','Call someone you love','Social connection is one of the strongest wellbeing levers.','social',3,ARRAY['1 call'],4),
 ('m-home-meal','Prepare meals at home','Cooking at home improves nutrition consistency without a diet.','nutrition',4,ARRAY['2 meals'],5);
INSERT INTO public.challenge_definitions (id,title,detail,sort_order) VALUES
 ('c-stairs','Take the stairs','Every time today.',1),
 ('c-walk','Walk instead of driving','One short trip.',2),
 ('c-outside','20 minutes outside','Daylight, any pace.',3),
 ('c-pages','Read five pages','Anything you enjoy.',4),
 ('c-call','Call someone','Someone you have not spoken to lately.',5),
 ('c-phone','10 minutes without your phone','Leave it in another room.',6),
 ('c-cook','Cook something healthy','Simple is fine.',7),
 ('c-sleep','Go to bed 30 minutes earlier','Start the wind-down early.',8);
INSERT INTO public.experiment_definitions (id,title,hypothesis,days,measures,sort_order) VALUES
 ('e-walk','Walk 15 minutes after lunch','Afternoon energy improves and stress drops.',7,ARRAY['Energy','Mood','Stress','Motivation'],1),
 ('e-sleep','Screens off 30 minutes before bed','Sleep quality and morning mood improve.',10,ARRAY['Sleep','Mood','Energy'],2);
INSERT INTO public.ritual_definitions (id,slot,title,detail,sort_order) VALUES
 ('r-morning','morning','Morning Activation','Wake the body and set one intention.',1),
 ('r-midday','midday','Midday Reset','Pause, breathe and move for a few minutes.',2),
 ('r-evening','evening','Evening Unwind','Slow down and prepare for good sleep.',3);