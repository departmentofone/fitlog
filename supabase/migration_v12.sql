-- FitLog data fix v12: remove duplicate exercise rows.
-- seed_exercises_v3_bodyweight.sql accidentally re-inserted 'Sit-Up' and 'Hanging Leg
-- Raise' (both muscle_group 'abs'), which already exist from seed_exercises.sql - its
-- own header comment even says these "already exist from earlier seeds" but the two
-- rows were included anyway. That's why they show up twice in the exercise picker.
-- For each duplicate pair, this keeps whichever row is already referenced by
-- workout_sets/workout_preset_items/exercise_notes/goals (so no logged history gets
-- cascade-deleted), or the earliest-inserted row if neither is referenced, and deletes
-- the rest. Paste into the Supabase SQL editor and run once.

with duplicates as (
  select
    id,
    row_number() over (
      partition by user_id, name, muscle_group
      order by
        (exists (select 1 from workout_sets ws where ws.exercise_id = exercises.id)) desc,
        (exists (select 1 from workout_preset_items wpi where wpi.exercise_id = exercises.id)) desc,
        (exists (select 1 from exercise_notes en where en.exercise_id = exercises.id)) desc,
        (exists (select 1 from goals g where g.target_exercise_id = exercises.id)) desc,
        created_at asc,
        id asc
    ) as rn
  from exercises
  where name in ('Sit-Up', 'Hanging Leg Raise')
)
delete from exercises
where id in (select id from duplicates where rn > 1);
