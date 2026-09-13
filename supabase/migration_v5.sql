-- FitLog schema v5: workout presets (reusable templates of exercises + sets/reps/weight).
-- Paste into the Supabase SQL editor and run once.

create table workout_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table workout_preset_items (
  id uuid primary key default gen_random_uuid(),
  preset_id uuid not null references workout_presets(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  set_number int not null,
  weight numeric not null,
  reps int not null
);

alter table workout_presets enable row level security;
create policy "own presets" on workout_presets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table workout_preset_items enable row level security;
create policy "preset items via own preset" on workout_preset_items for all
  using (exists (select 1 from workout_presets p where p.id = preset_id and p.user_id = auth.uid()))
  with check (exists (select 1 from workout_presets p where p.id = preset_id and p.user_id = auth.uid()));
