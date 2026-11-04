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
- Wellness data lives in Lovable Cloud tables; `src/lib/data/wellness-repo.ts` is the only data layer and `useWellness()` caches it per user via TanStack Query — why: one source of truth, RLS-enforced isolation.
- User-owned tables reference `public.profiles(id)` ON DELETE CASCADE and default `user_id` to `auth.uid()`; reusable definitions live in separate `*_definitions` tables — why: account deletion cascades and clients never supply user IDs.
- Calendar dates use the user's local date (`src/lib/dates.ts`), timestamps are UTC — why: avoids the UTC day-rollover bug.
- Old localStorage data is imported only via the user-confirmed banner (`src/lib/legacy-migration.ts`), never automatically or destructively.
