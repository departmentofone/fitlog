# Push notifications — status: code complete, needs two manual steps to go live

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
                                                             /api/cron/weekly-digest (Sundays)
                                                             and /api/cron/streak-check (daily)
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

## What's built

- `src/sw.ts` — custom service worker with real `push` and `notificationclick` handlers.
- `src/hooks/usePushSubscription.ts` — subscribe/unsubscribe/permission-state logic.
- `src/features/settings/PushNotificationsCard.tsx` — the Settings UI toggle.
- `src/lib/localNotify.ts` — a *separate*, simpler mechanism for local (non-push) notifications
  that don't need any of the above - used by the rest timer. No server, no subscription, just
  the browser's own Notification permission.
- `api/cron/weekly-digest.ts` — sends each subscribed user their **real** weekly numbers
  (workouts, avg calories) computed server-side with the service-role client. Not a placeholder
  anymore.
- `api/cron/streak-check.ts` — new: once daily, checks every subscribed user's current workout
  streak; if it's 2+ days and they haven't logged a workout *or* a rest day yet today, sends
  "your N-day streak ends at midnight."
- `vercel.json` — cron schedule: weekly-digest Sundays 9am UTC, streak-check daily 8pm UTC.
- `supabase/migration_v9_push_subscriptions.sql` — the `push_subscriptions` table + RLS. Ready to
  run (no longer a draft).
- VAPID keypair generated, sitting in `.env.local` (gitignored, never committed).

## What's left — two manual steps, both need to happen in your own dashboards (not something I
## can do from here)

1. **Run the migration.** Paste `supabase/migration_v9_push_subscriptions.sql` into the Supabase
   SQL editor. Until then, tapping "Enable notifications" gets a real browser permission + a real
   push subscription, but saving it to Supabase fails (table doesn't exist yet) - expected, not a
   bug, until this runs.
2. **Set these as *server* env vars in Vercel** (Project Settings → Environment Variables — NOT
   `VITE_`-prefixed except the one public key, which is meant to be public):
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → Settings → API.
   - `VAPID_PRIVATE_KEY` — already generated, currently only in local `.env.local`.
   - `VITE_VAPID_PUBLIC_KEY` — same value it has locally.
   - `CRON_SECRET` — any random string you pick; Vercel sends it back as a bearer token when it
     invokes a scheduled function, which is what both handlers check.

That's it — once both are done and the next `vercel --prod` deploy goes out, the cron schedules
in `vercel.json` pick themselves up automatically.

## Known limitation worth knowing about

**iOS**: Web Push only works from a PWA that's been *added to the home screen* — Safari tabs
(even bookmarked ones) can't receive push notifications, only the installed standalone app can,
and only iOS 16.4+. Anyone testing this on an iPhone needs to have actually installed FitLog to
the home screen first, or permission will just never be grantable.

**Vercel Cron on the Hobby plan**: schedules can only run once per day on some plan tiers - worth
checking the current plan's limits against `vercel.json`'s two schedules before relying on the
exact times above.
