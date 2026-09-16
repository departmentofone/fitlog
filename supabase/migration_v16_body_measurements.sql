-- Body measurements: waist/chest/arms/hips tracked per date, alongside the existing
-- progress_entries weight tracking. Always stored in cm regardless of the user's unit
-- preference, same pattern current_weight/weight_goal use for kg. Safe to run once.

create table if not exists body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  waist_cm numeric,
  chest_cm numeric,
  arms_cm numeric,
  hips_cm numeric,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table body_measurements enable row level security;

create policy "own body measurements" on body_measurements
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
