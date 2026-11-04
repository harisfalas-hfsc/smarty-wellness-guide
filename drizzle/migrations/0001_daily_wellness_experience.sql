-- Preferences / personal targets (one row per user)
CREATE TABLE public.wellness_preferences (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  water_target_ml int CHECK (water_target_ml IS NULL OR water_target_ml BETWEEN 250 AND 8000),
  protein_target_g int CHECK (protein_target_g IS NULL OR protein_target_g BETWEEN 10 AND 400),
  protein_target_source text NOT NULL DEFAULT 'user' CHECK (protein_target_source IN ('user','professional')),
  personal_time_goal_min int CHECK (personal_time_goal_min IS NULL OR personal_time_goal_min BETWEEN 5 AND 3000),
  personal_time_goal_period text NOT NULL DEFAULT 'daily' CHECK (personal_time_goal_period IN ('daily','weekly')),
  ritual_minutes jsonb NOT NULL DEFAULT '{"morning":10,"midday":5,"evening":10}',
  hidden_ritual_activities text[] NOT NULL DEFAULT '{}',
  reminders jsonb NOT NULL DEFAULT '{"morning":false,"midday":false,"evening":false,"hydration":false}',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

-- Period check-ins (morning / midday / evening); answers optional, stored as JSONB because questions vary by period
CREATE TABLE public.period_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  local_date date NOT NULL,
  period text NOT NULL CHECK (period IN ('morning','midday','evening')),
  answers jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, local_date, period)
);

-- Ritual activities (definitions) + completions
CREATE TABLE public.ritual_activity_definitions (
  id text PRIMARY KEY,
  ritual_id text NOT NULL REFERENCES public.ritual_definitions(id) ON DELETE CASCADE,
  title text NOT NULL, detail text NOT NULL DEFAULT '',
  kind text NOT NULL CHECK (kind IN ('manual','breathing','hydration','personal_time')),
  minutes smallint NOT NULL DEFAULT 2, optional boolean NOT NULL DEFAULT false,
  personal_category text, sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE public.ritual_activity_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id text NOT NULL REFERENCES public.ritual_activity_definitions(id) ON DELETE CASCADE,
  local_date date NOT NULL, duration_seconds int, completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_id, local_date)
);
ALTER TABLE public.ritual_completions ADD COLUMN IF NOT EXISTS completed_at timestamptz NOT NULL DEFAULT now(), ADD COLUMN IF NOT EXISTS closing_message text;

-- Habit logs
CREATE TABLE public.breathing_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  local_date date NOT NULL, pattern text NOT NULL, duration_seconds int NOT NULL CHECK (duration_seconds BETWEEN 10 AND 3600),
  ritual_slot text CHECK (ritual_slot IN ('morning','midday','evening')),
  completed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.hydration_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  local_date date NOT NULL, amount_ml int NOT NULL CHECK (amount_ml BETWEEN 10 AND 3000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.protein_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  local_date date NOT NULL, grams numeric(6,1) NOT NULL CHECK (grams > 0 AND grams <= 300), label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.personal_time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  local_date date NOT NULL,
  category text NOT NULL CHECK (category IN ('reading','hobbies','relaxation','outdoor','learning','development','alone','other')),
  minutes int NOT NULL CHECK (minutes BETWEEN 1 AND 720), note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Missions: richer definitions + lifecycle
ALTER TABLE public.mission_definitions
  ADD COLUMN IF NOT EXISTS objective text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS completion_criteria text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS metric text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS step_goals numeric[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS days_per_step smallint NOT NULL DEFAULT 3;
ALTER TABLE public.mission_definitions DROP CONSTRAINT IF EXISTS mission_definitions_area_check;
ALTER TABLE public.mission_definitions ADD CONSTRAINT mission_definitions_area_check CHECK (area IN ('movement','training','nutrition','mind','social','personal','sleep','hydration','development'));
ALTER TABLE public.mission_definitions ADD CONSTRAINT mission_definitions_metric_check CHECK (metric IN ('manual','hydration_pct','protein_pct','breathing_min','personal_min','reading_min','outdoor_min'));
ALTER TABLE public.user_mission_progress
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed')),
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Challenges: richer definitions + participation
ALTER TABLE public.challenge_definitions
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'movement',
  ADD COLUMN IF NOT EXISTS cadence text NOT NULL DEFAULT 'daily' CHECK (cadence IN ('daily','weekly','short')),
  ADD COLUMN IF NOT EXISTS instructions text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS objective text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS duration_days smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS target_days smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS metric text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS goal numeric;
CREATE TABLE public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id text REFERENCES public.challenge_definitions(id) ON DELETE CASCADE,
  custom_title text, custom_detail text,
  target_days smallint NOT NULL DEFAULT 1 CHECK (target_days BETWEEN 1 AND 60),
  started_on date NOT NULL, ends_on date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (challenge_id IS NOT NULL OR custom_title IS NOT NULL)
);
CREATE TABLE public.user_challenge_days (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_challenge_id uuid NOT NULL REFERENCES public.user_challenges(id) ON DELETE CASCADE,
  local_date date NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_challenge_id, local_date)
);

-- Indexes
CREATE INDEX ON public.period_check_ins (user_id, local_date DESC);
CREATE INDEX ON public.ritual_activity_completions (user_id, local_date DESC);
CREATE INDEX ON public.breathing_sessions (user_id, local_date DESC);
CREATE INDEX ON public.hydration_entries (user_id, local_date DESC);
CREATE INDEX ON public.protein_entries (user_id, local_date DESC);
CREATE INDEX ON public.personal_time_entries (user_id, local_date DESC);
CREATE INDEX ON public.user_challenges (user_id, status);
CREATE INDEX ON public.user_challenge_days (user_id, local_date DESC);

CREATE TRIGGER t_upd BEFORE UPDATE ON public.wellness_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_upd BEFORE UPDATE ON public.period_check_ins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grants + RLS
GRANT SELECT ON public.ritual_activity_definitions TO authenticated;
GRANT ALL ON public.ritual_activity_definitions TO service_role;
ALTER TABLE public.ritual_activity_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can read" ON public.ritual_activity_definitions FOR SELECT TO authenticated USING (true);
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['wellness_preferences','period_check_ins','ritual_activity_completions','breathing_sessions','hydration_entries','protein_entries','personal_time_entries','user_challenges','user_challenge_days'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Own rows: select" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Own rows: insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Own rows: update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Own rows: delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t);
  END LOOP;
END $$;

-- Mission progression: a completion counts toward the current step; after days_per_step completions the mission levels up, after the last step it is completed.
CREATE OR REPLACE FUNCTION public.on_mission_completion() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE d record; p record; n int;
BEGIN
  SELECT * INTO d FROM mission_definitions WHERE id = NEW.mission_id;
  INSERT INTO user_mission_progress (user_id, mission_id) VALUES (NEW.user_id, NEW.mission_id) ON CONFLICT DO NOTHING;
  SELECT * INTO p FROM user_mission_progress WHERE user_id = NEW.user_id AND mission_id = NEW.mission_id;
  IF NEW.step IS NULL THEN UPDATE mission_completions SET step = p.step WHERE id = NEW.id; END IF;
  SELECT count(*) INTO n FROM mission_completions WHERE user_id = NEW.user_id AND mission_id = NEW.mission_id AND COALESCE(step, p.step) = p.step;
  IF n >= d.days_per_step THEN
    IF p.step >= d.total_steps THEN
      UPDATE user_mission_progress SET status = 'completed', completed_at = now() WHERE user_id = NEW.user_id AND mission_id = NEW.mission_id;
    ELSE
      UPDATE user_mission_progress SET step = p.step + 1 WHERE user_id = NEW.user_id AND mission_id = NEW.mission_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER t_mission_completion AFTER INSERT ON public.mission_completions FOR EACH ROW EXECUTE FUNCTION public.on_mission_completion();

CREATE OR REPLACE FUNCTION public.on_mission_completion_undo() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.step IS NOT NULL THEN
    UPDATE user_mission_progress SET step = LEAST(step, OLD.step),
      status = CASE WHEN status = 'completed' THEN 'active' ELSE status END,
      completed_at = CASE WHEN status = 'completed' THEN NULL ELSE completed_at END
    WHERE user_id = OLD.user_id AND mission_id = OLD.mission_id;
  END IF;
  RETURN OLD;
END $$;
CREATE TRIGGER t_mission_completion_undo AFTER DELETE ON public.mission_completions FOR EACH ROW EXECUTE FUNCTION public.on_mission_completion_undo();

-- Shared completion system: logging habits automatically credits linked missions and daily challenges for that day.
CREATE OR REPLACE FUNCTION public.credit_linked_progress(_user uuid, _date date) RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v jsonb; pr record; c record; val numeric; goal numeric;
BEGIN
  SELECT * INTO pr FROM wellness_preferences WHERE user_id = _user;
  v := jsonb_build_object(
    'hydration_pct', COALESCE((SELECT sum(amount_ml) FROM hydration_entries WHERE user_id=_user AND local_date=_date),0) * 100.0 / NULLIF(COALESCE(pr.water_target_ml, 2000),0),
    'protein_pct', CASE WHEN pr.protein_target_g IS NULL THEN 0 ELSE COALESCE((SELECT sum(grams) FROM protein_entries WHERE user_id=_user AND local_date=_date),0) * 100.0 / pr.protein_target_g END,
    'breathing_min', COALESCE((SELECT sum(duration_seconds) FROM breathing_sessions WHERE user_id=_user AND local_date=_date),0) / 60.0,
    'personal_min', COALESCE((SELECT sum(minutes) FROM personal_time_entries WHERE user_id=_user AND local_date=_date),0),
    'reading_min', COALESCE((SELECT sum(minutes) FROM personal_time_entries WHERE user_id=_user AND local_date=_date AND category='reading'),0),
    'outdoor_min', COALESCE((SELECT sum(minutes) FROM personal_time_entries WHERE user_id=_user AND local_date=_date AND category='outdoor'),0));
  -- protein missions only count against a target the user set; hydration falls back to recording any water (1%)
  FOR c IN SELECT d.id, d.metric, d.step_goals, COALESCE(p.step,1) AS step FROM mission_definitions d
           JOIN user_mission_progress p ON p.mission_id = d.id AND p.user_id = _user AND p.status = 'active'
           WHERE d.metric <> 'manual' LOOP
    val := (v ->> c.metric)::numeric;
    goal := COALESCE(c.step_goals[c.step], c.step_goals[array_length(c.step_goals,1)], 1);
    IF val >= goal AND val > 0 THEN
      INSERT INTO mission_completions (user_id, mission_id, local_date) VALUES (_user, c.id, _date) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  FOR c IN SELECT id, metric, goal FROM challenge_definitions WHERE cadence = 'daily' AND metric <> 'manual' AND active LOOP
    val := (v ->> c.metric)::numeric;
    IF val > 0 AND val >= COALESCE(c.goal, 1) THEN
      INSERT INTO challenge_completions (user_id, challenge_id, local_date) VALUES (_user, c.id, _date) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  -- weekly / short challenges: a day counts when the linked metric meets its goal
  FOR c IN SELECT uc.id, d.metric, d.goal FROM user_challenges uc JOIN challenge_definitions d ON d.id = uc.challenge_id
           WHERE uc.user_id = _user AND uc.status = 'active' AND d.metric <> 'manual' AND _date BETWEEN uc.started_on AND uc.ends_on LOOP
    val := (v ->> c.metric)::numeric;
    IF val > 0 AND val >= COALESCE(c.goal, 1) THEN
      INSERT INTO user_challenge_days (user_id, user_challenge_id, local_date) VALUES (_user, c.id, _date) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.on_habit_logged() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM public.credit_linked_progress(NEW.user_id, NEW.local_date);
  RETURN NEW;
END $$;
CREATE TRIGGER t_credit AFTER INSERT ON public.hydration_entries FOR EACH ROW EXECUTE FUNCTION public.on_habit_logged();
CREATE TRIGGER t_credit AFTER INSERT ON public.protein_entries FOR EACH ROW EXECUTE FUNCTION public.on_habit_logged();
CREATE TRIGGER t_credit AFTER INSERT ON public.breathing_sessions FOR EACH ROW EXECUTE FUNCTION public.on_habit_logged();
CREATE TRIGGER t_credit AFTER INSERT ON public.personal_time_entries FOR EACH ROW EXECUTE FUNCTION public.on_habit_logged();

-- Weekly / short challenge auto-complete when enough days are logged
CREATE OR REPLACE FUNCTION public.on_challenge_day() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE user_challenges uc SET status = 'completed', completed_at = now()
  WHERE uc.id = NEW.user_challenge_id AND uc.status = 'active'
    AND (SELECT count(*) FROM user_challenge_days WHERE user_challenge_id = uc.id) >= uc.target_days;
  RETURN NEW;
END $$;
CREATE TRIGGER t_challenge_day AFTER INSERT ON public.user_challenge_days FOR EACH ROW EXECUTE FUNCTION public.on_challenge_day();

REVOKE EXECUTE ON FUNCTION public.credit_linked_progress(uuid, date) FROM PUBLIC, anon;

-- Content: enrich existing missions, add new categories
UPDATE public.mission_definitions SET objective='Walk after your main meal.', completion_criteria='Mark it done on days you walk.', step_targets=ARRAY['10 minutes','15 minutes','20 minutes','25 minutes'] WHERE id='m-walk';
UPDATE public.mission_definitions SET area='personal', metric='reading_min', step_goals=ARRAY[5,10,15,20], objective='Build a calm reading habit before bed.', completion_criteria='Log reading in Personal time — it counts automatically.', step_targets=ARRAY['5 minutes','10 minutes','15 minutes','20 minutes'] WHERE id='m-read';
UPDATE public.mission_definitions SET objective='Train consistently.', completion_criteria='Mark it done after each session.', step_targets=ARRAY['2 sessions','3 sessions','3 sessions'] WHERE id='m-train';
UPDATE public.mission_definitions SET objective='Stay connected with people who matter.', completion_criteria='Mark it done after a call.', step_targets=ARRAY['1 call','2 calls','3 calls'] WHERE id='m-call';
UPDATE public.mission_definitions SET objective='Cook more of your meals.', completion_criteria='Mark it done after a home-cooked meal.', step_targets=ARRAY['2 meals','3 meals','4 meals','5 meals'] WHERE id='m-home-meal';
INSERT INTO public.mission_definitions (id,title,detail,area,total_steps,step_targets,step_goals,metric,objective,completion_criteria,sort_order) VALUES
 ('m-hydrate','Drink enough water','Start by simply recording water, then build toward your own daily target.','hydration',4,ARRAY['Record any water','Half your target','Three quarters of your target','Your full target'],ARRAY[1,50,75,100],'hydration_pct','Reach your personal water target most days.','Log water — it counts automatically.',6),
 ('m-breathe','Daily breathing','A few calm minutes of breathing every day.','mind',4,ARRAY['2 minutes','3 minutes','5 minutes','10 minutes'],ARRAY[2,3,5,10],'breathing_min','Make breathing a daily reset.','Finish a breathing session — it counts automatically.',7),
 ('m-me-time','Time for yourself','Protect time that is only for you.','personal',4,ARRAY['10 minutes','20 minutes','30 minutes','45 minutes'],ARRAY[10,20,30,45],'personal_min','Reserve personal time every day.','Log personal time — it counts automatically.',8),
 ('m-protein','Protein at every meal','Reach the protein target you set for yourself.','nutrition',3,ARRAY['Half your target','Three quarters of your target','Your full target'],ARRAY[50,75,100],'protein_pct','Hit your own protein target more often.','Set a target, log protein — it counts automatically.',9),
 ('m-sleep','Wind down on time','Start your evening unwind at a consistent time.','sleep',3,ARRAY['3 nights','5 nights','Every night'],ARRAY[]::numeric[],'manual','A steady bedtime routine.','Mark it done on nights you wind down on time.',10),
 ('m-learn','Learn something small','Ten focused minutes of learning.','development',3,ARRAY['10 minutes','15 minutes','20 minutes'],ARRAY[]::numeric[],'manual','Grow a little every day.','Mark it done after learning.',11);

UPDATE public.challenge_definitions SET category='movement', instructions='Choose stairs over lifts all day.', objective='More movement without extra time.' WHERE id='c-stairs';
UPDATE public.challenge_definitions SET category='movement', instructions='Replace one short car trip with walking.', objective='Easy daily steps.' WHERE id='c-walk';
UPDATE public.challenge_definitions SET category='outdoor', metric='outdoor_min', goal=20, instructions='Spend 20 minutes outside. Log it in Personal time as Outdoor.', objective='Daylight and fresh air.' WHERE id='c-outside';
UPDATE public.challenge_definitions SET category='reading', metric='reading_min', goal=5, instructions='Read for about five minutes. Log it as Reading.', objective='A calm reading habit.' WHERE id='c-pages';
UPDATE public.challenge_definitions SET category='mental', instructions='Call someone you have not spoken to lately.', objective='Connection.' WHERE id='c-call';
UPDATE public.challenge_definitions SET category='mental', instructions='Put your phone in another room for 10 minutes.', objective='A real break.' WHERE id='c-phone';
UPDATE public.challenge_definitions SET category='nutrition', instructions='Cook one simple, healthy meal.', objective='Better food, no diet.' WHERE id='c-cook';
UPDATE public.challenge_definitions SET category='sleep', instructions='Start your wind-down 30 minutes earlier.', objective='More recovery.' WHERE id='c-sleep';
INSERT INTO public.challenge_definitions (id,title,detail,category,cadence,instructions,objective,duration_days,target_days,metric,goal,sort_order) VALUES
 ('c-breathe-3','Three calm minutes','Breathe for 3 minutes today.','breathing','daily','Finish a 3-minute breathing session.','A quick nervous-system reset.',1,1,'breathing_min',3,9),
 ('c-water-half','Half your water by lunch','Log half your water target today.','hydration','daily','Log water through the day.','Steady hydration.',1,1,'hydration_pct',50,10),
 ('w-hydrate','Hydration week','Reach your water target on 5 days this week.','hydration','weekly','Log water every day for a week.','Make hydration automatic.',7,5,'hydration_pct',100,11),
 ('w-breathe','Breathe every day','A breathing session on 5 of the next 7 days.','breathing','weekly','Do any breathing session each day.','Daily calm.',7,5,'breathing_min',2,12),
 ('w-me-time','Personal time week','20 minutes for yourself on 4 days this week.','personal','weekly','Log personal time.','Protect your own time.',7,4,'personal_min',20,13),
 ('s-read-3','3-day reading streak','Read 10 minutes for 3 days in a row.','reading','short','Log reading each day.','Restart a reading habit.',3,3,'reading_min',10,14),
 ('s-outside-3','3 days outside','20 minutes outside on 3 of the next 4 days.','outdoor','short','Log outdoor time.','More daylight.',4,3,'outdoor_min',20,15);

-- Ritual content
UPDATE public.ritual_definitions SET detail='Start with intention, energy and clarity.' WHERE id='r-morning';
UPDATE public.ritual_definitions SET detail='Interrupt stress, refocus and move a little.' WHERE id='r-midday';
UPDATE public.ritual_definitions SET detail='Step away from the day and prepare for rest.' WHERE id='r-evening';
INSERT INTO public.ritual_activity_definitions (id,ritual_id,title,detail,kind,minutes,optional,personal_category,sort_order) VALUES
 ('ra-m-breathe','r-morning','Morning breathing','Two minutes of slow, energising breaths.','breathing',2,false,NULL,1),
 ('ra-m-water','r-morning','Glass of water','Rehydrate after the night. Logs 250 ml.','hydration',1,false,NULL,2),
 ('ra-m-move','r-morning','Light mobility','Neck, shoulders, hips — gentle movement for 3 minutes.','manual',3,false,NULL,3),
 ('ra-m-intent','r-morning','Set your intention','Decide the one thing that matters most today.','manual',1,false,NULL,4),
 ('ra-m-grat','r-morning','Gratitude moment','Think of one thing you are glad about.','manual',1,true,NULL,5),
 ('ra-d-breathe','r-midday','Reset breathing','Box breathing to clear your head.','breathing',2,false,NULL,1),
 ('ra-d-move','r-midday','Movement break','Stand up, stretch and walk for a few minutes.','manual',3,false,NULL,2),
 ('ra-d-water','r-midday','Hydrate','A glass of water. Logs 250 ml.','hydration',1,false,NULL,3),
 ('ra-d-out','r-midday','Short walk outside','Ten minutes of daylight if you can.','personal_time',10,true,'outdoor',4),
 ('ra-d-focus','r-midday','Focus reset','Close tabs, pick your next single task.','manual',1,true,NULL,5),
 ('ra-e-breathe','r-evening','Relaxation breathing','Long, slow exhales to calm down.','breathing',3,false,NULL,1),
 ('ra-e-stretch','r-evening','Light stretching','Five minutes of easy stretches.','manual',5,false,NULL,2),
 ('ra-e-screens','r-evening','Screens away','Put screens away 30 minutes before bed.','manual',1,false,NULL,3),
 ('ra-e-read','r-evening','Read','Ten minutes with a book. Logs personal time.','personal_time',10,true,'reading',4),
 ('ra-e-sleep','r-evening','Sleep preparation','Dim lights, cool room, same time.','manual',2,false,NULL,5);