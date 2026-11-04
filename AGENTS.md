<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Wellness data lives in Lovable Cloud tables; `src/lib/data/*-repo.ts` are the only data layer, cached per user via TanStack Query (`useWellness()` for profile/missions/challenges, `useDaily()` for rituals and habit logs) — why: one source of truth, RLS-enforced isolation.
- User-owned tables reference `public.profiles(id)` ON DELETE CASCADE and default `user_id` to `auth.uid()`; reusable definitions live in separate `*_definitions` tables — why: account deletion cascades and clients never supply user IDs.
- Calendar dates use the user's local date (`src/lib/dates.ts`), timestamps are UTC — why: avoids the UTC day-rollover bug.
- Old localStorage data is imported only via the user-confirmed banner (`src/lib/legacy-migration.ts`), never automatically or destructively.
- Habit logs credit missions/challenges via database triggers (`credit_linked_progress`), and mission levelling happens in a trigger on mission completions — why: one shared completion system, no double logging.
- Intelligence (recommendations, life gaps, patterns, mission advice, weekly review) is one pure engine in `src/lib/intelligence/engine.ts`, used by both the UI (`useIntelligence`) and Smarty Coach's server function — why: every surface reads the same context and can't contradict another.
- Smarty Coach runs only in `src/lib/coach.functions.ts` (authenticated server function, Lovable AI Gateway); repos accept an optional user-scoped client so the server reuses them under RLS — why: no keys in the browser, no duplicate data access.
- Personal development (goals = `bucket_goals` + milestones/actions, experiments, journey, period reviews) is computed by the pure `src/lib/intelligence/development.ts` over `useDevelopment()` data; goal progress comes only from milestones or the user's manual value, never from linked habits — why: progress must reflect relevant recorded actions, and the coach/report/UI share one calculation.
- Reports are generated as PDFs in the browser (`src/lib/report-pdf.ts`, jsPDF) — why: personal data never leaves the user's session.
- Membership: one central config in `src/lib/membership.ts` (plan, free paths) + `subscriptions` table written only by the signed payments webhook (`src/routes/api/public/payments/webhook.ts`, idempotent via `stripe_webhook_events`); the database's `has_active_subscription` gates new activity rows via restrictive INSERT policies and the coach server functions — why: access is enforced on the backend, prices change in one place, and lapsed members keep read/delete access to their data.
- Admin: roles live in `user_roles` checked via `has_role`; every admin server function in `src/lib/admin.functions.ts` verifies the role before using the service client, and business reports come from the `admin_report` database function over real records — why: no client-side admin checks and no invented metrics.
- Member messaging: in-app `inbox_messages` (daily coaching via the scheduled `/api/public/jobs/daily-messages` route, announcements, support replies) and `support_threads`/`support_messages` — why: one message center; email delivery is not set up.
