-- Rest days: an explicit "I'm resting today" log that bridges a workout streak gap without
-- counting as a logged workout. Safe to run once.

create table if not exists rest_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table rest_days enable row level security;

create policy "rest_days_owner" on rest_days
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
