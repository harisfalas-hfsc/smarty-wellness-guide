-- Goals (extends existing bucket_goals)
ALTER TABLE public.bucket_goals
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS target_on date,
  ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS obstacles text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS linked_areas text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS progress_mode text NOT NULL DEFAULT 'milestones';
UPDATE public.bucket_goals SET status = 'completed' WHERE completed_at IS NOT NULL AND status = 'active';
UPDATE public.bucket_goals SET target_on = target_date::date WHERE target_on IS NULL AND target_date ~ '^\d{4}-\d{2}-\d{2}$';
UPDATE public.bucket_goals SET progress_mode = 'manual' WHERE progress > 0;
ALTER TABLE public.bucket_goals ADD CONSTRAINT bucket_goals_priority_check CHECK (priority IN ('low','medium','high'));
ALTER TABLE public.bucket_goals ADD CONSTRAINT bucket_goals_status_check CHECK (status IN ('not_started','planned','active','paused','completed','cancelled'));
ALTER TABLE public.bucket_goals ADD CONSTRAINT bucket_goals_mode_check CHECK (progress_mode IN ('milestones','manual'));
COMMENT ON COLUMN public.bucket_goals.target_date IS 'DEPRECATED: replaced by target_on';
CREATE INDEX IF NOT EXISTS bucket_goals_user_status ON public.bucket_goals (user_id, status);

CREATE TABLE public.goal_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES public.bucket_goals(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  target_on date, done_at timestamptz, sort_order int NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'user' CHECK (source IN ('user','coach')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.goal_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES public.bucket_goals(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.goal_milestones(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  done_at timestamptz, source text NOT NULL DEFAULT 'user' CHECK (source IN ('user','coach')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.goal_progress_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES public.bucket_goals(id) ON DELETE CASCADE,
  kind text NOT NULL, detail text NOT NULL DEFAULT '', progress smallint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.personal_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES public.bucket_goals(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200), note text NOT NULL DEFAULT '',
  achieved_on date NOT NULL, category text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.report_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start date NOT NULL, period_end date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['goal_milestones','goal_actions','goal_progress_events','personal_achievements','report_exports'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Own rows: select" ON public.%I FOR SELECT TO authenticated USING (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Own rows: insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Own rows: update" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)', t);
    EXECUTE format('CREATE POLICY "Own rows: delete" ON public.%I FOR DELETE TO authenticated USING (auth.uid() = user_id)', t);
  END LOOP;
END $$;
CREATE INDEX goal_milestones_goal ON public.goal_milestones (goal_id, sort_order);
CREATE INDEX goal_actions_goal ON public.goal_actions (goal_id);
CREATE INDEX goal_events_goal ON public.goal_progress_events (goal_id, created_at);
CREATE INDEX achievements_user_date ON public.personal_achievements (user_id, achieved_on);

-- Goal history: status / progress changes are logged automatically.
CREATE OR REPLACE FUNCTION public.log_goal_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.goal_progress_events (user_id, goal_id, kind, detail, progress) VALUES (NEW.user_id, NEW.id, 'created', NEW.status, NEW.progress);
  ELSE
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.goal_progress_events (user_id, goal_id, kind, detail, progress) VALUES (NEW.user_id, NEW.id, 'status', NEW.status, NEW.progress);
    END IF;
    IF NEW.progress IS DISTINCT FROM OLD.progress THEN
      INSERT INTO public.goal_progress_events (user_id, goal_id, kind, detail, progress) VALUES (NEW.user_id, NEW.id, 'progress', '', NEW.progress);
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER bucket_goal_history AFTER INSERT OR UPDATE ON public.bucket_goals FOR EACH ROW EXECUTE FUNCTION public.log_goal_change();

-- Experiments (extends existing definitions / participation / daily logs)
ALTER TABLE public.experiment_definitions
  ADD COLUMN IF NOT EXISTS reason text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS target_behaviour text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS measure text NOT NULL DEFAULT 'energy',
  ADD COLUMN IF NOT EXISTS area text NOT NULL DEFAULT 'routine';
ALTER TABLE public.user_experiments ALTER COLUMN experiment_id DROP NOT NULL;
ALTER TABLE public.user_experiments
  ADD COLUMN IF NOT EXISTS custom_title text,
  ADD COLUMN IF NOT EXISTS custom_hypothesis text,
  ADD COLUMN IF NOT EXISTS reason text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS target_behaviour text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS duration_days smallint NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS measure text NOT NULL DEFAULT 'energy',
  ADD COLUMN IF NOT EXISTS baseline jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS evaluation jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS paused_at date;
ALTER TABLE public.user_experiments DROP CONSTRAINT IF EXISTS user_experiments_status_check;
ALTER TABLE public.user_experiments ADD CONSTRAINT user_experiments_status_check CHECK (status IN ('active','paused','completed','abandoned'));
ALTER TABLE public.user_experiments ADD CONSTRAINT user_experiments_measure_check CHECK (measure IN ('energy','stress','sleep','mood','motivation'));
ALTER TABLE public.user_experiments ADD CONSTRAINT user_experiments_duration_check CHECK (duration_days BETWEEN 3 AND 90);
ALTER TABLE public.user_experiments ADD CONSTRAINT user_experiments_source_check CHECK (experiment_id IS NOT NULL OR custom_title IS NOT NULL);
UPDATE public.user_experiments ue SET duration_days = d.days FROM public.experiment_definitions d WHERE d.id = ue.experiment_id;
ALTER TABLE public.experiment_logs ADD COLUMN IF NOT EXISTS done boolean NOT NULL DEFAULT true;

-- Development reviews reuse wellness_reviews
ALTER TABLE public.wellness_reviews DROP CONSTRAINT IF EXISTS wellness_reviews_period_type_check;
ALTER TABLE public.wellness_reviews ADD CONSTRAINT wellness_reviews_period_type_check CHECK (period_type IN ('weekly','monthly','quarterly','yearly','custom'));
ALTER TABLE public.wellness_reviews ADD COLUMN IF NOT EXISTS reflection text NOT NULL DEFAULT '';