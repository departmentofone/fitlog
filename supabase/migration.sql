-- FitLog schema. Paste into the Supabase SQL editor and run once on a fresh project.

create extension if not exists "pgcrypto";

create type muscle_group as enum (
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'abs', 'quads', 'hamstrings', 'glutes', 'calves', 'cardio'
);

create table exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  muscle_group muscle_group not null,
  created_at timestamptz not null default now()
);

create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  preworkout boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  set_number int not null,
  weight numeric not null,
  reps int not null,
  difficulty smallint not null check (difficulty between 1 and 10),
  created_at timestamptz not null default now()
);

create table foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  calories_per_100g numeric not null,
  protein_per_100g numeric not null default 0,
  carbs_per_100g numeric not null default 0,
  fat_per_100g numeric not null default 0,
  common_servings jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  name text not null default 'Meal',
  created_at timestamptz not null default now()
);

create table meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references meals(id) on delete cascade,
  food_id uuid not null references foods(id) on delete restrict,
  grams numeric not null,
  serving_label text,
  created_at timestamptz not null default now()
);

create index on exercises (user_id);
create index on workout_sessions (user_id, date);
create index on workout_sets (session_id);
create index on foods (user_id);
create index on meals (user_id, date);
create index on meal_items (meal_id);

alter table exercises enable row level security;
alter table workout_sessions enable row level security;
alter table workout_sets enable row level security;
alter table foods enable row level security;
alter table meals enable row level security;
alter table meal_items enable row level security;

create policy "own exercises" on exercises for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own sessions" on workout_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sets via own session" on workout_sets for all
  using (exists (select 1 from workout_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from workout_sessions s where s.id = session_id and s.user_id = auth.uid()));

create policy "read foods" on foods for select
  using (user_id is null or user_id = auth.uid());
create policy "insert own foods" on foods for insert
  with check (user_id = auth.uid());
create policy "update own foods" on foods for update
  using (user_id = auth.uid());
create policy "delete own foods" on foods for delete
  using (user_id = auth.uid());

create policy "own meals" on meals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "meal items via own meal" on meal_items for all
  using (exists (select 1 from meals m where m.id = meal_id and m.user_id = auth.uid()))
  with check (exists (select 1 from meals m where m.id = meal_id and m.user_id = auth.uid()));
