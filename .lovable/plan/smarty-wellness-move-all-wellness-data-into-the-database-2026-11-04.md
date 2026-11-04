# Smarty Wellness: move all wellness data into the database

Your saved data moves from the browser into Lovable Cloud. Each account sees only its own data. The look, pages and flows stay the same.

## 1. Database (one migration, adds to what exists)
- `profiles`: keep it as it is. Add `timezone` and `onboarded_at`.
- `wellness_profiles` (one row per user): personal, daily-life, physical, nutrition and mental fields stored as typed columns.
- `check_ins`: unique per (user, local date). Stores mood, energy, stress, motivation and sleep scored 1–5, a `needs[]` list and a note.
- `mission_definitions` and `user_mission_progress` (step, completed, completed_on, history).
- `challenge_definitions` and `user_challenge_completions` (one row per completion date, which keeps the history).
- `bucket_goals`, including a progress check of 0–100 and timestamps.
- `experiment_definitions`, `user_experiments` (status, start/end) and `experiment_logs` (daily measurements as JSONB).
- `coach_conversations` and `coach_messages`: role, timestamps, optional links to recommendation/check-in. Storage only; no AI coach is built.
- `recommendations`: type, content, area, status, optional mission/challenge link.
- `ritual_definitions` (seeded with Morning Activation, Midday Reset and Evening Unwind) and `ritual_completions`.
- `wellness_reviews`: period type, start/end, summary, trends as JSONB.
- `legacy_imports`: records each import so the same data can't be imported twice.
- Definition tables are seeded with the current starter missions, challenges and experiments, keeping their existing IDs.
- Each user table has a `user_id` linked to the account. Deleting an account deletes its rows. Indexes cover (user_id, date).
- RLS on every table. User tables allow select, insert, update and delete only where `auth.uid() = user_id`, and `user_id` defaults to `auth.uid()`. Definition tables can be read by signed-in users only. Grants are added for authenticated and service_role.

## 2. Data access
- Typed services in `src/lib/data/*.ts` that use the browser client with RLS applied.
- `wellness-store.tsx` keeps the same `useWellness()` interface. Data loads with TanStack Query, keyed by user ID. Changes show instantly and roll back if saving fails. Failed loads retry. There are loading and error states.
- On sign-out or account switch, the query cache and context are cleared, so nothing from a previous account stays on screen.
- Nothing is written to localStorage any more. The old key is left in place.

## 3. Moving data saved in the browser (prepared, not run)
- `src/lib/legacy-migration.ts`: finds and checks the old data, spots conflicts, and imports through upserts that can be safely repeated, keyed on the original IDs and dates. The original data is not deleted.
- A banner asks the user before anything is imported. Imports start only from that banner, never automatically.

## 4. Dates and time zones
- `todayKey()` uses the local calendar date (or the profile's time zone). Calendar dates are stored as `date`, and timestamps as `timestamptz` in UTC.

## 5. Checks
- Unit tests for the local-date function and for checking old data.
- Two test accounts: check that A can't read or write B's rows through direct database requests.
- Playwright: the sign-in → check-in → Today → mission flow, sign-out clearing the screen, and a mobile viewport.
- Run the linter and check the build.
- Final report keeps implemented, tested and prepared work separate.

## Out of scope
AI coach, subscriptions, integrations, and running the full data move.
