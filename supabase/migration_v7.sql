-- FitLog schema v7: recipe builder (recipes made of food ingredients, viewable
-- with total/per-serving macros, addable as scaled portions into a logged meal).
-- Paste into the Supabase SQL editor and run once.

create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  servings numeric not null default 1,
  is_shared boolean not null default false,
  created_at timestamptz not null default now()
);
create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  food_id uuid not null references foods(id) on delete restrict,
  grams numeric not null,
  serving_label text,
  created_at timestamptz not null default now()
);
alter table recipes enable row level security;
create policy "read recipes" on recipes for select
  using (auth.uid() = user_id or is_shared);
create policy "manage own recipes" on recipes for insert with check (auth.uid() = user_id);
create policy "update own recipes" on recipes for update using (auth.uid() = user_id);
create policy "delete own recipes" on recipes for delete using (auth.uid() = user_id);

alter table recipe_ingredients enable row level security;
create policy "read recipe ingredients" on recipe_ingredients for select
  using (exists (select 1 from recipes r where r.id = recipe_id and (r.user_id = auth.uid() or r.is_shared)));
create policy "manage own recipe ingredients" on recipe_ingredients for insert
  with check (exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()));
create policy "update own recipe ingredients" on recipe_ingredients for update
  using (exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()));
create policy "delete own recipe ingredients" on recipe_ingredients for delete
  using (exists (select 1 from recipes r where r.id = recipe_id and r.user_id = auth.uid()));
