# Account Deletion — Implementation Plan

Status: planning only, nothing in this document has been implemented.

## Why this exists

Google Play's User Data policy (in effect since April 2024) requires any app that lets a user
create an account to also offer:

1. An **in-app** path to delete the account and its data.
2. A **web path** that works without the app installed and without an active in-app session
   (so someone who already uninstalled FitLog can still ask for their data to be deleted).

FitLog currently has neither. `src/lib/exportData.ts` + the "Export my data" button in
`src/features/settings/SettingsTab.tsx` are the only data-related self-service feature that
exists today — there is no deletion code anywhere in the repo.

## The hard technical constraint

Deleting a Supabase Auth user requires `supabase.auth.admin.deleteUser(userId)`, which is only
callable with the **service-role key**. That key must never reach client code (it bypasses every
RLS policy in the database). The repo already has exactly one precedent for this shape of
problem: `api/cron/weekly-digest.ts` is a Vercel serverless function that holds
`SUPABASE_SERVICE_ROLE_KEY` as a server-only env var and creates a service-role Supabase client
that "bypasses RLS — safe here because this only ever runs server-side in Vercel, never in a
browser." Account deletion needs the same pattern: a small Vercel function that the client (or
the public web page) calls, which does the actual deletion server-side.

There is currently no `vercel.json` in the repo — Vercel auto-detects anything under `api/**` as
a serverless function by convention, so no routing config is needed for a new endpoint (a
`vercel.json` is only needed if we want a cron schedule, which this doesn't).

---

## 1. In-app flow

**Location:** `src/features/settings/SettingsTab.tsx`, as a new section below the existing
"Signed in as / Change password / Export my data / Sign out" card — a natural place since that's
already the account-management card. Put it last and visually separated (e.g. a red-tinted
card) so it doesn't sit flush against routine settings.

**Confirmation UX:** the codebase already has an established two-step "arm then confirm" pattern
for destructive actions — see `src/features/workouts/WorkoutsTab.tsx` (the workout delete
button): first tap sets `confirmingDelete = true` and the button turns red with "Tap to
confirm" copy, a second tap (or `onBlur`) actually fires or cancels. That pattern is fine for
deleting a single workout because it's undoable (it uses `undoable()` from `toastBus` to offer an
undo toast backed by re-inserting a snapshot). **Account deletion is not undoable** — there is no
snapshot to restore once `auth.admin.deleteUser` runs — so the bar needs to be higher than a
double-tap. Recommended pattern, consistent in spirit with the existing tap-to-arm affordance but
stepped up for irreversibility:

- A dedicated confirmation view/modal (not just a button state flip), reached via a "Delete
  account" button in the red card.
- It states plainly what will happen: "This permanently deletes your account and all your
  workouts, meals, goals, progress photos, and presets. This cannot be undone." Mention the
  export feature ("Consider exporting your data first") and link/trigger it inline.
  Also state the caveat from section 3 in plain language if applicable: "If you've shared a
  recipe or meal preset with someone else and they've logged meals from it, one or two of your
  foods may remain visible to them after your account is gone."
- Require **typing a confirmation phrase** (e.g. the user's own email, or the literal word
  `DELETE`) into a text input before the destructive button enables — this is the standard
  "type to confirm" pattern for irreversible, non-undoable actions (GitHub repo deletion, etc.)
  and is a deliberately higher bar than the existing tap-to-confirm pattern used for reversible
  deletes elsewhere in the app.
- The button calls the new deletion endpoint (section 2) with the user's current session access
  token, shows a loading state, and surfaces errors via the existing toast system
  (`src/lib/toastBus.ts` / `emitError` already wired into `queryClient`'s `MutationCache`).

**Immediately after a successful deletion response:**

1. `queryClient.clear()` — drop all in-memory React Query state.
2. Explicitly clear the persisted cache: `offlinePersister` (see
   `src/lib/offlinePersister.ts`) writes to `window.localStorage` under the fixed key
   `fitlog-query-cache`. Call `localStorage.removeItem('fitlog-query-cache')` (or the
   persister's own `removeClient()`, which does the same thing) — `queryClient.clear()` alone
   does not touch localStorage, and leaving the persisted blob behind means a stale snapshot of
   the deleted account's data would still exist on-device and could flash on next launch before
   any fetch fails.
3. `supabase.auth.signOut()` — also clears the Supabase SDK's own localStorage session entry.
   Note: by the time this runs the user row is already gone server-side, so this is just local
   cleanup; do it regardless of whether the SDK call itself errors.
4. `useAuth`'s `onAuthStateChange` listener (in `src/hooks/useAuth.tsx`) will pick up the
   `SIGNED_OUT` event and flip `App.tsx` back to `<AuthScreen />` automatically — no extra
   routing code needed there.
5. Show a final confirmation toast/screen ("Your account has been deleted") since the app is
   about to unmount the settings view entirely.

**New files/edits for this part:**
- Edit `src/features/settings/SettingsTab.tsx` (or extract a new
  `src/features/settings/DeleteAccountCard.tsx` component, cleaner given the amount of new UI).
- Small helper, e.g. `src/lib/deleteAccount.ts`, that calls the serverless endpoint and does the
  local cleanup in step 1–3 above, so the same helper can be reused if a "public web page can
  also embed some of this logic" concern comes up later (it can't reuse the whole thing since
  the public page is a separate deployment context, but the fetch-and-cleanup shape is shared
  enough to justify factoring it out).

---

## 2. The public web path (required even fully logged out / app uninstalled)

Play's requirement is specifically: a **public web page**, reachable without installing the app
and without being logged into the app, where the same account can be deleted (or a deletion
request submitted). Since FitLog is a TWA wrapping a Vercel-hosted PWA, the natural answer is a
plain route on the same Vercel domain that:

- Is **not gated by the TWA/app shell** — it must render as an ordinary public web page reachable
  by any browser (e.g. `https://<your-vercel-domain>/delete-account`), independent of
  `src/App.tsx`'s auth-gated SPA shell. Simplest approach: a small standalone route added to the
  existing Vite app (e.g. check `window.location.pathname` before mounting the authed `<App />`
  and render a self-contained `<DeleteAccountRequestPage />` instead, so it doesn't require the
  user to already have a session) or, more simply/robustly, a Vercel Edge/static route with its
  own minimal HTML/React entry that only imports what it needs (Supabase client + fetch). Either
  way it must work with **no existing `session` in `useAuth`'s context** — that context should
  not be a dependency of this page at all.
- **Identity verification without a pre-existing session**: use Supabase's passwordless OTP flow,
  which is exactly designed for "prove you own this email, right now, with nothing else":
  - `supabase.auth.signInWithOtp({ email })` — sends a one-time code (or magic link) to the
    address. Configure it for a 6-digit **code** rather than a link (`options.shouldCreateUser:
    false` is important here — this page must never silently create a new account for an email
    that isn't already registered) so the flow is: enter email → enter code sent to inbox →
    verify.
  - `supabase.auth.verifyOtp({ email, token, type: 'email' })` — exchanges the code for a real
    session (access token + refresh token) client-side, in that page's own isolated Supabase
    client instance.
  - Once verified, this page now holds a legitimate short-lived session for that exact user, and
    can call the same deletion serverless endpoint from section 2b with that access token — the
    endpoint doesn't need to know or care whether the caller is the in-app Settings screen or this
    standalone page; it just needs a valid access token for the account being deleted.
  - This satisfies the "no app install and no existing in-app login required" requirement: the
    only prerequisite is access to the email inbox on file, which is also exactly the right
    security bar for an irreversible action.
- After a successful delete, show a plain static confirmation ("Your FitLog account and data have
  been deleted.") — no further app functionality needed on this route.

**New files for this part:**
- A new public page/route, e.g. `src/pages/DeleteAccountRequest.tsx` (or a fully separate static
  HTML+small JS bundle if it's cleaner to keep it decoupled from the main SPA's auth-gated
  bootstrapping — either is reasonable; reusing the Vite/React setup is less total work since the
  Supabase client and styling already exist).
- A small amount of routing logic in `src/main.tsx`/`index.html` (or a second Vite entry point)
  so `/delete-account` renders this page instead of the authed app shell, without requiring a
  session.
- This route must also be **linked from somewhere reachable without the app** — Play's reviewers
  check that the web deletion path is discoverable, so it should be linked from the Play Store
  listing's privacy policy page and/or the app's public marketing/support page if one exists (the
  repo doesn't appear to have a public marketing site beyond the app itself — a minimal
  "Support / Privacy" static page that links to `/delete-account` may be needed for reviewers to
  actually find it; worth confirming what URL is filed in the Play Console's "Data safety" /
  account deletion fields).

### 2b. Shared serverless deletion endpoint

One endpoint, called by both the in-app flow and the public page:

- New file: `api/account/delete.ts` (mirrors the existing `api/cron/weekly-digest.ts` pattern —
  same repo convention, `VercelRequest`/`VercelResponse` from `@vercel/node`).
- Auth: expects `Authorization: Bearer <user's access token>` (the token from either the in-app
  Supabase session or the OTP-verified session from the public page). The function should:
  1. Verify the token by calling `supabase.auth.getUser(token)` against a client built with the
     **anon** key (not service role) — this confirms the token is genuinely valid for a real user
     and extracts `user.id`. Never trust a client-supplied user id directly; always derive it from
     the verified token so nobody can pass an arbitrary UUID to delete someone else's account.
  2. Using a **service-role** client (same `SUPABASE_SERVICE_ROLE_KEY` pattern as
     `weekly-digest.ts`), do the explicit cleanup described in section 3 (Storage files, and the
     cross-account `foods` edge case) that plain FK cascade does not cover.
  3. Call `supabase.auth.admin.deleteUser(user.id)` — this cascades through every table described
     in section 3 that has `on delete cascade` back to `auth.users`.
  4. Return 200 on success; return a clear error on failure (e.g. if step 2's cleanup or step 3's
     delete throws) so the caller can show a real error instead of pretending success.
- No `CRON_SECRET`-style bearer check is needed here (that pattern in `weekly-digest.ts` is for
  authenticating *Vercel's own cron invocation*, not a real user) — this endpoint's auth is the
  user's own access token instead.
- Add `SUPABASE_SERVICE_ROLE_KEY` as a Vercel server env var if not already present (it's already
  referenced by the draft `weekly-digest.ts`, so it likely already needs to exist per
  `PUSH_NOTIFICATIONS.md`, or will need to be added now regardless).

---

## 3. Data fate — table by table

Verified directly against `supabase/migration.sql` through `migration_v11.sql` (skipping
`migration_v9_draft_DO_NOT_RUN_YET.sql`, which is explicitly not applied yet).

### Cascades automatically from `auth.users` on `admin.deleteUser()`

All of these have `user_id uuid ... references auth.users(id) on delete cascade` (or cascade via
a parent that itself cascades from `auth.users`), so a single `admin.deleteUser(id)` removes them
with no extra code:

| Table | Cascade path |
|---|---|
| `exercises` (user's own, `user_id` not null) | direct `on delete cascade` from `auth.users` |
| `workout_sessions` | direct `on delete cascade` from `auth.users` |
| `workout_sets` | cascades from `workout_sessions` (session deleted → sets deleted); also has its own `exercise_id → exercises on delete cascade` |
| `foods` (user's own, `user_id` not null) | direct `on delete cascade` from `auth.users` — **see caveat below** |
| `meals` | direct `on delete cascade` from `auth.users` |
| `meal_items` | cascades from `meals` |
| `user_settings` | direct `on delete cascade` from `auth.users` (PK is `user_id` itself) |
| `water_logs` | direct `on delete cascade` from `auth.users` |
| `goals` | direct `on delete cascade` from `auth.users` (its `target_exercise_id → exercises` is `on delete set null`, irrelevant here) |
| `progress_entries` | direct `on delete cascade` from `auth.users` — **but see Storage note below** |
| `workout_presets` | direct `on delete cascade` from `auth.users` |
| `workout_preset_items` | cascades from `workout_presets`; its `exercise_id → exercises` is also `on delete cascade` |
| `exercise_notes` | direct `on delete cascade` from `auth.users` (composite PK with `exercise_id`, which also cascades) |
| `meal_presets` | direct `on delete cascade` from `auth.users` — **see caveat below** |
| `meal_preset_items` | cascades from `meal_presets` — **see caveat below** |
| `alcohol_logs` | direct `on delete cascade` from `auth.users` |
| `fasting_sessions` | direct `on delete cascade` from `auth.users` |
| `recipes` | direct `on delete cascade` from `auth.users` — **see caveat below** |
| `recipe_ingredients` | cascades from `recipes` — **see caveat below** |
| `programs` | direct `on delete cascade` from `auth.users` (confirmed self-contained JSONB, see below) |
| `push_subscriptions` | direct `on delete cascade` from `auth.users` (table not created yet — draft migration, not run) |

### Needs explicit cleanup in the deletion endpoint (not covered by FK cascade)

**Storage: `progress-photos` bucket.** `migration_v3.sql` creates a private bucket with
`storage.objects` RLS scoped by `(storage.foldername(name))[1] = auth.uid()::text` (folder-per-
user, `<user_id>/<filename>`). `progress_entries.photo_path` rows cascade-delete fine, but the
**actual files in Supabase Storage are not Postgres rows** — `storage.objects` deletion is not
reached by a Postgres `ON DELETE CASCADE` from `auth.users`. The deletion endpoint must
explicitly list and remove everything under that user's folder via the Storage API before (or
after — order doesn't matter for this bucket since nothing else references it) deleting the auth
user, e.g. `supabase.storage.from('progress-photos').list(userId)` → `.remove([...paths])`, using
the service-role client so it isn't limited by the per-user RLS folder policy. Skipping this
leaves orphaned image blobs in the bucket forever (not a correctness bug, but a real privacy gap
— "delete my data" should mean the photos too, and it's exactly the kind of thing a Play
reviewer or a privacy-conscious user would test for).

### The cross-account edge case (verified against actual code, not assumed)

The task description's premise — that shared content uses "self-contained JSONB snapshots rather
than live FK references" — is **only true of the `programs` table** (`migration_v11.sql`, whose
own comment confirms it: "self-contained snapshot... embedded by name + macros, not by id...
so a program can be imported into a different account without needing the importer to already
have matching exercises/foods"). `programs` is therefore completely safe: deleting either
account's `programs` rows never affects the other account.

**The older sharing mechanism (`meal_presets` / `recipes`, `migration_v6.sql` / `v7.sql`) is not
a snapshot — it holds live `food_id` foreign keys, and the app code copies those live references
across accounts:**

- `useLoadMealPreset()` in `src/hooks/useMealPresets.ts` copies `i.food_id` verbatim from a
  shared preset's `meal_preset_items` into brand-new `meal_items` rows owned by whoever loads it.
- `useAddRecipeToMeal()` in `src/hooks/useRecipes.ts` does the same from a shared recipe's
  `recipe_ingredients` into `meal_items`.
- Both `meal_presets`/`recipes` are visible cross-account whenever `is_shared = true` (RLS:
  `auth.uid() = user_id or is_shared`), which is exactly the mechanism a 2-person household/couple
  app would use for a workout partner to reuse the other's meal preset or recipe.

So: if user A creates a **non-global, personally-owned** food (a `foods` row with their own
`user_id`, not the `user_id is null` shared/global kind), builds a shared recipe or meal preset
from it, and user B **loads that preset or adds that recipe to one of their own meals**, user B
now has their own `meal_items` row (and possibly, if B later saves that meal as their own preset
via `useCreateMealPresetFromMeal`, their own `meal_preset_items` row too) whose `food_id` points
at user A's private `foods` row — a live cross-account reference, not a snapshot.

The schema has a real mismatch here: `foods.user_id → auth.users` is `on delete cascade`, but
`meal_items.food_id`, `recipe_ingredients.food_id`, and `meal_preset_items.food_id` are all
`references foods(id) on delete restrict`. If user A's account is deleted:
1. `admin.deleteUser` cascades to delete A's owned `foods` rows.
2. Postgres tries to cascade-delete that food, but B's `meal_items`/`meal_preset_items` row
   (owned by B, not part of A's cascade set) still references it, and `on delete restrict` blocks
   the deletion.
3. The entire `admin.deleteUser` call fails with a foreign key violation — **A's account doesn't
   get deleted at all**, not even the parts of it with no such reference, because this happens
   inside a single statement/transaction.

This is a narrow but real risk given FitLog is explicitly built for two people sharing content.
Recommended handling in the deletion endpoint (step 2 of section 2b), using the service-role
client, run before calling `admin.deleteUser`:

1. Find the deleting user's `foods` rows that are still referenced by another user's
   `meal_items`, `recipe_ingredients`, or `meal_preset_items` (i.e. referenced by a row whose
   owning `meal`/`recipe`/`meal_preset` belongs to a *different* `user_id`).
2. For exactly those rows, `update foods set user_id = null where id = ...` — converting them
   from "personal" to "global/shared" instead of letting them cascade-delete. This preserves the
   other person's historical logs and lets the normal cascade proceed cleanly for every other
   food. It has a small side effect worth surfacing in the in-app confirmation copy (section 1):
   a food you made private may become visible in the shared/global food list if your workout
   partner had used it in something they saved. For a 2-person app this is a reasonable and
   honest tradeoff versus either (a) silently failing the whole account deletion, or (b) deleting
   the other person's logged meals/presets out from under them.
3. All other owned `foods` rows (unreferenced by anyone else) cascade-delete normally as part of
   step 3.

This is the single trickiest part of the whole feature — it's the one place where a naive
"just call `admin.deleteUser` and let cascades handle it" implementation will work fine in
testing (a lone test account with no shared content) and then fail in production the first time
the two real users of this app have shared a recipe or meal preset with each other.

---

## 4. Play Store Data Safety form implication

The Play Console's Data Safety section asks developers to declare, among other things, whether
users can request that their data be deleted. Shipping (a) the in-app deletion flow and (b) the
public, logged-out-accessible web deletion path lets the listing truthfully answer "yes" to that
question and link the public page as the deletion-request URL — without this feature the honest
answer is "no," which is both a worse trust signal to users and a policy compliance gap for an
app that supports account creation (FitLog does, via `supabase.auth.signUp` in
`src/components/Auth.tsx`). This is not optional polish for a public Play Store launch; it's a
listed launch requirement.

---

## 5. Rough effort estimate

Assuming someone already fluent in this stack (Vite/React/TS, Supabase, Vercel functions) who
has read this plan:

**Files to add:**
- `api/account/delete.ts` — the shared serverless deletion endpoint (verify token, do the `foods`
  ownership-transfer cleanup, remove Storage files, call `admin.deleteUser`). ~2–3 hrs including
  testing the cross-account edge case with two real test accounts.
- `src/pages/DeleteAccountRequest.tsx` (+ small routing change in `src/main.tsx`/`index.html` to
  serve it without an authed session) — the public OTP-gated page. ~2–3 hrs (OTP send/verify UI,
  loading/error states, final confirmation screen).
- `src/lib/deleteAccount.ts` — shared client helper (call endpoint, clear query cache/localStorage,
  sign out). ~30–45 min.
- `src/features/settings/DeleteAccountCard.tsx` (or inline addition to `SettingsTab.tsx`) — the
  in-app entry point with the type-to-confirm modal. ~1.5–2 hrs.

**Files to touch:**
- `src/features/settings/SettingsTab.tsx` — mount the new card.
- Vercel project settings — confirm/add `SUPABASE_SERVICE_ROLE_KEY` server env var (may already
  be planned for the push-notification work per `PUSH_NOTIFICATIONS.md`).
- Play Console — add the public deletion page URL to the Data Safety form and privacy policy.
- Whatever the app's public privacy-policy/support page is (or a new minimal one) — link to
  `/delete-account` so it's actually discoverable per policy, not just technically reachable.

**Total: roughly 8–12 hours** of implementation + testing, with the bulk of the uncertainty in
(a) getting the public route to render with zero dependency on an existing session without
fighting the SPA's current auth-gated bootstrap, and (b) actually testing the cross-account
`foods` ownership-transfer edge case end-to-end with two accounts that have shared a recipe or
meal preset with each other — that scenario is easy to skip in testing and is exactly the one
that will break in the real two-person usage this app is built for.
