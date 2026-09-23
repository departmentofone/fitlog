-- FitLog schema v28: the Community tab - browse presets, recipes and programs people share, save
-- a copy, and a first set of official meal presets. Needs v25 (is_site_owner). Safe to run more
-- than once.

-- 1. New columns on the four shareable tables.
--    is_official: curated by FitLog itself, shown with an "Official" badge (see the guard below).
--    source_id:   on a saved copy, the Community item it came from - how the app knows "Saved".
--    description: a one-line summary shown on Community cards (programs already have one).
alter table meal_presets    add column if not exists is_official boolean not null default false;
alter table recipes         add column if not exists is_official boolean not null default false;
alter table workout_presets add column if not exists is_official boolean not null default false;
alter table programs        add column if not exists is_official boolean not null default false;

alter table meal_presets    add column if not exists source_id uuid references meal_presets(id) on delete set null;
alter table recipes         add column if not exists source_id uuid references recipes(id) on delete set null;
alter table workout_presets add column if not exists source_id uuid references workout_presets(id) on delete set null;
alter table programs        add column if not exists source_id uuid references programs(id) on delete set null;

alter table meal_presets    add column if not exists description text;
alter table recipes         add column if not exists description text;
alter table workout_presets add column if not exists description text;

create index if not exists meal_presets_shared_idx    on meal_presets (is_shared) where is_shared;
create index if not exists recipes_shared_idx         on recipes (is_shared) where is_shared;
create index if not exists workout_presets_shared_idx on workout_presets (is_shared) where is_shared;
create index if not exists programs_shared_idx        on programs (is_shared) where is_shared;

-- 2. Nobody can make their own item "Official" through the app or the API: for requests from
--    app users (the anon/authenticated roles), is_official is forced to false on insert and left
--    unchanged on update. The SQL editor (which has no app role) can still set it, which is how
--    official items get created below.
create or replace function public.guard_is_official() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.is_official := false;
    else
      new.is_official := old.is_official;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists guard_is_official on meal_presets;
create trigger guard_is_official before insert or update on meal_presets for each row execute function public.guard_is_official();
drop trigger if exists guard_is_official on recipes;
create trigger guard_is_official before insert or update on recipes for each row execute function public.guard_is_official();
drop trigger if exists guard_is_official on workout_presets;
create trigger guard_is_official before insert or update on workout_presets for each row execute function public.guard_is_official();
drop trigger if exists guard_is_official on programs;
create trigger guard_is_official before insert or update on programs for each row execute function public.guard_is_official();

-- 3. Reports: any signed-in user can flag a Community item; only the owner can read them
--    (Supabase -> Table editor -> community_reports).
create table if not exists community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('meal_preset', 'recipe', 'workout_preset', 'program')),
  item_id uuid not null,
  item_name text,
  reason text check (char_length(reason) <= 500),
  created_at timestamptz not null default now()
);
alter table community_reports enable row level security;
drop policy if exists "users can report" on community_reports;
create policy "users can report" on community_reports for insert with check (reporter_id = auth.uid());
drop policy if exists "owner reads reports" on community_reports;
create policy "owner reads reports" on community_reports for select using (public.is_site_owner());
drop policy if exists "owner deletes reports" on community_reports;
create policy "owner deletes reports" on community_reports for delete using (public.is_site_owner());

-- 4. Official meal presets. Real meals built only from foods in the shared library, so the
--    nutrition comes from the same per-100g values as everything else. Portions are standard
--    household measures with their gram weights from USDA FoodData Central (e.g. 1 large egg =
--    50 g, 1 cup cooked white rice = 158 g, 1 medium banana = 118 g, 1 tbsp olive oil = 13.5 g).
--    Two exceptions, both from labels: 1/3 avocado = 50 g (the standard avocado serving) and one
--    whey scoop = 30 g (the typical scoop on major brands). Owned by the owner account, shared,
--    and hidden from that account's own preset list (the app filters out official items there).
do $$
declare
  owner_id uuid;
  missing text;
  rec record;
  new_id uuid;
begin
  select id into owner_id from auth.users where email = 'msolarovsocial@gmail.com';
  if owner_id is null then
    raise exception 'Owner account not found - nothing created';
  end if;

  create temp table official_items (
    preset_order int, preset text, description text, item_order int,
    food_name text, grams numeric, serving_label text
  ) on commit drop;

  insert into official_items values
    (1, 'Greek Yogurt Berry Bowl', 'High-protein breakfast or snack: about 20 g protein for under 250 kcal.', 1, 'Greek yogurt, plain nonfat', 170, '1 container (6 oz)'),
    (1, 'Greek Yogurt Berry Bowl', null, 2, 'Blueberries', 74, '1/2 cup'),
    (1, 'Greek Yogurt Berry Bowl', null, 3, 'Almonds', 14, '1/2 oz (about 11 almonds)'),
    (1, 'Greek Yogurt Berry Bowl', null, 4, 'Honey', 7, '1 tsp'),

    (2, 'Banana Peanut Butter Oatmeal', 'Warm, filling breakfast. Oats cooked in milk, topped with banana and peanut butter.', 1, 'Oats, dry', 40, '1/2 cup dry'),
    (2, 'Banana Peanut Butter Oatmeal', null, 2, 'Milk, 2% reduced fat', 244, '1 cup'),
    (2, 'Banana Peanut Butter Oatmeal', null, 3, 'Banana', 118, '1 medium'),
    (2, 'Banana Peanut Butter Oatmeal', null, 4, 'Peanut butter', 16, '1 tbsp'),

    (3, 'Eggs & Avocado Toast', 'Two eggs on whole wheat toast with avocado and a handful of spinach.', 1, 'Egg, whole', 100, '2 large'),
    (3, 'Eggs & Avocado Toast', null, 2, 'Whole wheat bread', 64, '2 slices'),
    (3, 'Eggs & Avocado Toast', null, 3, 'Avocado', 50, '1/3 avocado'),
    (3, 'Eggs & Avocado Toast', null, 4, 'Spinach', 30, '1 cup'),

    (4, 'Chicken, Rice & Broccoli', 'The meal-prep classic: lean protein, a cup of rice and a cup of greens.', 1, 'Chicken breast, cooked', 113, '4 oz'),
    (4, 'Chicken, Rice & Broccoli', null, 2, 'White rice, cooked', 158, '1 cup'),
    (4, 'Chicken, Rice & Broccoli', null, 3, 'Broccoli', 91, '1 cup, chopped'),
    (4, 'Chicken, Rice & Broccoli', null, 4, 'Olive oil', 4.5, '1 tsp'),

    (5, 'Salmon, Sweet Potato & Asparagus', 'Omega-3-rich dinner with a baked sweet potato.', 1, 'Salmon, cooked', 113, '4 oz fillet'),
    (5, 'Salmon, Sweet Potato & Asparagus', null, 2, 'Sweet potato, baked', 114, '1 medium'),
    (5, 'Salmon, Sweet Potato & Asparagus', null, 3, 'Asparagus', 134, '1 cup'),
    (5, 'Salmon, Sweet Potato & Asparagus', null, 4, 'Olive oil', 4.5, '1 tsp'),

    (6, 'Tuna Salad Plate', 'A whole can of tuna over a simple salad with oil and balsamic.', 1, 'Tuna, canned in water', 165, '1 can, drained'),
    (6, 'Tuna Salad Plate', null, 2, 'Lettuce', 94, '2 cups, shredded'),
    (6, 'Tuna Salad Plate', null, 3, 'Tomato', 123, '1 medium'),
    (6, 'Tuna Salad Plate', null, 4, 'Cucumber', 52, '1/2 cup, sliced'),
    (6, 'Tuna Salad Plate', null, 5, 'Olive oil', 13.5, '1 tbsp'),
    (6, 'Tuna Salad Plate', null, 6, 'Balsamic vinegar', 16, '1 tbsp'),

    (7, 'Turkey Hummus Pita', 'Quick lunch: turkey, hummus and vegetables in a pita.', 1, 'Pita bread, white', 60, '1 large pita'),
    (7, 'Turkey Hummus Pita', null, 2, 'Turkey breast, cooked', 57, '2 oz'),
    (7, 'Turkey Hummus Pita', null, 3, 'Hummus', 30, '2 tbsp'),
    (7, 'Turkey Hummus Pita', null, 4, 'Spinach', 30, '1 cup'),
    (7, 'Turkey Hummus Pita', null, 5, 'Tomato', 62, '1/2 medium'),

    (8, 'Post-Workout Protein Shake', 'Whey, milk, banana and peanut butter blended together.', 1, 'Whey protein powder', 30, '1 scoop'),
    (8, 'Post-Workout Protein Shake', null, 2, 'Milk, skim', 245, '1 cup'),
    (8, 'Post-Workout Protein Shake', null, 3, 'Banana', 118, '1 medium'),
    (8, 'Post-Workout Protein Shake', null, 4, 'Peanut butter', 16, '1 tbsp'),

    (9, 'Cottage Cheese & Pineapple', 'A light, high-protein snack.', 1, 'Cottage cheese, low fat', 113, '1/2 cup'),
    (9, 'Cottage Cheese & Pineapple', null, 2, 'Pineapple', 82, '1/2 cup, chunks'),

    (10, 'Black Bean Quinoa Bowl', 'Vegetarian bowl with quinoa, beans, corn, salsa and avocado.', 1, 'Quinoa, cooked', 185, '1 cup'),
    (10, 'Black Bean Quinoa Bowl', null, 2, 'Black beans, cooked', 86, '1/2 cup'),
    (10, 'Black Bean Quinoa Bowl', null, 3, 'Corn', 82, '1/2 cup'),
    (10, 'Black Bean Quinoa Bowl', null, 4, 'Salsa', 32, '2 tbsp'),
    (10, 'Black Bean Quinoa Bowl', null, 5, 'Avocado', 50, '1/3 avocado'),

    (11, 'Tofu Veggie Stir-Fry', 'Vegan stir-fry over brown rice.', 1, 'Tofu, firm', 126, '1/2 cup'),
    (11, 'Tofu Veggie Stir-Fry', null, 2, 'Brown rice, cooked', 195, '1 cup'),
    (11, 'Tofu Veggie Stir-Fry', null, 3, 'Bell pepper', 149, '1 cup, chopped'),
    (11, 'Tofu Veggie Stir-Fry', null, 4, 'Broccoli', 91, '1 cup, chopped'),
    (11, 'Tofu Veggie Stir-Fry', null, 5, 'Soy sauce', 16, '1 tbsp'),
    (11, 'Tofu Veggie Stir-Fry', null, 6, 'Sesame oil', 4.5, '1 tsp'),

    (12, 'Turkey Bolognese Pasta', 'Pasta with lean ground turkey in marinara, finished with parmesan.', 1, 'Pasta, cooked', 140, '1 cup'),
    (12, 'Turkey Bolognese Pasta', null, 2, 'Turkey, ground, 93% lean, cooked', 85, '3 oz'),
    (12, 'Turkey Bolognese Pasta', null, 3, 'Marinara / pasta sauce', 125, '1/2 cup'),
    (12, 'Turkey Bolognese Pasta', null, 4, 'Parmesan cheese, hard', 5, '1 tbsp, grated');

  -- All-or-nothing: if any food is missing from the shared library, create none of them.
  select string_agg(distinct oi.food_name, ', ') into missing
    from official_items oi
   where not exists (select 1 from foods f where f.user_id is null and f.name = oi.food_name);
  if missing is not null then
    raise exception 'These foods are missing from the shared library: %', missing;
  end if;

  for rec in
    select preset, max(description) as description, min(preset_order) as preset_order
      from official_items group by preset order by min(preset_order)
  loop
    if not exists (select 1 from meal_presets where is_official and name = rec.preset) then
      -- clock_timestamp(), not now(): now() is the same for the whole transaction, and the
      -- Community tab lists official items in the order they were created.
      insert into meal_presets (user_id, name, description, is_shared, is_official, created_at)
      values (owner_id, rec.preset, rec.description, true, true, clock_timestamp())
      returning id into new_id;

      insert into meal_preset_items (preset_id, food_id, grams, serving_label)
      select new_id,
             (select f.id from foods f where f.user_id is null and f.name = oi.food_name order by f.created_at limit 1),
             oi.grams, oi.serving_label
        from official_items oi
       where oi.preset = rec.preset
       order by oi.item_order;
    end if;
  end loop;
end $$;
