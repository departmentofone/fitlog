-- FitLog schema v11: Programs - bundle workout presets, recipes, meal presets, and diet
-- goals into one shareable package a friend can import in a single batch instead of
-- preset-by-preset. Paste into the Supabase SQL editor and run once.

create table programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  is_shared boolean not null default false,
  diet_goal text,
  calorie_goal numeric,
  water_goal_ml numeric,
  -- Everything below is a self-contained snapshot (exercise/food data embedded by name +
  -- macros, not by id) so a program can be imported into a different account without
  -- needing the importer to already have matching exercises/foods - see PROGRAMS.md.
  workouts jsonb not null default '[]',
  recipes jsonb not null default '[]',
  meal_presets jsonb not null default '[]',
  created_at timestamptz not null default now()
);
alter table programs enable row level security;
create policy "read programs" on programs for select
  using (auth.uid() = user_id or is_shared);
create policy "manage own programs" on programs for insert with check (auth.uid() = user_id);
create policy "update own programs" on programs for update using (auth.uid() = user_id);
create policy "delete own programs" on programs for delete using (auth.uid() = user_id);
