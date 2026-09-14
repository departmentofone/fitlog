-- FitLog schema v6: warmup flag, session timer, exercise notes, meal presets,
-- alcohol tracking, fasting sessions, auto-tracked workout goals, shared presets,
-- theme preference. Paste into the Supabase SQL editor and run once.

alter table workout_sets add column if not exists is_warmup boolean not null default false;

alter table workout_sessions add column if not exists started_at timestamptz;
alter table workout_sessions add column if not exists duration_seconds integer;

create table exercise_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);
alter table exercise_notes enable row level security;
create policy "own exercise notes" on exercise_notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table meal_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_shared boolean not null default false,
  created_at timestamptz not null default now()
);
create table meal_preset_items (
  id uuid primary key default gen_random_uuid(),
  preset_id uuid not null references meal_presets(id) on delete cascade,
  food_id uuid not null references foods(id) on delete restrict,
  grams numeric not null,
  serving_label text
);
alter table meal_presets enable row level security;
create policy "read meal presets" on meal_presets for select
  using (auth.uid() = user_id or is_shared);
create policy "manage own meal presets" on meal_presets for insert with check (auth.uid() = user_id);
create policy "update own meal presets" on meal_presets for update using (auth.uid() = user_id);
create policy "delete own meal presets" on meal_presets for delete using (auth.uid() = user_id);

alter table meal_preset_items enable row level security;
create policy "read meal preset items" on meal_preset_items for select
  using (exists (select 1 from meal_presets p where p.id = preset_id and (p.user_id = auth.uid() or p.is_shared)));
create policy "manage own meal preset items" on meal_preset_items for insert
  with check (exists (select 1 from meal_presets p where p.id = preset_id and p.user_id = auth.uid()));
create policy "update own meal preset items" on meal_preset_items for update
  using (exists (select 1 from meal_presets p where p.id = preset_id and p.user_id = auth.uid()));
create policy "delete own meal preset items" on meal_preset_items for delete
  using (exists (select 1 from meal_presets p where p.id = preset_id and p.user_id = auth.uid()));

-- Shared workout presets (the existing workout_presets table already has RLS; add sharing)
alter table workout_presets add column if not exists is_shared boolean not null default false;
drop policy if exists "own presets" on workout_presets;
create policy "read workout presets" on workout_presets for select
  using (auth.uid() = user_id or is_shared);
create policy "manage own workout presets" on workout_presets for insert with check (auth.uid() = user_id);
create policy "update own workout presets" on workout_presets for update using (auth.uid() = user_id);
create policy "delete own workout presets" on workout_presets for delete using (auth.uid() = user_id);

drop policy if exists "preset items via own preset" on workout_preset_items;
create policy "read workout preset items" on workout_preset_items for select
  using (exists (select 1 from workout_presets p where p.id = preset_id and (p.user_id = auth.uid() or p.is_shared)));
create policy "manage own workout preset items" on workout_preset_items for insert
  with check (exists (select 1 from workout_presets p where p.id = preset_id and p.user_id = auth.uid()));
create policy "update own workout preset items" on workout_preset_items for update
  using (exists (select 1 from workout_presets p where p.id = preset_id and p.user_id = auth.uid()));
create policy "delete own workout preset items" on workout_preset_items for delete
  using (exists (select 1 from workout_presets p where p.id = preset_id and p.user_id = auth.uid()));

create table alcohol_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  name text not null,
  volume_ml numeric,
  abv_percent numeric,
  calories numeric not null,
  created_at timestamptz not null default now()
);
alter table alcohol_logs enable row level security;
create policy "own alcohol logs" on alcohol_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table fasting_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  target_hours numeric not null default 16,
  created_at timestamptz not null default now()
);
alter table fasting_sessions enable row level security;
create policy "own fasting sessions" on fasting_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-tracked workout goals: structured target instead of only a freeform checkbox
alter table goals add column if not exists target_exercise_id uuid references exercises(id) on delete set null;
alter table goals add column if not exists target_weight numeric;
alter table goals add column if not exists target_reps int;

-- Theme preference
alter table user_settings add column if not exists theme text not null default 'system' check (theme in ('light', 'dark', 'system'));
alter table user_settings add column if not exists color_palette text not null default 'emerald';
