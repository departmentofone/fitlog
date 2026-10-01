-- FitLog schema v33: pending "Rest over" alerts, sent as Web Push by api/rest-alert.ts.
--
-- One row per device (its push endpoint) while a rest timer counts. The row is replaced when
-- the rest starts again or gets +15s, and deleted when it's skipped, finished on screen, or the
-- alert goes out. `token` changes on every replacement, so a server waiting on an older rest can
-- tell it was superseded and stop.
--
-- Only the server (service role key, which bypasses row-level security) reads or writes this
-- table. RLS is on with no policies, so the public key can't touch it at all.
create table if not exists rest_alerts (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  ends_at timestamptz not null,
  token uuid not null,
  updated_at timestamptz not null default now()
);
alter table rest_alerts enable row level security;
create index if not exists rest_alerts_user_id on rest_alerts (user_id);

-- Check: rest_alerts exists with RLS on and no policies.
select relname, relrowsecurity, (select count(*) from pg_policies where tablename = 'rest_alerts') as policies
from pg_class where relname = 'rest_alerts';
