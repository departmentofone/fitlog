-- FitLog schema v20: make shared presets/recipes actually usable, and keep warm-up flags in
-- workout presets. Safe to run more than once.
--
-- Why: foods and exercises are readable only when they're global (user_id is null) or your own
-- (migration.sql "read foods", migration_v2.sql "read shared exercises"). But sharing a meal
-- preset, recipe, or workout preset shares rows that reference the OWNER's custom foods/exercises.
-- The recipient could see the preset but not its contents: PostgREST returns null for the hidden
-- embed, so names showed as "Unavailable food"/"Unavailable exercise" and macros counted as zero.
-- These policies grant read access to exactly the rows a shared item references - nothing else.

-- Foods referenced by a shared meal preset or a shared recipe.
drop policy if exists "read foods in shared content" on foods;
create policy "read foods in shared content" on foods
  for select
  using (
    exists (
      select 1 from meal_preset_items pi
        join meal_presets p on p.id = pi.preset_id
       where pi.food_id = foods.id and p.is_shared
    )
    or exists (
      select 1 from recipe_ingredients ri
        join recipes r on r.id = ri.recipe_id
       where ri.food_id = foods.id and r.is_shared
    )
  );

-- Exercises referenced by a shared workout preset.
drop policy if exists "read exercises in shared presets" on exercises;
create policy "read exercises in shared presets" on exercises
  for select
  using (
    exists (
      select 1 from workout_preset_items wi
        join workout_presets p on p.id = wi.preset_id
       where wi.exercise_id = exercises.id and p.is_shared
    )
  );

-- The policies above look up by food_id/exercise_id, which had no index (the existing ones cover
-- the parent columns). Without these, every food search would scan these tables per candidate row.
create index if not exists meal_preset_items_food_id_idx on meal_preset_items (food_id);
create index if not exists recipe_ingredients_food_id_idx on recipe_ingredients (food_id);
create index if not exists meal_items_food_id_idx on meal_items (food_id);
create index if not exists workout_preset_items_exercise_id_idx on workout_preset_items (exercise_id);

-- Warm-up sets lost their flag when saved into a preset and came back as working sets, quietly
-- counting toward PRs and volume. Nullable-with-default so existing presets are unaffected.
alter table workout_preset_items
  add column if not exists is_warmup boolean not null default false;

notify pgrst, 'reload schema';
