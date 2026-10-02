-- FitLog schema v34: push tokens for the Android (and later iOS) app.
--
-- The website's push subscriptions (push_subscriptions) are Web Push endpoints and keys. The app
-- gets a Firebase Cloud Messaging token instead, so it gets its own small table. The weekly summary
-- and streak crons send to both (api/_fcm.ts for these). One row per device; a token that Firebase
-- reports as gone is deleted by the crons. Deleting the account deletes the rows (cascade).
create table if not exists native_push_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table native_push_tokens enable row level security;
create index if not exists native_push_tokens_user_id on native_push_tokens (user_id);

drop policy if exists "own native push tokens" on native_push_tokens;
create policy "own native push tokens" on native_push_tokens for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Check: the table exists with RLS on and one policy.
select relname, relrowsecurity, (select count(*) from pg_policies where tablename = 'native_push_tokens') as policies
from pg_class where relname = 'native_push_tokens';
