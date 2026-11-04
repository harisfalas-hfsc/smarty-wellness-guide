ALTER TABLE public.recommendations DROP CONSTRAINT IF EXISTS recommendations_status_check;
ALTER TABLE public.recommendations ADD CONSTRAINT recommendations_status_check CHECK (status IN ('open','accepted','completed','dismissed','postponed'));
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS rec_key text,
  ADD COLUMN IF NOT EXISTS est_minutes smallint,
  ADD COLUMN IF NOT EXISTS difficulty text,
  ADD COLUMN IF NOT EXISTS benefit text,
  ADD COLUMN IF NOT EXISTS postponed_until date,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS recommendations_user_date_key ON public.recommendations (user_id, local_date, rec_key);

CREATE TABLE public.insight_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('life_gap','patterns','context')),
  local_date date NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, local_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insight_snapshots TO authenticated;
GRANT ALL ON public.insight_snapshots TO service_role;
ALTER TABLE public.insight_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own rows: select" ON public.insight_snapshots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own rows: insert" ON public.insight_snapshots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own rows: update" ON public.insight_snapshots FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own rows: delete" ON public.insight_snapshots FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.mission_progress_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  mission_id text NOT NULL REFERENCES public.mission_definitions(id) ON DELETE CASCADE,
  from_step smallint, to_step smallint NOT NULL,
  reason text NOT NULL DEFAULT 'level_up',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mission_progress_events TO authenticated;
GRANT ALL ON public.mission_progress_events TO service_role;
ALTER TABLE public.mission_progress_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own rows: select" ON public.mission_progress_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own rows: insert" ON public.mission_progress_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.log_mission_step_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.step IS DISTINCT FROM OLD.step THEN
    INSERT INTO public.mission_progress_events (user_id, mission_id, from_step, to_step, reason)
    VALUES (NEW.user_id, NEW.mission_id, OLD.step, NEW.step,
      COALESCE(NULLIF(current_setting('app.step_reason', true), ''), CASE WHEN NEW.step > OLD.step THEN 'level_up' ELSE 'step_down' END));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER mission_step_change AFTER UPDATE OF step ON public.user_mission_progress
  FOR EACH ROW EXECUTE FUNCTION public.log_mission_step_change();

-- User-chosen step adjustment (e.g. "make it easier" or "I'm ready"). Runs as the caller, so RLS applies.
CREATE OR REPLACE FUNCTION public.adjust_mission_step(_mission_id text, _delta int, _reason text)
RETURNS smallint LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE total smallint; new_step smallint;
BEGIN
  IF _reason NOT IN ('easier','ready','returning') THEN RAISE EXCEPTION 'invalid reason'; END IF;
  SELECT total_steps INTO total FROM public.mission_definitions WHERE id = _mission_id;
  PERFORM set_config('app.step_reason', _reason, true);
  UPDATE public.user_mission_progress
     SET step = GREATEST(1, LEAST(total, step + _delta)), updated_at = now()
   WHERE user_id = auth.uid() AND mission_id = _mission_id
  RETURNING step INTO new_step;
  RETURN new_step;
END $$;
REVOKE ALL ON FUNCTION public.adjust_mission_step(text,int,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_mission_step(text,int,text) TO authenticated;