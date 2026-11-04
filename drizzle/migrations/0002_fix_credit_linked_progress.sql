CREATE OR REPLACE FUNCTION public.credit_linked_progress(_user uuid, _date date) RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v jsonb; pr record; c record; _val numeric; _goal numeric;
BEGIN
  SELECT * INTO pr FROM wellness_preferences WHERE user_id = _user;
  v := jsonb_build_object(
    'hydration_pct', COALESCE((SELECT sum(amount_ml) FROM hydration_entries WHERE user_id=_user AND local_date=_date),0) * 100.0 / NULLIF(COALESCE(pr.water_target_ml, 2000),0),
    'protein_pct', CASE WHEN pr.protein_target_g IS NULL THEN 0 ELSE COALESCE((SELECT sum(grams) FROM protein_entries WHERE user_id=_user AND local_date=_date),0) * 100.0 / pr.protein_target_g END,
    'breathing_min', COALESCE((SELECT sum(duration_seconds) FROM breathing_sessions WHERE user_id=_user AND local_date=_date),0) / 60.0,
    'personal_min', COALESCE((SELECT sum(minutes) FROM personal_time_entries WHERE user_id=_user AND local_date=_date),0),
    'reading_min', COALESCE((SELECT sum(minutes) FROM personal_time_entries WHERE user_id=_user AND local_date=_date AND category='reading'),0),
    'outdoor_min', COALESCE((SELECT sum(minutes) FROM personal_time_entries WHERE user_id=_user AND local_date=_date AND category='outdoor'),0));
  FOR c IN SELECT d.id, d.metric, d.step_goals, COALESCE(p.step,1) AS step FROM mission_definitions d
           JOIN user_mission_progress p ON p.mission_id = d.id AND p.user_id = _user AND p.status = 'active'
           WHERE d.metric <> 'manual' LOOP
    _val := (v ->> c.metric)::numeric;
    _goal := COALESCE(c.step_goals[c.step], c.step_goals[array_length(c.step_goals,1)], 1);
    IF _val >= _goal AND _val > 0 THEN
      INSERT INTO mission_completions (user_id, mission_id, local_date) VALUES (_user, c.id, _date) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  FOR c IN SELECT cd.id, cd.metric, cd.goal AS g FROM challenge_definitions cd WHERE cd.cadence = 'daily' AND cd.metric <> 'manual' AND cd.active LOOP
    _val := (v ->> c.metric)::numeric;
    IF _val > 0 AND _val >= COALESCE(c.g, 1) THEN
      INSERT INTO challenge_completions (user_id, challenge_id, local_date) VALUES (_user, c.id, _date) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  FOR c IN SELECT uc.id, d.metric, d.goal AS g FROM user_challenges uc JOIN challenge_definitions d ON d.id = uc.challenge_id
           WHERE uc.user_id = _user AND uc.status = 'active' AND d.metric <> 'manual' AND _date BETWEEN uc.started_on AND uc.ends_on LOOP
    _val := (v ->> c.metric)::numeric;
    IF _val > 0 AND _val >= COALESCE(c.g, 1) THEN
      INSERT INTO user_challenge_days (user_id, user_challenge_id, local_date) VALUES (_user, c.id, _date) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;
REVOKE EXECUTE ON FUNCTION public.credit_linked_progress(uuid, date) FROM PUBLIC, anon;