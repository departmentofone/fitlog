# Push notifications — status: scaffolding only, nothing sends yet

How it fits together, given the stack (Vite PWA + Vercel static hosting + Supabase, no
persistent server):

```
Browser (client)                Supabase (Postgres)          Vercel (server-only)
─────────────────                ──────────────────            ────────────────────
1. Ask permission
2. PushManager.subscribe()  →  3. store subscription
   (via src/sw.ts,              in push_subscriptions
   VITE_VAPID_PUBLIC_KEY)       (endpoint + keys, RLS
                                 owner-only)
                                                          4. Vercel Cron hits
                                                             /api/cron/weekly-digest
                                                             on a schedule
                                                          5. reads ALL subscriptions
                                                             via service_role (bypasses
                                                             RLS - server-only, never
                                                             touches the client)
                                                          6. web-push encrypts + POSTs
                                                             to each subscription's
                                                             endpoint using
                                                             VAPID_PRIVATE_KEY
7. src/sw.ts 'push' event fires → showNotification()
8. 'notificationclick' → focuses/opens the app
```

## What's actually built right now

- `src/sw.ts` — custom service worker (switched vite-plugin-pwa from `generateSW` to
  `injectManifest` mode to allow this) with real `push` and `notificationclick` handlers.
- `src/hooks/usePushSubscription.ts` — subscribe/unsubscribe/permission-state logic. Real,
  testable, works today for the "ask permission → get a browser subscription" half.
- `src/features/settings/PushNotificationsCard.tsx` — the Settings UI toggle, wired into
  `SettingsTab.tsx`.
- `api/cron/weekly-digest.ts` — a draft Vercel serverless function that reads subscriptions and
  sends a **generic placeholder** push via `web-push`. Not wired to a schedule.
- `supabase/migration_v9_draft_DO_NOT_RUN_YET.sql` — the `push_subscriptions` table + RLS.
- VAPID keypair generated, sitting in `.env.local` (gitignored, never committed).

## What's NOT done — the actual remaining steps, in order

1. **Run the migration.** Rename `migration_v9_draft_DO_NOT_RUN_YET.sql` → `migration_v9.sql`
   (or just tell me to) and paste it into the Supabase SQL editor. Until then, tapping "Enable
   notifications" will get real browser permission + a real push subscription, but saving it to
   Supabase will fail (table doesn't exist) — that failure is expected right now, not a bug.
2. **Set server env vars in Vercel** (Project Settings → Environment Variables — NOT as
   `VITE_`-prefixed, those get bundled into the client and would leak):
   - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase dashboard → Settings → API. This is the key
     that was flagged earlier in this project as dangerous to expose — it's fine here
     specifically because it only ever runs inside a Vercel serverless function, never in
     the browser bundle.
   - `VAPID_PRIVATE_KEY` — already generated, currently only in local `.env.local`.
   - `VITE_VAPID_PUBLIC_KEY` — same value it has locally; this one *is* meant to be public.
   - `CRON_SECRET` — any random string you pick; Vercel automatically sends it back as a
     bearer token when it invokes a scheduled function, which is what the handler checks to
     reject random internet requests to that URL.
3. **Make the digest real.** `api/cron/weekly-digest.ts` currently sends the same generic
   message to everyone. The actual per-user numbers live in `src/hooks/useWeeklyDigest.ts`,
   which only runs client-side (scoped to the signed-in user via RLS). That logic needs a
   server-side version that loops over each user with the service-role client.
4. **Turn the schedule on.** Add a `vercel.json` with a `crons` entry, e.g. Sundays 9am UTC:
   ```json
   { "crons": [{ "path": "/api/cron/weekly-digest", "schedule": "0 9 * * 0" }] }
   ```
   (Vercel's Hobby plan has cron limits — worth checking current limits against the plan on
   this account before relying on a specific cadence.)
5. **Deploy.** Nothing above touches production until an actual `vercel --prod` happens.

## Known limitation worth knowing about

**iOS**: Web Push only works from a PWA that's been *added to the home screen* — Safari tabs
(even bookmarked ones) can't receive push notifications, only the installed standalone app can,
and only iOS 16.4+. Anyone testing this on an iPhone needs to have actually installed FitLog to
the home screen first, or permission will just never be grantable.
