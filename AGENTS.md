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
