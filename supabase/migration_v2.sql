-- FitLog schema v2: settings, water logging, goals, and a shared exercise library.
-- Paste into the Supabase SQL editor and run once.

create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ask_preworkout boolean not null default true,
  diet_goal text not null default 'deficit' check (diet_goal in ('deficit', 'maintenance', 'surplus')),
  calorie_goal numeric,
  water_goal_ml numeric not null default 2000,
  weight_goal numeric,
  current_weight numeric,
  height_cm numeric,
  age int,
  sex text check (sex in ('male', 'female', 'other')),
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;
create policy "own settings" on user_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  ml numeric not null default 0,
  unique (user_id, date)
);

alter table water_logs enable row level security;
create policy "own water logs" on water_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('workout', 'custom')),
  title text not null,
  notes text,
  target_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table goals enable row level security;
create policy "own goals" on goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Allow a shared, global exercise library (user_id null) alongside personal custom exercises,
-- the same pattern already used for foods.
alter table exercises alter column user_id drop not null;

create policy "read shared exercises" on exercises for select
  using (user_id is null);
