-- v36: a daily protein goal, and planned sets for a started preset.
--
-- protein_goal: grams a day, set next to the calorie goal on Eat > Diet and shown against the day's
--   protein on Meals and Diet. Optional.
-- plan: when you start a preset (or a ready-made workout), its sets wait here and you tick each
--   one off in the set form, the way Strong and Hevy work. Ticking logs a real workout_set and
--   removes it from the plan, so planned sets never count toward volume, PRs or streaks.
--
-- Safe to run more than once. Existing row-level security already limits both tables to their
-- owner, and both columns are on rows the owner already reads and updates.

alter table user_settings add column if not exists protein_goal numeric;
alter table user_settings drop constraint if exists user_settings_protein_goal_positive;
alter table user_settings add constraint user_settings_protein_goal_positive
  check (protein_goal is null or (protein_goal > 0 and protein_goal < 1000));

alter table workout_sessions add column if not exists plan jsonb;

notify pgrst, 'reload schema';
