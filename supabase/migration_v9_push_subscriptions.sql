-- FitLog schema v9: push notification subscriptions.
-- The sending side (api/cron/weekly-digest.ts, api/cron/streak-check.ts) is now real - run this,
-- then see PUSH_NOTIFICATIONS.md for the remaining Vercel env vars + cron setup.

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
create policy "own push subscriptions" on push_subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Deliberately NOT granting the anon/authenticated roles any access beyond the RLS policy
-- above. The sender (a Vercel serverless function) reads this table using the Supabase
-- service_role key server-side, which bypasses RLS entirely - it never goes through the
-- client's anon key, so no additional policy is needed for it.
