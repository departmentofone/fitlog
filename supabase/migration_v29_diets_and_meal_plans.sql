-- FitLog schema v29: diets and meal plans. Needs v28 (Community). Safe to run more than once.
--
-- A DIET is a list of foods you eat on it (e.g. Keto, Mediterranean). Following one puts its
-- foods first in food search, with a toggle to show only them, and flags logged foods that
-- aren't on it. A diet can include sample meal plans that use only its foods.
-- A MEAL PLAN is one day of meals (breakfast, lunch, ... with amounts), or up to 7 of those
-- combined into a week. Using one fills in a day's log.
-- Both can be shared to Community and saved as copies, exactly like presets and recipes.

-- 1. Tables.
create table if not exists diets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  description text check (char_length(description) <= 1000),
  is_shared boolean not null default false,
  is_official boolean not null default false,
  source_id uuid references diets(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists diets_user_idx on diets (user_id);
create index if not exists diets_shared_idx on diets (is_shared) where is_shared;

-- `on delete restrict`, like every other table that points at a food: a food in use can't be
-- deleted out from under someone's diet (account deletion detaches it instead, see step 5).
create table if not exists diet_foods (
  diet_id uuid not null references diets(id) on delete cascade,
  food_id uuid not null references foods(id) on delete restrict,
  primary key (diet_id, food_id)
);
create index if not exists diet_foods_food_id_idx on diet_foods (food_id);

create table if not exists meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  description text check (char_length(description) <= 1000),
  days int not null default 1 check (days between 1 and 7),
  -- Set on a diet's sample plans; those are shared (and deleted) along with the diet.
  diet_id uuid references diets(id) on delete cascade,
  is_shared boolean not null default false,
  is_official boolean not null default false,
  source_id uuid references meal_plans(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists meal_plans_user_idx on meal_plans (user_id);
create index if not exists meal_plans_diet_idx on meal_plans (diet_id);
create index if not exists meal_plans_shared_idx on meal_plans (is_shared) where is_shared;

create table if not exists meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references meal_plans(id) on delete cascade,
  day_index int not null default 0 check (day_index between 0 and 6),
  meal_name text not null check (char_length(btrim(meal_name)) between 1 and 60),
  meal_order int not null default 0,
  item_order int not null default 0,
  food_id uuid not null references foods(id) on delete restrict,
  grams numeric not null check (grams > 0),
  serving_label text
);
create index if not exists meal_plan_items_plan_idx on meal_plan_items (plan_id);
create index if not exists meal_plan_items_food_id_idx on meal_plan_items (food_id);

-- The diet you're following (at most one). Cleared automatically if that diet is deleted.
alter table user_settings add column if not exists active_diet_id uuid references diets(id) on delete set null;

-- 2. Row-level security: same model as presets. You can read your own and anything shared (a
--    diet's sample plans count as shared when the diet is); you can only change your own.
alter table diets enable row level security;
drop policy if exists "read diets" on diets;
create policy "read diets" on diets for select using (auth.uid() = user_id or is_shared);
drop policy if exists "insert own diets" on diets;
create policy "insert own diets" on diets for insert with check (auth.uid() = user_id);
drop policy if exists "update own diets" on diets;
create policy "update own diets" on diets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "delete own diets" on diets;
create policy "delete own diets" on diets for delete using (auth.uid() = user_id);

alter table diet_foods enable row level security;
drop policy if exists "read diet foods" on diet_foods;
create policy "read diet foods" on diet_foods for select
  using (exists (select 1 from diets d where d.id = diet_id and (d.user_id = auth.uid() or d.is_shared)));
drop policy if exists "manage own diet foods" on diet_foods;
create policy "manage own diet foods" on diet_foods for insert
  with check (exists (select 1 from diets d where d.id = diet_id and d.user_id = auth.uid()));
drop policy if exists "delete own diet foods" on diet_foods;
create policy "delete own diet foods" on diet_foods for delete
  using (exists (select 1 from diets d where d.id = diet_id and d.user_id = auth.uid()));

alter table meal_plans enable row level security;
drop policy if exists "read meal plans" on meal_plans;
create policy "read meal plans" on meal_plans for select
  using (auth.uid() = user_id or is_shared or exists (select 1 from diets d where d.id = diet_id and d.is_shared));
drop policy if exists "insert own meal plans" on meal_plans;
create policy "insert own meal plans" on meal_plans for insert with check (auth.uid() = user_id);
drop policy if exists "update own meal plans" on meal_plans;
create policy "update own meal plans" on meal_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "delete own meal plans" on meal_plans;
create policy "delete own meal plans" on meal_plans for delete using (auth.uid() = user_id);

alter table meal_plan_items enable row level security;
drop policy if exists "read meal plan items" on meal_plan_items;
create policy "read meal plan items" on meal_plan_items for select
  using (exists (
    select 1 from meal_plans p
     where p.id = plan_id
       and (p.user_id = auth.uid() or p.is_shared or exists (select 1 from diets d where d.id = p.diet_id and d.is_shared))
  ));
drop policy if exists "insert own meal plan items" on meal_plan_items;
create policy "insert own meal plan items" on meal_plan_items for insert
  with check (exists (select 1 from meal_plans p where p.id = plan_id and p.user_id = auth.uid()));
drop policy if exists "update own meal plan items" on meal_plan_items;
create policy "update own meal plan items" on meal_plan_items for update
  using (exists (select 1 from meal_plans p where p.id = plan_id and p.user_id = auth.uid()));
drop policy if exists "delete own meal plan items" on meal_plan_items;
create policy "delete own meal plan items" on meal_plan_items for delete
  using (exists (select 1 from meal_plans p where p.id = plan_id and p.user_id = auth.uid()));

-- Foods inside shared diets and meal plans must be readable too, or they'd show as
-- "Unavailable food" to everyone else (same reason as migration_v20). Recreated with the
-- original preset/recipe clauses plus the new ones.
drop policy if exists "read foods in shared content" on foods;
create policy "read foods in shared content" on foods
  for select
  using (
    exists (select 1 from meal_preset_items pi join meal_presets p on p.id = pi.preset_id
             where pi.food_id = foods.id and p.is_shared)
    or exists (select 1 from recipe_ingredients ri join recipes r on r.id = ri.recipe_id
                where ri.food_id = foods.id and r.is_shared)
    or exists (select 1 from diet_foods df join diets d on d.id = df.diet_id
                where df.food_id = foods.id and d.is_shared)
    or exists (select 1 from meal_plan_items mi join meal_plans p on p.id = mi.plan_id
                where mi.food_id = foods.id
                  and (p.is_shared or exists (select 1 from diets d where d.id = p.diet_id and d.is_shared)))
  );

-- 3. Only FitLog (the SQL editor) can mark something official - same guard as v28.
drop trigger if exists guard_is_official on diets;
create trigger guard_is_official before insert or update on diets for each row execute function public.guard_is_official();
drop trigger if exists guard_is_official on meal_plans;
create trigger guard_is_official before insert or update on meal_plans for each row execute function public.guard_is_official();

-- 4. Diets and meal plans can be reported from Community too.
alter table community_reports drop constraint if exists community_reports_item_type_check;
alter table community_reports add constraint community_reports_item_type_check
  check (item_type in ('meal_preset', 'recipe', 'workout_preset', 'program', 'meal_plan', 'diet'));

-- 5. Account deletion: someone else's diet or meal plan may point at one of your custom foods.
--    Like the other cases in v19, that food is moved to the shared library instead of blocking
--    the deletion (meal_plan_items restricts) or silently emptying their diet.
create or replace function public.prepare_account_deletion(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update foods f
     set user_id = null
   where f.user_id = target
     and (
       exists (select 1 from meal_items mi join meals m on m.id = mi.meal_id
                where mi.food_id = f.id and m.user_id <> target)
       or exists (select 1 from recipe_ingredients ri join recipes r on r.id = ri.recipe_id
                   where ri.food_id = f.id and r.user_id <> target)
       or exists (select 1 from meal_preset_items pi join meal_presets p on p.id = pi.preset_id
                   where pi.food_id = f.id and p.user_id <> target)
       or exists (select 1 from diet_foods df join diets d on d.id = df.diet_id
                   where df.food_id = f.id and d.user_id <> target)
       or exists (select 1 from meal_plan_items mi join meal_plans p on p.id = mi.plan_id
                   where mi.food_id = f.id and p.user_id <> target)
     );

  update exercises e
     set user_id = null
   where e.user_id = target
     and (
       exists (select 1 from workout_sets ws join workout_sessions s on s.id = ws.session_id
                where ws.exercise_id = e.id and s.user_id <> target)
       or exists (select 1 from workout_preset_items wi join workout_presets p on p.id = wi.preset_id
                   where wi.exercise_id = e.id and p.user_id <> target)
       or exists (select 1 from exercise_notes n
                   where n.exercise_id = e.id and n.user_id <> target)
       or exists (select 1 from goals g
                   where g.target_exercise_id = e.id and g.user_id <> target)
     );

  delete from error_logs where user_id = target;
end;
$$;
revoke all on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;

-- 6. Google Play's user-generated content rules, now that Community shares things between users:
--    people agree to community guidelines before sharing, can hide everything from a person, and
--    the owner can take items down. (Reporting already exists: community_reports, v28.)
alter table user_settings add column if not exists community_guidelines_accepted_at timestamptz;
alter table user_settings add column if not exists hidden_community_users uuid[] not null default '{}';

-- The owner (and only the owner) can remove any item from Community. It stays in its creator's
-- account, just no longer shared, and its reports are cleared.
create or replace function public.moderate_community_item(p_type text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_site_owner() then
    raise exception 'Not allowed';
  end if;
  if p_type = 'meal_preset' then update meal_presets set is_shared = false where id = p_id;
  elsif p_type = 'recipe' then update recipes set is_shared = false where id = p_id;
  elsif p_type = 'workout_preset' then update workout_presets set is_shared = false where id = p_id;
  elsif p_type = 'program' then update programs set is_shared = false where id = p_id;
  elsif p_type = 'meal_plan' then update meal_plans set is_shared = false where id = p_id;
  elsif p_type = 'diet' then update diets set is_shared = false where id = p_id;
  else raise exception 'Unknown item type %', p_type;
  end if;
  delete from community_reports where item_type = p_type and item_id = p_id;
end;
$$;
revoke all on function public.moderate_community_item(text, uuid) from public, anon;
grant execute on function public.moderate_community_item(text, uuid) to authenticated;

-- 7. Official diets, each with one sample day built only from its own foods. Food lists follow the
--    source named in each description, applied category by category across the whole shared
--    library (e.g. Keto: meat, fish, eggs, full-fat dairy, non-starchy vegetables, nuts, oils); portions in the sample days are standard household
--    measures with gram weights from USDA FoodData Central (e.g. 1 cup cooked lentils = 198 g,
--    1 large egg = 50 g), plus 1/3 avocado = 50 g and 1 tbsp chia = 12 g from product labels.
--    All-or-nothing: if any food is missing from the shared library, nothing here is created.
do $$
declare
  owner_id uuid;
  missing text;
  rec record;
  rec2 record;
  new_diet uuid;
  new_plan uuid;
begin
  select id into owner_id from auth.users where email = 'msolarovsocial@gmail.com';
  if owner_id is null then
    raise exception 'Owner account not found - nothing created';
  end if;

  create temp table od (sort int, name text, description text) on commit drop;
  insert into od values
    (1, 'Mediterranean', 'Based on the Oldways Mediterranean Diet Pyramid: vegetables, fruit, whole grains, legumes, nuts and olive oil every day; fish and seafood at least twice a week; poultry, eggs, cheese and yogurt in moderation; red meat and sweets rarely.'),
    (2, 'DASH', 'The NIH DASH eating plan (Dietary Approaches to Stop Hypertension): vegetables, fruit and whole grains; fat-free or low-fat dairy; fish, poultry, beans, nuts and vegetable oils. It limits saturated fat, added sugar and sodium.'),
    (3, 'Keto', 'Very low-carb, high-fat eating, usually 20-50 g of carbs a day: meat, fish, eggs, full-fat dairy, non-starchy vegetables, nuts, seeds and oils. Talk to a doctor before starting, especially if you take medication.'),
    (4, 'Plant-based (vegan)', 'No animal products: legumes, tofu and tempeh, whole grains, vegetables, fruit, nuts and seeds. Plan for vitamin B12, which plant foods don''t reliably provide.');

  create temp table odf (diet text, food_name text) on commit drop;
  insert into odf values
    ('Mediterranean', 'Arugula'),
    ('Mediterranean', 'Asparagus'),
    ('Mediterranean', 'Bean sprouts'),
    ('Mediterranean', 'Bell pepper'),
    ('Mediterranean', 'Bok choy'),
    ('Mediterranean', 'Broccoli'),
    ('Mediterranean', 'Brussels sprouts'),
    ('Mediterranean', 'Cabbage'),
    ('Mediterranean', 'Red cabbage'),
    ('Mediterranean', 'Napa cabbage'),
    ('Mediterranean', 'Cauliflower'),
    ('Mediterranean', 'Celery'),
    ('Mediterranean', 'Chili pepper, red/green'),
    ('Mediterranean', 'Chives, raw'),
    ('Mediterranean', 'Collard greens'),
    ('Mediterranean', 'Cucumber'),
    ('Mediterranean', 'Daikon radish'),
    ('Mediterranean', 'Eggplant'),
    ('Mediterranean', 'Endive, raw'),
    ('Mediterranean', 'Fennel bulb'),
    ('Mediterranean', 'Garlic'),
    ('Mediterranean', 'Green beans'),
    ('Mediterranean', 'Jalapeño pepper'),
    ('Mediterranean', 'Kale'),
    ('Mediterranean', 'Kohlrabi, raw'),
    ('Mediterranean', 'Lettuce'),
    ('Mediterranean', 'Mushroom'),
    ('Mediterranean', 'Okra'),
    ('Mediterranean', 'Radish'),
    ('Mediterranean', 'Scallion / green onion'),
    ('Mediterranean', 'Spinach'),
    ('Mediterranean', 'Swiss chard'),
    ('Mediterranean', 'Tomato'),
    ('Mediterranean', 'Watercress'),
    ('Mediterranean', 'Zucchini'),
    ('Mediterranean', 'Artichoke, cooked'),
    ('Mediterranean', 'Beet'),
    ('Mediterranean', 'Butternut squash, cooked'),
    ('Mediterranean', 'Carrot'),
    ('Mediterranean', 'Corn'),
    ('Mediterranean', 'Green peas'),
    ('Mediterranean', 'Jicama, raw'),
    ('Mediterranean', 'Leek'),
    ('Mediterranean', 'Onion'),
    ('Mediterranean', 'Parsnip'),
    ('Mediterranean', 'Pumpkin'),
    ('Mediterranean', 'Rutabaga, cooked'),
    ('Mediterranean', 'Shallot, raw'),
    ('Mediterranean', 'Snap peas / snow peas'),
    ('Mediterranean', 'Sweet potato, baked'),
    ('Mediterranean', 'Sweet potato, raw'),
    ('Mediterranean', 'Turnip'),
    ('Mediterranean', 'Ginger, raw'),
    ('Mediterranean', 'Sun-dried tomatoes'),
    ('Mediterranean', 'Water chestnuts, canned'),
    ('Mediterranean', 'Potato, baked'),
    ('Mediterranean', 'Potato, boiled'),
    ('Mediterranean', 'Apple'),
    ('Mediterranean', 'Apricot'),
    ('Mediterranean', 'Banana'),
    ('Mediterranean', 'Blackberries'),
    ('Mediterranean', 'Blueberries'),
    ('Mediterranean', 'Cantaloupe / melon'),
    ('Mediterranean', 'Cherries'),
    ('Mediterranean', 'Clementine'),
    ('Mediterranean', 'Cranberries, raw'),
    ('Mediterranean', 'Currants, raw'),
    ('Mediterranean', 'Dragon fruit (pitaya)'),
    ('Mediterranean', 'Fig, fresh'),
    ('Mediterranean', 'Grapefruit'),
    ('Mediterranean', 'Grapes'),
    ('Mediterranean', 'Guava'),
    ('Mediterranean', 'Honeydew melon'),
    ('Mediterranean', 'Jackfruit, raw'),
    ('Mediterranean', 'Kiwi'),
    ('Mediterranean', 'Kumquat'),
    ('Mediterranean', 'Lemon'),
    ('Mediterranean', 'Lime'),
    ('Mediterranean', 'Lychee'),
    ('Mediterranean', 'Mango'),
    ('Mediterranean', 'Mulberries, raw'),
    ('Mediterranean', 'Nectarine'),
    ('Mediterranean', 'Orange'),
    ('Mediterranean', 'Papaya'),
    ('Mediterranean', 'Passion fruit'),
    ('Mediterranean', 'Peach'),
    ('Mediterranean', 'Pear'),
    ('Mediterranean', 'Persimmon'),
    ('Mediterranean', 'Pineapple'),
    ('Mediterranean', 'Plum'),
    ('Mediterranean', 'Pomegranate (arils)'),
    ('Mediterranean', 'Raspberries'),
    ('Mediterranean', 'Rhubarb, raw'),
    ('Mediterranean', 'Star fruit (carambola)'),
    ('Mediterranean', 'Strawberries'),
    ('Mediterranean', 'Tangerine / mandarin'),
    ('Mediterranean', 'Watermelon'),
    ('Mediterranean', 'Avocado'),
    ('Mediterranean', 'Coconut, fresh meat'),
    ('Mediterranean', 'Dates, dried (Medjool)'),
    ('Mediterranean', 'Dried apricots'),
    ('Mediterranean', 'Dried figs'),
    ('Mediterranean', 'Prunes (dried plums)'),
    ('Mediterranean', 'Raisins'),
    ('Mediterranean', 'Barley, cooked (pearled)'),
    ('Mediterranean', 'Brown rice, cooked'),
    ('Mediterranean', 'Brown rice, raw'),
    ('Mediterranean', 'Buckwheat groats, cooked'),
    ('Mediterranean', 'Bulgur, cooked'),
    ('Mediterranean', 'Farro, cooked'),
    ('Mediterranean', 'Oats, cooked (oatmeal, water)'),
    ('Mediterranean', 'Oats, dry'),
    ('Mediterranean', 'Quinoa, cooked'),
    ('Mediterranean', 'Quinoa, raw'),
    ('Mediterranean', 'Steel-cut oats, dry'),
    ('Mediterranean', 'Whole wheat bread'),
    ('Mediterranean', 'Whole wheat pasta, cooked'),
    ('Mediterranean', 'Wild rice, cooked'),
    ('Mediterranean', 'Bread, multigrain'),
    ('Mediterranean', 'Bread, rye'),
    ('Mediterranean', 'Couscous, cooked'),
    ('Mediterranean', 'Pita bread, white'),
    ('Mediterranean', 'Bread, sourdough'),
    ('Mediterranean', 'Polenta / cornmeal mush, cooked'),
    ('Mediterranean', 'Black beans, cooked'),
    ('Mediterranean', 'Black-eyed peas, cooked'),
    ('Mediterranean', 'Chickpeas, cooked'),
    ('Mediterranean', 'Edamame, cooked'),
    ('Mediterranean', 'Hummus'),
    ('Mediterranean', 'Kidney beans, cooked'),
    ('Mediterranean', 'Lentils, cooked'),
    ('Mediterranean', 'Lima beans, cooked'),
    ('Mediterranean', 'Navy beans, cooked'),
    ('Mediterranean', 'Pinto beans, cooked'),
    ('Mediterranean', 'Soybeans, cooked'),
    ('Mediterranean', 'Split peas, cooked'),
    ('Mediterranean', 'Almonds'),
    ('Mediterranean', 'Brazil nuts'),
    ('Mediterranean', 'Cashews'),
    ('Mediterranean', 'Hazelnuts'),
    ('Mediterranean', 'Macadamia nuts'),
    ('Mediterranean', 'Pecans'),
    ('Mediterranean', 'Pine nuts'),
    ('Mediterranean', 'Pistachios'),
    ('Mediterranean', 'Walnuts'),
    ('Mediterranean', 'Mixed nuts, roasted'),
    ('Mediterranean', 'Peanuts, raw'),
    ('Mediterranean', 'Chia seeds'),
    ('Mediterranean', 'Flaxseed, ground'),
    ('Mediterranean', 'Hemp seeds'),
    ('Mediterranean', 'Pumpkin seeds (pepitas)'),
    ('Mediterranean', 'Sesame seeds'),
    ('Mediterranean', 'Sunflower seeds'),
    ('Mediterranean', 'Almond butter'),
    ('Mediterranean', 'Peanut butter'),
    ('Mediterranean', 'Tahini'),
    ('Mediterranean', 'Anchovies, canned in oil, drained'),
    ('Mediterranean', 'Cod, cooked'),
    ('Mediterranean', 'Crab meat, cooked'),
    ('Mediterranean', 'Halibut, cooked'),
    ('Mediterranean', 'Mussels, cooked'),
    ('Mediterranean', 'Salmon, cooked'),
    ('Mediterranean', 'Scallops, cooked'),
    ('Mediterranean', 'Shrimp, cooked'),
    ('Mediterranean', 'Shrimp, raw'),
    ('Mediterranean', 'Tilapia, cooked'),
    ('Mediterranean', 'Trout, cooked'),
    ('Mediterranean', 'Tuna, canned in water'),
    ('Mediterranean', 'Chicken breast, cooked'),
    ('Mediterranean', 'Chicken breast, raw (skinless, boneless)'),
    ('Mediterranean', 'Chicken drumstick, cooked'),
    ('Mediterranean', 'Chicken thigh, cooked'),
    ('Mediterranean', 'Chicken thigh, raw (skinless, boneless)'),
    ('Mediterranean', 'Chicken wing, cooked'),
    ('Mediterranean', 'Ground chicken, cooked'),
    ('Mediterranean', 'Turkey breast, cooked'),
    ('Mediterranean', 'Turkey, ground, 93% lean, cooked'),
    ('Mediterranean', 'Turkey, ground, 99% lean, cooked'),
    ('Mediterranean', 'Duck breast, cooked (skinless)'),
    ('Mediterranean', 'Rotisserie chicken, dark meat (with skin)'),
    ('Mediterranean', 'Egg, whole'),
    ('Mediterranean', 'Egg white'),
    ('Mediterranean', 'Egg yolk'),
    ('Mediterranean', 'Duck egg'),
    ('Mediterranean', 'Quail egg'),
    ('Mediterranean', 'Feta cheese'),
    ('Mediterranean', 'Halloumi cheese'),
    ('Mediterranean', 'Parmesan cheese, hard'),
    ('Mediterranean', 'Goat cheese, soft'),
    ('Mediterranean', 'Mozzarella, part-skim'),
    ('Mediterranean', 'Ricotta cheese, part-skim'),
    ('Mediterranean', 'Labneh'),
    ('Mediterranean', 'Manchego cheese'),
    ('Mediterranean', 'Greek yogurt, plain nonfat'),
    ('Mediterranean', 'Greek yogurt, plain whole milk'),
    ('Mediterranean', 'Yogurt, plain, low fat'),
    ('Mediterranean', 'Yogurt, plain, whole milk'),
    ('Mediterranean', 'Kefir, plain, low fat'),
    ('Mediterranean', 'Olive oil'),
    ('Mediterranean', 'Olives, green'),
    ('Mediterranean', 'Olives, black'),
    ('Mediterranean', 'Balsamic vinegar'),
    ('Mediterranean', 'Apple cider vinegar'),
    ('Mediterranean', 'Pesto sauce, basil'),
    ('Mediterranean', 'Tzatziki'),
    ('Mediterranean', 'Honey'),
    ('DASH', 'Arugula'),
    ('DASH', 'Asparagus'),
    ('DASH', 'Bean sprouts'),
    ('DASH', 'Bell pepper'),
    ('DASH', 'Bok choy'),
    ('DASH', 'Broccoli'),
    ('DASH', 'Brussels sprouts'),
    ('DASH', 'Cabbage'),
    ('DASH', 'Red cabbage'),
    ('DASH', 'Napa cabbage'),
    ('DASH', 'Cauliflower'),
    ('DASH', 'Celery'),
    ('DASH', 'Chili pepper, red/green'),
    ('DASH', 'Chives, raw'),
    ('DASH', 'Collard greens'),
    ('DASH', 'Cucumber'),
    ('DASH', 'Daikon radish'),
    ('DASH', 'Eggplant'),
    ('DASH', 'Endive, raw'),
    ('DASH', 'Fennel bulb'),
    ('DASH', 'Garlic'),
    ('DASH', 'Green beans'),
    ('DASH', 'Jalapeño pepper'),
    ('DASH', 'Kale'),
    ('DASH', 'Kohlrabi, raw'),
    ('DASH', 'Lettuce'),
    ('DASH', 'Mushroom'),
    ('DASH', 'Okra'),
    ('DASH', 'Radish'),
    ('DASH', 'Scallion / green onion'),
    ('DASH', 'Spinach'),
    ('DASH', 'Swiss chard'),
    ('DASH', 'Tomato'),
    ('DASH', 'Watercress'),
    ('DASH', 'Zucchini'),
    ('DASH', 'Artichoke, cooked'),
    ('DASH', 'Beet'),
    ('DASH', 'Butternut squash, cooked'),
    ('DASH', 'Carrot'),
    ('DASH', 'Corn'),
    ('DASH', 'Green peas'),
    ('DASH', 'Jicama, raw'),
    ('DASH', 'Leek'),
    ('DASH', 'Onion'),
    ('DASH', 'Parsnip'),
    ('DASH', 'Pumpkin'),
    ('DASH', 'Rutabaga, cooked'),
    ('DASH', 'Shallot, raw'),
    ('DASH', 'Snap peas / snow peas'),
    ('DASH', 'Sweet potato, baked'),
    ('DASH', 'Sweet potato, raw'),
    ('DASH', 'Turnip'),
    ('DASH', 'Ginger, raw'),
    ('DASH', 'Sun-dried tomatoes'),
    ('DASH', 'Water chestnuts, canned'),
    ('DASH', 'Potato, baked'),
    ('DASH', 'Potato, boiled'),
    ('DASH', 'Apple'),
    ('DASH', 'Apricot'),
    ('DASH', 'Banana'),
    ('DASH', 'Blackberries'),
    ('DASH', 'Blueberries'),
    ('DASH', 'Cantaloupe / melon'),
    ('DASH', 'Cherries'),
    ('DASH', 'Clementine'),
    ('DASH', 'Cranberries, raw'),
    ('DASH', 'Currants, raw'),
    ('DASH', 'Dragon fruit (pitaya)'),
    ('DASH', 'Fig, fresh'),
    ('DASH', 'Grapefruit'),
    ('DASH', 'Grapes'),
    ('DASH', 'Guava'),
    ('DASH', 'Honeydew melon'),
    ('DASH', 'Jackfruit, raw'),
    ('DASH', 'Kiwi'),
    ('DASH', 'Kumquat'),
    ('DASH', 'Lemon'),
    ('DASH', 'Lime'),
    ('DASH', 'Lychee'),
    ('DASH', 'Mango'),
    ('DASH', 'Mulberries, raw'),
    ('DASH', 'Nectarine'),
    ('DASH', 'Orange'),
    ('DASH', 'Papaya'),
    ('DASH', 'Passion fruit'),
    ('DASH', 'Peach'),
    ('DASH', 'Pear'),
    ('DASH', 'Persimmon'),
    ('DASH', 'Pineapple'),
    ('DASH', 'Plum'),
    ('DASH', 'Pomegranate (arils)'),
    ('DASH', 'Raspberries'),
    ('DASH', 'Rhubarb, raw'),
    ('DASH', 'Star fruit (carambola)'),
    ('DASH', 'Strawberries'),
    ('DASH', 'Tangerine / mandarin'),
    ('DASH', 'Watermelon'),
    ('DASH', 'Avocado'),
    ('DASH', 'Coconut, fresh meat'),
    ('DASH', 'Dates, dried (Medjool)'),
    ('DASH', 'Dried apricots'),
    ('DASH', 'Dried figs'),
    ('DASH', 'Prunes (dried plums)'),
    ('DASH', 'Raisins'),
    ('DASH', 'Barley, cooked (pearled)'),
    ('DASH', 'Brown rice, cooked'),
    ('DASH', 'Brown rice, raw'),
    ('DASH', 'Buckwheat groats, cooked'),
    ('DASH', 'Bulgur, cooked'),
    ('DASH', 'Farro, cooked'),
    ('DASH', 'Oats, cooked (oatmeal, water)'),
    ('DASH', 'Oats, dry'),
    ('DASH', 'Quinoa, cooked'),
    ('DASH', 'Quinoa, raw'),
    ('DASH', 'Steel-cut oats, dry'),
    ('DASH', 'Whole wheat bread'),
    ('DASH', 'Whole wheat pasta, cooked'),
    ('DASH', 'Wild rice, cooked'),
    ('DASH', 'Bread, multigrain'),
    ('DASH', 'Bread, rye'),
    ('DASH', 'Black beans, cooked'),
    ('DASH', 'Black-eyed peas, cooked'),
    ('DASH', 'Chickpeas, cooked'),
    ('DASH', 'Edamame, cooked'),
    ('DASH', 'Hummus'),
    ('DASH', 'Kidney beans, cooked'),
    ('DASH', 'Lentils, cooked'),
    ('DASH', 'Lima beans, cooked'),
    ('DASH', 'Navy beans, cooked'),
    ('DASH', 'Pinto beans, cooked'),
    ('DASH', 'Soybeans, cooked'),
    ('DASH', 'Split peas, cooked'),
    ('DASH', 'Tofu, firm'),
    ('DASH', 'Tempeh'),
    ('DASH', 'Soy milk, unsweetened'),
    ('DASH', 'Almonds'),
    ('DASH', 'Hazelnuts'),
    ('DASH', 'Pecans'),
    ('DASH', 'Pistachios'),
    ('DASH', 'Walnuts'),
    ('DASH', 'Peanuts, raw'),
    ('DASH', 'Chia seeds'),
    ('DASH', 'Flaxseed, ground'),
    ('DASH', 'Pumpkin seeds (pepitas)'),
    ('DASH', 'Sunflower seeds'),
    ('DASH', 'Almond butter'),
    ('DASH', 'Peanut butter'),
    ('DASH', 'Cod, cooked'),
    ('DASH', 'Halibut, cooked'),
    ('DASH', 'Salmon, cooked'),
    ('DASH', 'Scallops, cooked'),
    ('DASH', 'Shrimp, cooked'),
    ('DASH', 'Tilapia, cooked'),
    ('DASH', 'Trout, cooked'),
    ('DASH', 'Tuna, canned in water'),
    ('DASH', 'Crab meat, cooked'),
    ('DASH', 'Chicken breast, cooked'),
    ('DASH', 'Chicken breast, raw (skinless, boneless)'),
    ('DASH', 'Turkey breast, cooked'),
    ('DASH', 'Turkey, ground, 93% lean, cooked'),
    ('DASH', 'Turkey, ground, 99% lean, cooked'),
    ('DASH', 'Pork tenderloin, cooked'),
    ('DASH', 'Egg white'),
    ('DASH', 'Egg, whole'),
    ('DASH', 'Milk, skim'),
    ('DASH', 'Milk, 1% low fat'),
    ('DASH', 'Yogurt, plain, low fat'),
    ('DASH', 'Greek yogurt, plain nonfat'),
    ('DASH', 'Cottage cheese, low fat'),
    ('DASH', 'Kefir, plain, low fat'),
    ('DASH', 'Buttermilk, low fat'),
    ('DASH', 'Ricotta cheese, part-skim'),
    ('DASH', 'Mozzarella, part-skim'),
    ('DASH', 'Olive oil'),
    ('DASH', 'Canola oil'),
    ('DASH', 'Avocado oil'),
    ('DASH', 'Sunflower oil'),
    ('DASH', 'Vegetable oil (soybean/canola blend)'),
    ('DASH', 'Balsamic vinegar'),
    ('DASH', 'Apple cider vinegar'),
    ('Keto', 'Arugula'),
    ('Keto', 'Asparagus'),
    ('Keto', 'Bean sprouts'),
    ('Keto', 'Bell pepper'),
    ('Keto', 'Bok choy'),
    ('Keto', 'Broccoli'),
    ('Keto', 'Brussels sprouts'),
    ('Keto', 'Cabbage'),
    ('Keto', 'Red cabbage'),
    ('Keto', 'Napa cabbage'),
    ('Keto', 'Cauliflower'),
    ('Keto', 'Celery'),
    ('Keto', 'Chili pepper, red/green'),
    ('Keto', 'Chives, raw'),
    ('Keto', 'Collard greens'),
    ('Keto', 'Cucumber'),
    ('Keto', 'Daikon radish'),
    ('Keto', 'Eggplant'),
    ('Keto', 'Endive, raw'),
    ('Keto', 'Fennel bulb'),
    ('Keto', 'Garlic'),
    ('Keto', 'Green beans'),
    ('Keto', 'Jalapeño pepper'),
    ('Keto', 'Kale'),
    ('Keto', 'Kohlrabi, raw'),
    ('Keto', 'Lettuce'),
    ('Keto', 'Mushroom'),
    ('Keto', 'Okra'),
    ('Keto', 'Radish'),
    ('Keto', 'Scallion / green onion'),
    ('Keto', 'Spinach'),
    ('Keto', 'Swiss chard'),
    ('Keto', 'Tomato'),
    ('Keto', 'Watercress'),
    ('Keto', 'Zucchini'),
    ('Keto', 'Avocado'),
    ('Keto', 'Olives, green'),
    ('Keto', 'Olives, black'),
    ('Keto', 'Pickles, dill'),
    ('Keto', 'Raspberries'),
    ('Keto', 'Blackberries'),
    ('Keto', 'Strawberries'),
    ('Keto', 'Lemon'),
    ('Keto', 'Lime'),
    ('Keto', 'Coconut, fresh meat'),
    ('Keto', 'Coconut, shredded, unsweetened'),
    ('Keto', 'Anchovies, canned in oil, drained'),
    ('Keto', 'Cod, cooked'),
    ('Keto', 'Crab meat, cooked'),
    ('Keto', 'Halibut, cooked'),
    ('Keto', 'Mussels, cooked'),
    ('Keto', 'Salmon, cooked'),
    ('Keto', 'Scallops, cooked'),
    ('Keto', 'Shrimp, cooked'),
    ('Keto', 'Shrimp, raw'),
    ('Keto', 'Tilapia, cooked'),
    ('Keto', 'Trout, cooked'),
    ('Keto', 'Tuna, canned in water'),
    ('Keto', 'Chicken breast, cooked'),
    ('Keto', 'Chicken breast, raw (skinless, boneless)'),
    ('Keto', 'Chicken drumstick, cooked'),
    ('Keto', 'Chicken thigh, cooked'),
    ('Keto', 'Chicken thigh, raw (skinless, boneless)'),
    ('Keto', 'Chicken wing, cooked'),
    ('Keto', 'Ground chicken, cooked'),
    ('Keto', 'Turkey breast, cooked'),
    ('Keto', 'Turkey, ground, 93% lean, cooked'),
    ('Keto', 'Turkey, ground, 99% lean, cooked'),
    ('Keto', 'Duck breast, cooked (skinless)'),
    ('Keto', 'Rotisserie chicken, dark meat (with skin)'),
    ('Keto', 'Beef brisket, cooked'),
    ('Keto', 'Beef flank steak, cooked'),
    ('Keto', 'Beef liver, cooked'),
    ('Keto', 'Beef ribeye steak, cooked'),
    ('Keto', 'Beef short ribs, cooked'),
    ('Keto', 'Beef sirloin steak, cooked'),
    ('Keto', 'Beef tenderloin (filet mignon), cooked'),
    ('Keto', 'Ground beef 85/15, cooked'),
    ('Keto', 'Ground beef 93/7, cooked'),
    ('Keto', 'Ground beef, 85% lean, raw'),
    ('Keto', 'Ground pork, cooked'),
    ('Keto', 'Lamb chop, cooked'),
    ('Keto', 'Lamb, ground, cooked'),
    ('Keto', 'Pork belly, cooked'),
    ('Keto', 'Pork chop, cooked (bone-in)'),
    ('Keto', 'Pork loin, cooked'),
    ('Keto', 'Pork tenderloin, cooked'),
    ('Keto', 'Rabbit, cooked'),
    ('Keto', 'Veal cutlet, cooked'),
    ('Keto', 'Venison, cooked'),
    ('Keto', 'Chicken liver, cooked'),
    ('Keto', 'Bacon, pan-fried'),
    ('Keto', 'Bologna'),
    ('Keto', 'Breakfast sausage links, cooked'),
    ('Keto', 'Canadian bacon'),
    ('Keto', 'Chorizo, cooked'),
    ('Keto', 'Corned beef, cooked'),
    ('Keto', 'Ham, deli slices (cooked)'),
    ('Keto', 'Hot dog / frankfurter'),
    ('Keto', 'Pastrami'),
    ('Keto', 'Pepperoni'),
    ('Keto', 'Pork sausage, cooked'),
    ('Keto', 'Prosciutto / dry-cured ham'),
    ('Keto', 'Salami'),
    ('Keto', 'Egg, whole'),
    ('Keto', 'Egg white'),
    ('Keto', 'Egg yolk'),
    ('Keto', 'Duck egg'),
    ('Keto', 'Quail egg'),
    ('Keto', 'Blue cheese'),
    ('Keto', 'Brie cheese'),
    ('Keto', 'Burrata cheese'),
    ('Keto', 'Camembert cheese'),
    ('Keto', 'Cheddar cheese'),
    ('Keto', 'Colby cheese'),
    ('Keto', 'Feta cheese'),
    ('Keto', 'Goat cheese, soft'),
    ('Keto', 'Gruyère cheese'),
    ('Keto', 'Halloumi cheese'),
    ('Keto', 'Manchego cheese'),
    ('Keto', 'Monterey Jack cheese'),
    ('Keto', 'Mozzarella, part-skim'),
    ('Keto', 'Paneer'),
    ('Keto', 'Parmesan cheese, hard'),
    ('Keto', 'Provolone cheese'),
    ('Keto', 'Queso fresco'),
    ('Keto', 'Ricotta cheese, whole milk'),
    ('Keto', 'String cheese / mozzarella stick'),
    ('Keto', 'Swiss cheese'),
    ('Keto', 'Cream cheese'),
    ('Keto', 'Cottage cheese, full fat (4%)'),
    ('Keto', 'Labneh'),
    ('Keto', 'Butter'),
    ('Keto', 'Ghee (clarified butter)'),
    ('Keto', 'Lard'),
    ('Keto', 'Heavy cream'),
    ('Keto', 'Half and half'),
    ('Keto', 'Sour cream, full fat'),
    ('Keto', 'Greek yogurt, plain whole milk'),
    ('Keto', 'Mayonnaise'),
    ('Keto', 'Olive oil'),
    ('Keto', 'Avocado oil'),
    ('Keto', 'Coconut oil'),
    ('Keto', 'Sesame oil'),
    ('Keto', 'Coconut milk, canned (full fat)'),
    ('Keto', 'Almond milk, unsweetened'),
    ('Keto', 'Soy milk, unsweetened'),
    ('Keto', 'Almonds'),
    ('Keto', 'Brazil nuts'),
    ('Keto', 'Hazelnuts'),
    ('Keto', 'Macadamia nuts'),
    ('Keto', 'Pecans'),
    ('Keto', 'Pine nuts'),
    ('Keto', 'Walnuts'),
    ('Keto', 'Chia seeds'),
    ('Keto', 'Flaxseed, ground'),
    ('Keto', 'Hemp seeds'),
    ('Keto', 'Pumpkin seeds (pepitas)'),
    ('Keto', 'Sesame seeds'),
    ('Keto', 'Sunflower seeds'),
    ('Keto', 'Almond butter'),
    ('Keto', 'Peanut butter'),
    ('Keto', 'Tahini'),
    ('Keto', 'Dijon mustard'),
    ('Keto', 'Yellow mustard'),
    ('Keto', 'Hot sauce (cayenne pepper, Tabasco-style)'),
    ('Keto', 'Soy sauce'),
    ('Keto', 'Apple cider vinegar'),
    ('Keto', 'Worcestershire sauce'),
    ('Keto', 'Horseradish, prepared'),
    ('Keto', 'Pesto sauce, basil'),
    ('Keto', 'Guacamole'),
    ('Keto', 'Tzatziki'),
    ('Keto', 'Ranch dressing'),
    ('Keto', 'Chimichurri'),
    ('Keto', 'Buffalo sauce'),
    ('Keto', 'Alfredo sauce'),
    ('Keto', 'Whey protein powder'),
    ('Keto', 'Coca-Cola Zero'),
    ('Keto', 'Sprite Zero'),
    ('Plant-based (vegan)', 'Arugula'),
    ('Plant-based (vegan)', 'Asparagus'),
    ('Plant-based (vegan)', 'Bean sprouts'),
    ('Plant-based (vegan)', 'Bell pepper'),
    ('Plant-based (vegan)', 'Bok choy'),
    ('Plant-based (vegan)', 'Broccoli'),
    ('Plant-based (vegan)', 'Brussels sprouts'),
    ('Plant-based (vegan)', 'Cabbage'),
    ('Plant-based (vegan)', 'Red cabbage'),
    ('Plant-based (vegan)', 'Napa cabbage'),
    ('Plant-based (vegan)', 'Cauliflower'),
    ('Plant-based (vegan)', 'Celery'),
    ('Plant-based (vegan)', 'Chili pepper, red/green'),
    ('Plant-based (vegan)', 'Chives, raw'),
    ('Plant-based (vegan)', 'Collard greens'),
    ('Plant-based (vegan)', 'Cucumber'),
    ('Plant-based (vegan)', 'Daikon radish'),
    ('Plant-based (vegan)', 'Eggplant'),
    ('Plant-based (vegan)', 'Endive, raw'),
    ('Plant-based (vegan)', 'Fennel bulb'),
    ('Plant-based (vegan)', 'Garlic'),
    ('Plant-based (vegan)', 'Green beans'),
    ('Plant-based (vegan)', 'Jalapeño pepper'),
    ('Plant-based (vegan)', 'Kale'),
    ('Plant-based (vegan)', 'Kohlrabi, raw'),
    ('Plant-based (vegan)', 'Lettuce'),
    ('Plant-based (vegan)', 'Mushroom'),
    ('Plant-based (vegan)', 'Okra'),
    ('Plant-based (vegan)', 'Radish'),
    ('Plant-based (vegan)', 'Scallion / green onion'),
    ('Plant-based (vegan)', 'Spinach'),
    ('Plant-based (vegan)', 'Swiss chard'),
    ('Plant-based (vegan)', 'Tomato'),
    ('Plant-based (vegan)', 'Watercress'),
    ('Plant-based (vegan)', 'Zucchini'),
    ('Plant-based (vegan)', 'Artichoke, cooked'),
    ('Plant-based (vegan)', 'Beet'),
    ('Plant-based (vegan)', 'Butternut squash, cooked'),
    ('Plant-based (vegan)', 'Carrot'),
    ('Plant-based (vegan)', 'Corn'),
    ('Plant-based (vegan)', 'Green peas'),
    ('Plant-based (vegan)', 'Jicama, raw'),
    ('Plant-based (vegan)', 'Leek'),
    ('Plant-based (vegan)', 'Onion'),
    ('Plant-based (vegan)', 'Parsnip'),
    ('Plant-based (vegan)', 'Pumpkin'),
    ('Plant-based (vegan)', 'Rutabaga, cooked'),
    ('Plant-based (vegan)', 'Shallot, raw'),
    ('Plant-based (vegan)', 'Snap peas / snow peas'),
    ('Plant-based (vegan)', 'Sweet potato, baked'),
    ('Plant-based (vegan)', 'Sweet potato, raw'),
    ('Plant-based (vegan)', 'Turnip'),
    ('Plant-based (vegan)', 'Ginger, raw'),
    ('Plant-based (vegan)', 'Sun-dried tomatoes'),
    ('Plant-based (vegan)', 'Water chestnuts, canned'),
    ('Plant-based (vegan)', 'Potato, baked'),
    ('Plant-based (vegan)', 'Potato, boiled'),
    ('Plant-based (vegan)', 'Potato, raw'),
    ('Plant-based (vegan)', 'Cassava, cooked'),
    ('Plant-based (vegan)', 'Taro, cooked'),
    ('Plant-based (vegan)', 'Yam, cooked'),
    ('Plant-based (vegan)', 'Plantain, cooked (boiled)'),
    ('Plant-based (vegan)', 'Apple'),
    ('Plant-based (vegan)', 'Apricot'),
    ('Plant-based (vegan)', 'Banana'),
    ('Plant-based (vegan)', 'Blackberries'),
    ('Plant-based (vegan)', 'Blueberries'),
    ('Plant-based (vegan)', 'Cantaloupe / melon'),
    ('Plant-based (vegan)', 'Cherries'),
    ('Plant-based (vegan)', 'Clementine'),
    ('Plant-based (vegan)', 'Cranberries, raw'),
    ('Plant-based (vegan)', 'Currants, raw'),
    ('Plant-based (vegan)', 'Dragon fruit (pitaya)'),
    ('Plant-based (vegan)', 'Fig, fresh'),
    ('Plant-based (vegan)', 'Grapefruit'),
    ('Plant-based (vegan)', 'Grapes'),
    ('Plant-based (vegan)', 'Guava'),
    ('Plant-based (vegan)', 'Honeydew melon'),
    ('Plant-based (vegan)', 'Jackfruit, raw'),
    ('Plant-based (vegan)', 'Kiwi'),
    ('Plant-based (vegan)', 'Kumquat'),
    ('Plant-based (vegan)', 'Lemon'),
    ('Plant-based (vegan)', 'Lime'),
    ('Plant-based (vegan)', 'Lychee'),
    ('Plant-based (vegan)', 'Mango'),
    ('Plant-based (vegan)', 'Mulberries, raw'),
    ('Plant-based (vegan)', 'Nectarine'),
    ('Plant-based (vegan)', 'Orange'),
    ('Plant-based (vegan)', 'Papaya'),
    ('Plant-based (vegan)', 'Passion fruit'),
    ('Plant-based (vegan)', 'Peach'),
    ('Plant-based (vegan)', 'Pear'),
    ('Plant-based (vegan)', 'Persimmon'),
    ('Plant-based (vegan)', 'Pineapple'),
    ('Plant-based (vegan)', 'Plum'),
    ('Plant-based (vegan)', 'Pomegranate (arils)'),
    ('Plant-based (vegan)', 'Raspberries'),
    ('Plant-based (vegan)', 'Rhubarb, raw'),
    ('Plant-based (vegan)', 'Star fruit (carambola)'),
    ('Plant-based (vegan)', 'Strawberries'),
    ('Plant-based (vegan)', 'Tangerine / mandarin'),
    ('Plant-based (vegan)', 'Watermelon'),
    ('Plant-based (vegan)', 'Avocado'),
    ('Plant-based (vegan)', 'Coconut, fresh meat'),
    ('Plant-based (vegan)', 'Dates, dried (Medjool)'),
    ('Plant-based (vegan)', 'Dried apricots'),
    ('Plant-based (vegan)', 'Dried figs'),
    ('Plant-based (vegan)', 'Prunes (dried plums)'),
    ('Plant-based (vegan)', 'Raisins'),
    ('Plant-based (vegan)', 'Barley, cooked (pearled)'),
    ('Plant-based (vegan)', 'Brown rice, cooked'),
    ('Plant-based (vegan)', 'Brown rice, raw'),
    ('Plant-based (vegan)', 'Buckwheat groats, cooked'),
    ('Plant-based (vegan)', 'Bulgur, cooked'),
    ('Plant-based (vegan)', 'Farro, cooked'),
    ('Plant-based (vegan)', 'Oats, cooked (oatmeal, water)'),
    ('Plant-based (vegan)', 'Oats, dry'),
    ('Plant-based (vegan)', 'Quinoa, cooked'),
    ('Plant-based (vegan)', 'Quinoa, raw'),
    ('Plant-based (vegan)', 'Steel-cut oats, dry'),
    ('Plant-based (vegan)', 'Whole wheat bread'),
    ('Plant-based (vegan)', 'Whole wheat pasta, cooked'),
    ('Plant-based (vegan)', 'Wild rice, cooked'),
    ('Plant-based (vegan)', 'Bread, multigrain'),
    ('Plant-based (vegan)', 'Bread, rye'),
    ('Plant-based (vegan)', 'White rice, cooked'),
    ('Plant-based (vegan)', 'White rice, raw'),
    ('Plant-based (vegan)', 'Basmati rice, cooked'),
    ('Plant-based (vegan)', 'Jasmine rice, cooked'),
    ('Plant-based (vegan)', 'Pasta, cooked'),
    ('Plant-based (vegan)', 'Couscous, cooked'),
    ('Plant-based (vegan)', 'Rice noodles, cooked'),
    ('Plant-based (vegan)', 'Soba noodles, cooked'),
    ('Plant-based (vegan)', 'Bread, sourdough'),
    ('Plant-based (vegan)', 'White bread'),
    ('Plant-based (vegan)', 'Baguette'),
    ('Plant-based (vegan)', 'Pita bread, white'),
    ('Plant-based (vegan)', 'Bagel, plain'),
    ('Plant-based (vegan)', 'Tortilla, corn'),
    ('Plant-based (vegan)', 'Tortilla, flour'),
    ('Plant-based (vegan)', 'Polenta / cornmeal mush, cooked'),
    ('Plant-based (vegan)', 'Grits, cooked'),
    ('Plant-based (vegan)', 'Rice cakes'),
    ('Plant-based (vegan)', 'Muesli'),
    ('Plant-based (vegan)', 'Granola, plain'),
    ('Plant-based (vegan)', 'Cream of wheat, dry'),
    ('Plant-based (vegan)', 'Black beans, cooked'),
    ('Plant-based (vegan)', 'Black-eyed peas, cooked'),
    ('Plant-based (vegan)', 'Chickpeas, cooked'),
    ('Plant-based (vegan)', 'Edamame, cooked'),
    ('Plant-based (vegan)', 'Hummus'),
    ('Plant-based (vegan)', 'Kidney beans, cooked'),
    ('Plant-based (vegan)', 'Lentils, cooked'),
    ('Plant-based (vegan)', 'Lima beans, cooked'),
    ('Plant-based (vegan)', 'Navy beans, cooked'),
    ('Plant-based (vegan)', 'Pinto beans, cooked'),
    ('Plant-based (vegan)', 'Soybeans, cooked'),
    ('Plant-based (vegan)', 'Split peas, cooked'),
    ('Plant-based (vegan)', 'Tofu, firm'),
    ('Plant-based (vegan)', 'Tofu, silken'),
    ('Plant-based (vegan)', 'Tempeh'),
    ('Plant-based (vegan)', 'TVP (textured vegetable protein), dry'),
    ('Plant-based (vegan)', 'Seitan'),
    ('Plant-based (vegan)', 'Soy milk, unsweetened'),
    ('Plant-based (vegan)', 'Almonds'),
    ('Plant-based (vegan)', 'Brazil nuts'),
    ('Plant-based (vegan)', 'Cashews'),
    ('Plant-based (vegan)', 'Hazelnuts'),
    ('Plant-based (vegan)', 'Macadamia nuts'),
    ('Plant-based (vegan)', 'Pecans'),
    ('Plant-based (vegan)', 'Pine nuts'),
    ('Plant-based (vegan)', 'Pistachios'),
    ('Plant-based (vegan)', 'Walnuts'),
    ('Plant-based (vegan)', 'Mixed nuts, roasted'),
    ('Plant-based (vegan)', 'Peanuts, raw'),
    ('Plant-based (vegan)', 'Chia seeds'),
    ('Plant-based (vegan)', 'Flaxseed, ground'),
    ('Plant-based (vegan)', 'Hemp seeds'),
    ('Plant-based (vegan)', 'Pumpkin seeds (pepitas)'),
    ('Plant-based (vegan)', 'Sesame seeds'),
    ('Plant-based (vegan)', 'Sunflower seeds'),
    ('Plant-based (vegan)', 'Almond butter'),
    ('Plant-based (vegan)', 'Peanut butter'),
    ('Plant-based (vegan)', 'Tahini'),
    ('Plant-based (vegan)', 'Almond milk, unsweetened'),
    ('Plant-based (vegan)', 'Oat milk, unsweetened'),
    ('Plant-based (vegan)', 'Coconut milk, canned (full fat)'),
    ('Plant-based (vegan)', 'Olive oil'),
    ('Plant-based (vegan)', 'Avocado oil'),
    ('Plant-based (vegan)', 'Canola oil'),
    ('Plant-based (vegan)', 'Coconut oil'),
    ('Plant-based (vegan)', 'Sesame oil'),
    ('Plant-based (vegan)', 'Sunflower oil'),
    ('Plant-based (vegan)', 'Vegetable oil (soybean/canola blend)'),
    ('Plant-based (vegan)', 'Olives, green'),
    ('Plant-based (vegan)', 'Olives, black'),
    ('Plant-based (vegan)', 'Pickles, dill'),
    ('Plant-based (vegan)', 'Coconut, shredded, unsweetened'),
    ('Plant-based (vegan)', 'Dark chocolate 70-85%'),
    ('Plant-based (vegan)', 'Soy sauce'),
    ('Plant-based (vegan)', 'Teriyaki sauce'),
    ('Plant-based (vegan)', 'Dijon mustard'),
    ('Plant-based (vegan)', 'Yellow mustard'),
    ('Plant-based (vegan)', 'Ketchup'),
    ('Plant-based (vegan)', 'Salsa'),
    ('Plant-based (vegan)', 'Hot sauce (cayenne pepper, Tabasco-style)'),
    ('Plant-based (vegan)', 'Sriracha hot sauce'),
    ('Plant-based (vegan)', 'BBQ sauce'),
    ('Plant-based (vegan)', 'Balsamic vinegar'),
    ('Plant-based (vegan)', 'Apple cider vinegar'),
    ('Plant-based (vegan)', 'Guacamole'),
    ('Plant-based (vegan)', 'Chimichurri'),
    ('Plant-based (vegan)', 'Marinara / pasta sauce'),
    ('Plant-based (vegan)', 'Sweet chili sauce'),
    ('Plant-based (vegan)', 'Maple syrup'),
    ('Plant-based (vegan)', 'Agave nectar'),
    ('Plant-based (vegan)', 'Jam / fruit preserves'),
    ('Plant-based (vegan)', 'Applesauce, unsweetened'),
    ('Plant-based (vegan)', 'Coconut sugar'),
    ('Plant-based (vegan)', 'Sugar'),
    ('Plant-based (vegan)', 'Brown sugar');

  create temp table op (diet text, plan text, description text) on commit drop;
  insert into op values
    ('Mediterranean', 'Mediterranean sample day', 'One example day using only Mediterranean foods, about 1,470 kcal. Scale portions to your own goal.'),
    ('DASH', 'DASH sample day', 'One example day using only DASH foods, about 1,530 kcal. Scale portions to your own goal.'),
    ('Keto', 'Keto sample day', 'One example day using only Keto foods, about 1,470 kcal. Scale portions to your own goal.'),
    ('Plant-based (vegan)', 'Plant-based sample day', 'One example day using only Plant-based (vegan) foods, about 1,700 kcal. Scale portions to your own goal.');

  create temp table opi (plan text, meal_name text, meal_order int, item_order int, food_name text, grams numeric, serving_label text) on commit drop;
  insert into opi values
    ('Mediterranean sample day', 'Breakfast', 0, 0, 'Greek yogurt, plain nonfat', 170, '1 container (6 oz)'),
    ('Mediterranean sample day', 'Breakfast', 0, 1, 'Strawberries', 76, '1/2 cup, halves'),
    ('Mediterranean sample day', 'Breakfast', 0, 2, 'Walnuts', 14, '1/2 oz'),
    ('Mediterranean sample day', 'Breakfast', 0, 3, 'Honey', 7, '1 tsp'),
    ('Mediterranean sample day', 'Lunch', 1, 0, 'Lentils, cooked', 198, '1 cup'),
    ('Mediterranean sample day', 'Lunch', 1, 1, 'Tomato', 123, '1 medium'),
    ('Mediterranean sample day', 'Lunch', 1, 2, 'Cucumber', 52, '1/2 cup, sliced'),
    ('Mediterranean sample day', 'Lunch', 1, 3, 'Feta cheese', 38, '1/4 cup, crumbled'),
    ('Mediterranean sample day', 'Lunch', 1, 4, 'Olive oil', 13.5, '1 tbsp'),
    ('Mediterranean sample day', 'Lunch', 1, 5, 'Whole wheat bread', 32, '1 slice'),
    ('Mediterranean sample day', 'Snack', 2, 0, 'Almonds', 28, '1 oz (about 23 almonds)'),
    ('Mediterranean sample day', 'Snack', 2, 1, 'Orange', 131, '1 medium'),
    ('Mediterranean sample day', 'Dinner', 3, 0, 'Salmon, cooked', 113, '4 oz fillet'),
    ('Mediterranean sample day', 'Dinner', 3, 1, 'Bulgur, cooked', 182, '1 cup'),
    ('Mediterranean sample day', 'Dinner', 3, 2, 'Zucchini', 124, '1 cup, chopped'),
    ('Mediterranean sample day', 'Dinner', 3, 3, 'Olive oil', 4.5, '1 tsp'),
    ('DASH sample day', 'Breakfast', 0, 0, 'Oats, dry', 40, '1/2 cup dry'),
    ('DASH sample day', 'Breakfast', 0, 1, 'Milk, skim', 245, '1 cup'),
    ('DASH sample day', 'Breakfast', 0, 2, 'Blueberries', 74, '1/2 cup'),
    ('DASH sample day', 'Breakfast', 0, 3, 'Banana', 118, '1 medium'),
    ('DASH sample day', 'Lunch', 1, 0, 'Turkey breast, cooked', 85, '3 oz'),
    ('DASH sample day', 'Lunch', 1, 1, 'Whole wheat bread', 64, '2 slices'),
    ('DASH sample day', 'Lunch', 1, 2, 'Lettuce', 47, '1 cup, shredded'),
    ('DASH sample day', 'Lunch', 1, 3, 'Tomato', 62, '1/2 medium'),
    ('DASH sample day', 'Lunch', 1, 4, 'Apple', 182, '1 medium'),
    ('DASH sample day', 'Snack', 2, 0, 'Yogurt, plain, low fat', 245, '1 cup'),
    ('DASH sample day', 'Snack', 2, 1, 'Almonds', 14, '1/2 oz'),
    ('DASH sample day', 'Dinner', 3, 0, 'Chicken breast, cooked', 113, '4 oz'),
    ('DASH sample day', 'Dinner', 3, 1, 'Brown rice, cooked', 195, '1 cup'),
    ('DASH sample day', 'Dinner', 3, 2, 'Broccoli', 91, '1 cup, chopped'),
    ('DASH sample day', 'Dinner', 3, 3, 'Carrot', 61, '1 medium'),
    ('DASH sample day', 'Dinner', 3, 4, 'Olive oil', 4.5, '1 tsp'),
    ('Keto sample day', 'Breakfast', 0, 0, 'Egg, whole', 150, '3 large'),
    ('Keto sample day', 'Breakfast', 0, 1, 'Bacon, pan-fried', 16, '2 slices'),
    ('Keto sample day', 'Breakfast', 0, 2, 'Avocado', 50, '1/3 avocado'),
    ('Keto sample day', 'Breakfast', 0, 3, 'Spinach', 30, '1 cup'),
    ('Keto sample day', 'Lunch', 1, 0, 'Chicken thigh, cooked', 113, '4 oz'),
    ('Keto sample day', 'Lunch', 1, 1, 'Lettuce', 94, '2 cups, shredded'),
    ('Keto sample day', 'Lunch', 1, 2, 'Cucumber', 52, '1/2 cup, sliced'),
    ('Keto sample day', 'Lunch', 1, 3, 'Olive oil', 13.5, '1 tbsp'),
    ('Keto sample day', 'Lunch', 1, 4, 'Parmesan cheese, hard', 5, '1 tbsp, grated'),
    ('Keto sample day', 'Snack', 2, 0, 'Almonds', 28, '1 oz (about 23 almonds)'),
    ('Keto sample day', 'Snack', 2, 1, 'Cheddar cheese', 28, '1 oz'),
    ('Keto sample day', 'Dinner', 3, 0, 'Salmon, cooked', 113, '4 oz fillet'),
    ('Keto sample day', 'Dinner', 3, 1, 'Broccoli', 91, '1 cup, chopped'),
    ('Keto sample day', 'Dinner', 3, 2, 'Cauliflower', 107, '1 cup, chopped'),
    ('Keto sample day', 'Dinner', 3, 3, 'Butter', 14, '1 tbsp'),
    ('Plant-based sample day', 'Breakfast', 0, 0, 'Oats, dry', 40, '1/2 cup dry'),
    ('Plant-based sample day', 'Breakfast', 0, 1, 'Soy milk, unsweetened', 243, '1 cup'),
    ('Plant-based sample day', 'Breakfast', 0, 2, 'Banana', 118, '1 medium'),
    ('Plant-based sample day', 'Breakfast', 0, 3, 'Chia seeds', 12, '1 tbsp'),
    ('Plant-based sample day', 'Breakfast', 0, 4, 'Peanut butter', 16, '1 tbsp'),
    ('Plant-based sample day', 'Lunch', 1, 0, 'Chickpeas, cooked', 164, '1 cup'),
    ('Plant-based sample day', 'Lunch', 1, 1, 'Quinoa, cooked', 93, '1/2 cup'),
    ('Plant-based sample day', 'Lunch', 1, 2, 'Spinach', 30, '1 cup'),
    ('Plant-based sample day', 'Lunch', 1, 3, 'Tomato', 123, '1 medium'),
    ('Plant-based sample day', 'Lunch', 1, 4, 'Olive oil', 13.5, '1 tbsp'),
    ('Plant-based sample day', 'Snack', 2, 0, 'Hummus', 30, '2 tbsp'),
    ('Plant-based sample day', 'Snack', 2, 1, 'Carrot', 61, '1 medium'),
    ('Plant-based sample day', 'Snack', 2, 2, 'Apple', 182, '1 medium'),
    ('Plant-based sample day', 'Dinner', 3, 0, 'Tofu, firm', 126, '1/2 cup'),
    ('Plant-based sample day', 'Dinner', 3, 1, 'Brown rice, cooked', 195, '1 cup'),
    ('Plant-based sample day', 'Dinner', 3, 2, 'Broccoli', 91, '1 cup, chopped'),
    ('Plant-based sample day', 'Dinner', 3, 3, 'Bell pepper', 149, '1 cup, chopped'),
    ('Plant-based sample day', 'Dinner', 3, 4, 'Soy sauce', 16, '1 tbsp');

  select string_agg(distinct x.food_name, ', ') into missing
    from (select food_name from odf union select food_name from opi) x
   where not exists (select 1 from foods f where f.user_id is null and f.name = x.food_name);
  if missing is not null then
    raise exception 'These foods are missing from the shared library: %', missing;
  end if;

  -- Sample days must stick to their own diet's foods.
  select string_agg(distinct op.plan || ': ' || opi.food_name, ', ') into missing
    from opi join op on op.plan = opi.plan
   where not exists (select 1 from odf where odf.diet = op.diet and odf.food_name = opi.food_name);
  if missing is not null then
    raise exception 'Sample day uses foods outside its diet: %', missing;
  end if;

  for rec in select * from od order by sort loop
    if not exists (select 1 from diets where is_official and name = rec.name) then
      insert into diets (user_id, name, description, is_shared, is_official, created_at)
      values (owner_id, rec.name, rec.description, true, true, clock_timestamp())
      returning id into new_diet;

      insert into diet_foods (diet_id, food_id)
      select new_diet, (select f.id from foods f where f.user_id is null and f.name = odf.food_name order by f.created_at limit 1)
        from odf where odf.diet = rec.name
      on conflict do nothing;

      for rec2 in select * from op where op.diet = rec.name loop
        insert into meal_plans (user_id, name, description, days, diet_id, is_shared, is_official, created_at)
        values (owner_id, rec2.plan, rec2.description, 1, new_diet, true, true, clock_timestamp())
        returning id into new_plan;

        insert into meal_plan_items (plan_id, day_index, meal_name, meal_order, item_order, food_id, grams, serving_label)
        select new_plan, 0, opi.meal_name, opi.meal_order, opi.item_order,
               (select f.id from foods f where f.user_id is null and f.name = opi.food_name order by f.created_at limit 1),
               opi.grams, opi.serving_label
          from opi where opi.plan = rec2.plan;
      end loop;
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
