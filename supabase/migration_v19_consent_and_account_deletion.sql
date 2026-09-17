-- FitLog schema v19: health-data consent + account deletion support. Safe to run more than once.

-- 1. When the user agreed to the in-app health & fitness data disclosure (Google Play User Data
--    policy: prominent disclosure and consent). Null = not agreed yet, so the app asks.
alter table user_settings
  add column if not exists health_data_consent_at timestamptz;

-- 2. Runs right before an auth user is deleted (called only by api/account/delete.ts with the
--    service-role key). Deleting auth.users cascades through every personal table, but two kinds
--    of rows can be referenced by ANOTHER user through shared presets/recipes:
--      * foods      - other users' meal_items / recipe_ingredients / meal_preset_items use
--                     `on delete restrict`, which would make the whole account deletion fail;
--      * exercises  - other users' workout_sets / workout_preset_items / exercise_notes use
--                     `on delete cascade`, which would silently delete THEIR training history.
--    Exactly those rows are detached (user_id -> null, i.e. moved to the shared library) so the
--    other person's logs survive and the deletion can proceed. Everything else still cascades.
--    Error logs use `on delete set null`, so they're removed explicitly here.
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

-- Server-only: never callable with the anon key or a user's session.
revoke all on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;

notify pgrst, 'reload schema';
