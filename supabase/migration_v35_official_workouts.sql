-- v35: official workouts and programs for Community.
--
-- Community had official diets, meal plans and meal presets but no workouts or programs, so
-- someone opening Train for the first time had nothing ready-made to start from. This adds
-- 8 official workout presets and 3 official programs built from them,
-- all from exercises already in the shared library. Weights are left at 0: a template doesn't know
-- what you lift. Loading one fills in the weight you last logged for each exercise (useLoadPreset),
-- and the rest you set on your first session.
--
-- Same model as the official meal presets in migration_v28: owned by the owner account, shared,
-- badged "Official", and hidden from that account's own lists. Safe to run more than once: an
-- official item that already exists by name is skipped. All-or-nothing: if any exercise is missing
-- from the shared library, nothing is created. Needs v11 (programs) and v28 (is_official).

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

  create temp table official_sets (
    preset_order int, preset text, description text, set_order int, exercise_name text, reps int
  ) on commit drop;

  insert into official_sets values
    (1, 'Full Body A', 'Squat, bench press and barbell row, three sets of five. Alternate with Full Body B.', 1, 'Barbell Back Squat', 5),
    (1, 'Full Body A', null, 2, 'Barbell Back Squat', 5),
    (1, 'Full Body A', null, 3, 'Barbell Back Squat', 5),
    (1, 'Full Body A', null, 4, 'Barbell Bench Press', 5),
    (1, 'Full Body A', null, 5, 'Barbell Bench Press', 5),
    (1, 'Full Body A', null, 6, 'Barbell Bench Press', 5),
    (1, 'Full Body A', null, 7, 'Barbell Row', 5),
    (1, 'Full Body A', null, 8, 'Barbell Row', 5),
    (1, 'Full Body A', null, 9, 'Barbell Row', 5),
    (2, 'Full Body B', 'Squat, overhead press and one heavy set of deadlifts. Alternate with Full Body A.', 1, 'Barbell Back Squat', 5),
    (2, 'Full Body B', null, 2, 'Barbell Back Squat', 5),
    (2, 'Full Body B', null, 3, 'Barbell Back Squat', 5),
    (2, 'Full Body B', null, 4, 'Overhead Barbell Press', 5),
    (2, 'Full Body B', null, 5, 'Overhead Barbell Press', 5),
    (2, 'Full Body B', null, 6, 'Overhead Barbell Press', 5),
    (2, 'Full Body B', null, 7, 'Deadlift', 5),
    (3, 'Push', 'Chest, shoulders and triceps: two pressing lifts, then lighter accessories.', 1, 'Barbell Bench Press', 8),
    (3, 'Push', null, 2, 'Barbell Bench Press', 8),
    (3, 'Push', null, 3, 'Barbell Bench Press', 8),
    (3, 'Push', null, 4, 'Overhead Barbell Press', 8),
    (3, 'Push', null, 5, 'Overhead Barbell Press', 8),
    (3, 'Push', null, 6, 'Overhead Barbell Press', 8),
    (3, 'Push', null, 7, 'Incline Dumbbell Press', 10),
    (3, 'Push', null, 8, 'Incline Dumbbell Press', 10),
    (3, 'Push', null, 9, 'Incline Dumbbell Press', 10),
    (3, 'Push', null, 10, 'Dumbbell Lateral Raise', 15),
    (3, 'Push', null, 11, 'Dumbbell Lateral Raise', 15),
    (3, 'Push', null, 12, 'Dumbbell Lateral Raise', 15),
    (3, 'Push', null, 13, 'Triceps Pushdown (Rope)', 12),
    (3, 'Push', null, 14, 'Triceps Pushdown (Rope)', 12),
    (3, 'Push', null, 15, 'Triceps Pushdown (Rope)', 12),
    (4, 'Pull', 'Back and biceps: deadlifts first, then pull-ups, rows and arm work.', 1, 'Deadlift', 5),
    (4, 'Pull', null, 2, 'Deadlift', 5),
    (4, 'Pull', null, 3, 'Deadlift', 5),
    (4, 'Pull', null, 4, 'Pull-Up', 8),
    (4, 'Pull', null, 5, 'Pull-Up', 8),
    (4, 'Pull', null, 6, 'Pull-Up', 8),
    (4, 'Pull', null, 7, 'Barbell Row', 8),
    (4, 'Pull', null, 8, 'Barbell Row', 8),
    (4, 'Pull', null, 9, 'Barbell Row', 8),
    (4, 'Pull', null, 10, 'Face Pull (Cable Rope)', 15),
    (4, 'Pull', null, 11, 'Face Pull (Cable Rope)', 15),
    (4, 'Pull', null, 12, 'Face Pull (Cable Rope)', 15),
    (4, 'Pull', null, 13, 'Barbell Curl', 10),
    (4, 'Pull', null, 14, 'Barbell Curl', 10),
    (4, 'Pull', null, 15, 'Barbell Curl', 10),
    (5, 'Legs', 'Quads, hamstrings and calves, with squats as the main lift.', 1, 'Barbell Back Squat', 6),
    (5, 'Legs', null, 2, 'Barbell Back Squat', 6),
    (5, 'Legs', null, 3, 'Barbell Back Squat', 6),
    (5, 'Legs', null, 4, 'Romanian Deadlift (Barbell)', 8),
    (5, 'Legs', null, 5, 'Romanian Deadlift (Barbell)', 8),
    (5, 'Legs', null, 6, 'Romanian Deadlift (Barbell)', 8),
    (5, 'Legs', null, 7, 'Leg Press (Machine)', 10),
    (5, 'Legs', null, 8, 'Leg Press (Machine)', 10),
    (5, 'Legs', null, 9, 'Leg Press (Machine)', 10),
    (5, 'Legs', null, 10, 'Lying Leg Curl (Machine)', 12),
    (5, 'Legs', null, 11, 'Lying Leg Curl (Machine)', 12),
    (5, 'Legs', null, 12, 'Lying Leg Curl (Machine)', 12),
    (5, 'Legs', null, 13, 'Standing Calf Raise (Machine)', 12),
    (5, 'Legs', null, 14, 'Standing Calf Raise (Machine)', 12),
    (5, 'Legs', null, 15, 'Standing Calf Raise (Machine)', 12),
    (6, 'Upper', 'Presses, rows and pulldowns for the whole upper body, plus a little arm work.', 1, 'Barbell Bench Press', 8),
    (6, 'Upper', null, 2, 'Barbell Bench Press', 8),
    (6, 'Upper', null, 3, 'Barbell Bench Press', 8),
    (6, 'Upper', null, 4, 'Barbell Row', 8),
    (6, 'Upper', null, 5, 'Barbell Row', 8),
    (6, 'Upper', null, 6, 'Barbell Row', 8),
    (6, 'Upper', null, 7, 'Seated Dumbbell Shoulder Press', 10),
    (6, 'Upper', null, 8, 'Seated Dumbbell Shoulder Press', 10),
    (6, 'Upper', null, 9, 'Seated Dumbbell Shoulder Press', 10),
    (6, 'Upper', null, 10, 'Lat Pulldown (Wide Grip)', 10),
    (6, 'Upper', null, 11, 'Lat Pulldown (Wide Grip)', 10),
    (6, 'Upper', null, 12, 'Lat Pulldown (Wide Grip)', 10),
    (6, 'Upper', null, 13, 'Dumbbell Bicep Curl', 12),
    (6, 'Upper', null, 14, 'Dumbbell Bicep Curl', 12),
    (6, 'Upper', null, 15, 'Triceps Pushdown (Rope)', 12),
    (6, 'Upper', null, 16, 'Triceps Pushdown (Rope)', 12),
    (7, 'Lower', 'Squats, Romanian deadlifts and split squats, then hamstrings, calves and abs.', 1, 'Barbell Back Squat', 6),
    (7, 'Lower', null, 2, 'Barbell Back Squat', 6),
    (7, 'Lower', null, 3, 'Barbell Back Squat', 6),
    (7, 'Lower', null, 4, 'Romanian Deadlift (Barbell)', 8),
    (7, 'Lower', null, 5, 'Romanian Deadlift (Barbell)', 8),
    (7, 'Lower', null, 6, 'Romanian Deadlift (Barbell)', 8),
    (7, 'Lower', null, 7, 'Bulgarian Split Squat (Dumbbell)', 10),
    (7, 'Lower', null, 8, 'Bulgarian Split Squat (Dumbbell)', 10),
    (7, 'Lower', null, 9, 'Bulgarian Split Squat (Dumbbell)', 10),
    (7, 'Lower', null, 10, 'Seated Leg Curl (Machine)', 12),
    (7, 'Lower', null, 11, 'Seated Leg Curl (Machine)', 12),
    (7, 'Lower', null, 12, 'Seated Leg Curl (Machine)', 12),
    (7, 'Lower', null, 13, 'Standing Calf Raise (Machine)', 15),
    (7, 'Lower', null, 14, 'Standing Calf Raise (Machine)', 15),
    (7, 'Lower', null, 15, 'Standing Calf Raise (Machine)', 15),
    (7, 'Lower', null, 16, 'Hanging Leg Raise', 12),
    (7, 'Lower', null, 17, 'Hanging Leg Raise', 12),
    (7, 'Lower', null, 18, 'Hanging Leg Raise', 12),
    (8, 'Dumbbells only', 'A full-body session for home or a crowded gym: one pair of dumbbells and the floor.', 1, 'Goblet Squat (Dumbbell)', 10),
    (8, 'Dumbbells only', null, 2, 'Goblet Squat (Dumbbell)', 10),
    (8, 'Dumbbells only', null, 3, 'Goblet Squat (Dumbbell)', 10),
    (8, 'Dumbbells only', null, 4, 'Push-Up', 12),
    (8, 'Dumbbells only', null, 5, 'Push-Up', 12),
    (8, 'Dumbbells only', null, 6, 'Push-Up', 12),
    (8, 'Dumbbells only', null, 7, 'Dumbbell Row', 10),
    (8, 'Dumbbells only', null, 8, 'Dumbbell Row', 10),
    (8, 'Dumbbells only', null, 9, 'Dumbbell Row', 10),
    (8, 'Dumbbells only', null, 10, 'Romanian Deadlift (Dumbbell)', 10),
    (8, 'Dumbbells only', null, 11, 'Romanian Deadlift (Dumbbell)', 10),
    (8, 'Dumbbells only', null, 12, 'Romanian Deadlift (Dumbbell)', 10),
    (8, 'Dumbbells only', null, 13, 'Seated Dumbbell Shoulder Press', 10),
    (8, 'Dumbbells only', null, 14, 'Seated Dumbbell Shoulder Press', 10),
    (8, 'Dumbbells only', null, 15, 'Seated Dumbbell Shoulder Press', 10),
    (8, 'Dumbbells only', null, 16, 'Dumbbell Lunge', 10),
    (8, 'Dumbbells only', null, 17, 'Dumbbell Lunge', 10);

  select string_agg(distinct os.exercise_name, ', ') into missing
    from official_sets os
   where not exists (select 1 from exercises e where e.user_id is null and e.name = os.exercise_name);
  if missing is not null then
    raise exception 'These exercises are missing from the shared library: %', missing;
  end if;

  -- 1. Workout presets. Set numbers count up per exercise, the way the app numbers logged sets.
  for rec in
    select preset, max(description) as description, min(preset_order) as preset_order
      from official_sets group by preset order by min(preset_order)
  loop
    if not exists (select 1 from workout_presets where is_official and name = rec.preset) then
      -- clock_timestamp(), not now(): Community lists official items in the order they were created.
      insert into workout_presets (user_id, name, description, is_shared, is_official, created_at)
      values (owner_id, rec.preset, rec.description, true, true, clock_timestamp())
      returning id into new_id;

      insert into workout_preset_items (preset_id, exercise_id, set_number, weight, reps, is_warmup)
      select new_id,
             (select e.id from exercises e where e.user_id is null and e.name = os.exercise_name order by e.created_at limit 1),
             row_number() over (partition by os.exercise_name order by os.set_order),
             0, os.reps, false
        from official_sets os
       where os.preset = rec.preset
       order by os.set_order;
    end if;
  end loop;

  -- 2. Programs: self-contained snapshots (exercises by name and muscle group, see migration_v11),
  --    so importing one creates the workouts in the importer's own account.
  if not exists (select 1 from programs where is_official and name = 'Beginner full body') then
    insert into programs (user_id, name, description, is_shared, is_official, workouts, created_at)
    values (owner_id, 'Beginner full body', 'Three days a week, alternating Full Body A and B (A, B, A one week, B, A, B the next). Start light and add 2.5 kg to a lift each time you finish all its sets.', true, true,
            '[{"name": "Full Body A", "items": [{"exerciseName": "Barbell Back Squat", "muscleGroup": "quads", "setNumber": 1, "weight": 0, "reps": 5}, {"exerciseName": "Barbell Back Squat", "muscleGroup": "quads", "setNumber": 2, "weight": 0, "reps": 5}, {"exerciseName": "Barbell Back Squat", "muscleGroup": "quads", "setNumber": 3, "weight": 0, "reps": 5}, {"exerciseName": "Barbell Bench Press", "muscleGroup": "chest", "setNumber": 1, "weight": 0, "reps": 5}, {"exerciseName": "Barbell Bench Press", "muscleGroup": "chest", "setNumber": 2, "weight": 0, "reps": 5}, {"exerciseName": "Barbell Bench Press", "muscleGroup": "chest", "setNumber": 3, "weight": 0, "reps": 5}, {"exerciseName": "Barbell Row", "muscleGroup": "back", "setNumber": 1, "weight": 0, "reps": 5}, {"exerciseName": "Barbell Row", "muscleGroup": "back", "setNumber": 2, "weight": 0, "reps": 5}, {"exerciseName": "Barbell Row", "muscleGroup": "back", "setNumber": 3, "weight": 0, "reps": 5}]}, {"name": "Full Body B", "items": [{"exerciseName": "Barbell Back Squat", "muscleGroup": "quads", "setNumber": 1, "weight": 0, "reps": 5}, {"exerciseName": "Barbell Back Squat", "muscleGroup": "quads", "setNumber": 2, "weight": 0, "reps": 5}, {"exerciseName": "Barbell Back Squat", "muscleGroup": "quads", "setNumber": 3, "weight": 0, "reps": 5}, {"exerciseName": "Overhead Barbell Press", "muscleGroup": "shoulders", "setNumber": 1, "weight": 0, "reps": 5}, {"exerciseName": "Overhead Barbell Press", "muscleGroup": "shoulders", "setNumber": 2, "weight": 0, "reps": 5}, {"exerciseName": "Overhead Barbell Press", "muscleGroup": "shoulders", "setNumber": 3, "weight": 0, "reps": 5}, {"exerciseName": "Deadlift", "muscleGroup": "back", "setNumber": 1, "weight": 0, "reps": 5}]}]'::jsonb,
            clock_timestamp());
  end if;
  if not exists (select 1 from programs where is_official and name = 'Push Pull Legs') then
    insert into programs (user_id, name, description, is_shared, is_official, workouts, created_at)
    values (owner_id, 'Push Pull Legs', 'Push, Pull and Legs in order. Run it once a week for three days of training, or twice for six.', true, true,
            '[{"name": "Push", "items": [{"exerciseName": "Barbell Bench Press", "muscleGroup": "chest", "setNumber": 1, "weight": 0, "reps": 8}, {"exerciseName": "Barbell Bench Press", "muscleGroup": "chest", "setNumber": 2, "weight": 0, "reps": 8}, {"exerciseName": "Barbell Bench Press", "muscleGroup": "chest", "setNumber": 3, "weight": 0, "reps": 8}, {"exerciseName": "Overhead Barbell Press", "muscleGroup": "shoulders", "setNumber": 1, "weight": 0, "reps": 8}, {"exerciseName": "Overhead Barbell Press", "muscleGroup": "shoulders", "setNumber": 2, "weight": 0, "reps": 8}, {"exerciseName": "Overhead Barbell Press", "muscleGroup": "shoulders", "setNumber": 3, "weight": 0, "reps": 8}, {"exerciseName": "Incline Dumbbell Press", "muscleGroup": "chest", "setNumber": 1, "weight": 0, "reps": 10}, {"exerciseName": "Incline Dumbbell Press", "muscleGroup": "chest", "setNumber": 2, "weight": 0, "reps": 10}, {"exerciseName": "Incline Dumbbell Press", "muscleGroup": "chest", "setNumber": 3, "weight": 0, "reps": 10}, {"exerciseName": "Dumbbell Lateral Raise", "muscleGroup": "shoulders", "setNumber": 1, "weight": 0, "reps": 15}, {"exerciseName": "Dumbbell Lateral Raise", "muscleGroup": "shoulders", "setNumber": 2, "weight": 0, "reps": 15}, {"exerciseName": "Dumbbell Lateral Raise", "muscleGroup": "shoulders", "setNumber": 3, "weight": 0, "reps": 15}, {"exerciseName": "Triceps Pushdown (Rope)", "muscleGroup": "triceps", "setNumber": 1, "weight": 0, "reps": 12}, {"exerciseName": "Triceps Pushdown (Rope)", "muscleGroup": "triceps", "setNumber": 2, "weight": 0, "reps": 12}, {"exerciseName": "Triceps Pushdown (Rope)", "muscleGroup": "triceps", "setNumber": 3, "weight": 0, "reps": 12}]}, {"name": "Pull", "items": [{"exerciseName": "Deadlift", "muscleGroup": "back", "setNumber": 1, "weight": 0, "reps": 5}, {"exerciseName": "Deadlift", "muscleGroup": "back", "setNumber": 2, "weight": 0, "reps": 5}, {"exerciseName": "Deadlift", "muscleGroup": "back", "setNumber": 3, "weight": 0, "reps": 5}, {"exerciseName": "Pull-Up", "muscleGroup": "back", "setNumber": 1, "weight": 0, "reps": 8}, {"exerciseName": "Pull-Up", "muscleGroup": "back", "setNumber": 2, "weight": 0, "reps": 8}, {"exerciseName": "Pull-Up", "muscleGroup": "back", "setNumber": 3, "weight": 0, "reps": 8}, {"exerciseName": "Barbell Row", "muscleGroup": "back", "setNumber": 1, "weight": 0, "reps": 8}, {"exerciseName": "Barbell Row", "muscleGroup": "back", "setNumber": 2, "weight": 0, "reps": 8}, {"exerciseName": "Barbell Row", "muscleGroup": "back", "setNumber": 3, "weight": 0, "reps": 8}, {"exerciseName": "Face Pull (Cable Rope)", "muscleGroup": "back", "setNumber": 1, "weight": 0, "reps": 15}, {"exerciseName": "Face Pull (Cable Rope)", "muscleGroup": "back", "setNumber": 2, "weight": 0, "reps": 15}, {"exerciseName": "Face Pull (Cable Rope)", "muscleGroup": "back", "setNumber": 3, "weight": 0, "reps": 15}, {"exerciseName": "Barbell Curl", "muscleGroup": "biceps", "setNumber": 1, "weight": 0, "reps": 10}, {"exerciseName": "Barbell Curl", "muscleGroup": "biceps", "setNumber": 2, "weight": 0, "reps": 10}, {"exerciseName": "Barbell Curl", "muscleGroup": "biceps", "setNumber": 3, "weight": 0, "reps": 10}]}, {"name": "Legs", "items": [{"exerciseName": "Barbell Back Squat", "muscleGroup": "quads", "setNumber": 1, "weight": 0, "reps": 6}, {"exerciseName": "Barbell Back Squat", "muscleGroup": "quads", "setNumber": 2, "weight": 0, "reps": 6}, {"exerciseName": "Barbell Back Squat", "muscleGroup": "quads", "setNumber": 3, "weight": 0, "reps": 6}, {"exerciseName": "Romanian Deadlift (Barbell)", "muscleGroup": "hamstrings", "setNumber": 1, "weight": 0, "reps": 8}, {"exerciseName": "Romanian Deadlift (Barbell)", "muscleGroup": "hamstrings", "setNumber": 2, "weight": 0, "reps": 8}, {"exerciseName": "Romanian Deadlift (Barbell)", "muscleGroup": "hamstrings", "setNumber": 3, "weight": 0, "reps": 8}, {"exerciseName": "Leg Press (Machine)", "muscleGroup": "quads", "setNumber": 1, "weight": 0, "reps": 10}, {"exerciseName": "Leg Press (Machine)", "muscleGroup": "quads", "setNumber": 2, "weight": 0, "reps": 10}, {"exerciseName": "Leg Press (Machine)", "muscleGroup": "quads", "setNumber": 3, "weight": 0, "reps": 10}, {"exerciseName": "Lying Leg Curl (Machine)", "muscleGroup": "hamstrings", "setNumber": 1, "weight": 0, "reps": 12}, {"exerciseName": "Lying Leg Curl (Machine)", "muscleGroup": "hamstrings", "setNumber": 2, "weight": 0, "reps": 12}, {"exerciseName": "Lying Leg Curl (Machine)", "muscleGroup": "hamstrings", "setNumber": 3, "weight": 0, "reps": 12}, {"exerciseName": "Standing Calf Raise (Machine)", "muscleGroup": "calves", "setNumber": 1, "weight": 0, "reps": 12}, {"exerciseName": "Standing Calf Raise (Machine)", "muscleGroup": "calves", "setNumber": 2, "weight": 0, "reps": 12}, {"exerciseName": "Standing Calf Raise (Machine)", "muscleGroup": "calves", "setNumber": 3, "weight": 0, "reps": 12}]}]'::jsonb,
            clock_timestamp());
  end if;
  if not exists (select 1 from programs where is_official and name = 'Upper Lower') then
    insert into programs (user_id, name, description, is_shared, is_official, workouts, created_at)
    values (owner_id, 'Upper Lower', 'Four days a week: Upper, Lower, a rest day, then Upper and Lower again.', true, true,
            '[{"name": "Upper", "items": [{"exerciseName": "Barbell Bench Press", "muscleGroup": "chest", "setNumber": 1, "weight": 0, "reps": 8}, {"exerciseName": "Barbell Bench Press", "muscleGroup": "chest", "setNumber": 2, "weight": 0, "reps": 8}, {"exerciseName": "Barbell Bench Press", "muscleGroup": "chest", "setNumber": 3, "weight": 0, "reps": 8}, {"exerciseName": "Barbell Row", "muscleGroup": "back", "setNumber": 1, "weight": 0, "reps": 8}, {"exerciseName": "Barbell Row", "muscleGroup": "back", "setNumber": 2, "weight": 0, "reps": 8}, {"exerciseName": "Barbell Row", "muscleGroup": "back", "setNumber": 3, "weight": 0, "reps": 8}, {"exerciseName": "Seated Dumbbell Shoulder Press", "muscleGroup": "shoulders", "setNumber": 1, "weight": 0, "reps": 10}, {"exerciseName": "Seated Dumbbell Shoulder Press", "muscleGroup": "shoulders", "setNumber": 2, "weight": 0, "reps": 10}, {"exerciseName": "Seated Dumbbell Shoulder Press", "muscleGroup": "shoulders", "setNumber": 3, "weight": 0, "reps": 10}, {"exerciseName": "Lat Pulldown (Wide Grip)", "muscleGroup": "back", "setNumber": 1, "weight": 0, "reps": 10}, {"exerciseName": "Lat Pulldown (Wide Grip)", "muscleGroup": "back", "setNumber": 2, "weight": 0, "reps": 10}, {"exerciseName": "Lat Pulldown (Wide Grip)", "muscleGroup": "back", "setNumber": 3, "weight": 0, "reps": 10}, {"exerciseName": "Dumbbell Bicep Curl", "muscleGroup": "biceps", "setNumber": 1, "weight": 0, "reps": 12}, {"exerciseName": "Dumbbell Bicep Curl", "muscleGroup": "biceps", "setNumber": 2, "weight": 0, "reps": 12}, {"exerciseName": "Triceps Pushdown (Rope)", "muscleGroup": "triceps", "setNumber": 1, "weight": 0, "reps": 12}, {"exerciseName": "Triceps Pushdown (Rope)", "muscleGroup": "triceps", "setNumber": 2, "weight": 0, "reps": 12}]}, {"name": "Lower", "items": [{"exerciseName": "Barbell Back Squat", "muscleGroup": "quads", "setNumber": 1, "weight": 0, "reps": 6}, {"exerciseName": "Barbell Back Squat", "muscleGroup": "quads", "setNumber": 2, "weight": 0, "reps": 6}, {"exerciseName": "Barbell Back Squat", "muscleGroup": "quads", "setNumber": 3, "weight": 0, "reps": 6}, {"exerciseName": "Romanian Deadlift (Barbell)", "muscleGroup": "hamstrings", "setNumber": 1, "weight": 0, "reps": 8}, {"exerciseName": "Romanian Deadlift (Barbell)", "muscleGroup": "hamstrings", "setNumber": 2, "weight": 0, "reps": 8}, {"exerciseName": "Romanian Deadlift (Barbell)", "muscleGroup": "hamstrings", "setNumber": 3, "weight": 0, "reps": 8}, {"exerciseName": "Bulgarian Split Squat (Dumbbell)", "muscleGroup": "quads", "setNumber": 1, "weight": 0, "reps": 10}, {"exerciseName": "Bulgarian Split Squat (Dumbbell)", "muscleGroup": "quads", "setNumber": 2, "weight": 0, "reps": 10}, {"exerciseName": "Bulgarian Split Squat (Dumbbell)", "muscleGroup": "quads", "setNumber": 3, "weight": 0, "reps": 10}, {"exerciseName": "Seated Leg Curl (Machine)", "muscleGroup": "hamstrings", "setNumber": 1, "weight": 0, "reps": 12}, {"exerciseName": "Seated Leg Curl (Machine)", "muscleGroup": "hamstrings", "setNumber": 2, "weight": 0, "reps": 12}, {"exerciseName": "Seated Leg Curl (Machine)", "muscleGroup": "hamstrings", "setNumber": 3, "weight": 0, "reps": 12}, {"exerciseName": "Standing Calf Raise (Machine)", "muscleGroup": "calves", "setNumber": 1, "weight": 0, "reps": 15}, {"exerciseName": "Standing Calf Raise (Machine)", "muscleGroup": "calves", "setNumber": 2, "weight": 0, "reps": 15}, {"exerciseName": "Standing Calf Raise (Machine)", "muscleGroup": "calves", "setNumber": 3, "weight": 0, "reps": 15}, {"exerciseName": "Hanging Leg Raise", "muscleGroup": "abs", "setNumber": 1, "weight": 0, "reps": 12}, {"exerciseName": "Hanging Leg Raise", "muscleGroup": "abs", "setNumber": 2, "weight": 0, "reps": 12}, {"exerciseName": "Hanging Leg Raise", "muscleGroup": "abs", "setNumber": 3, "weight": 0, "reps": 12}]}]'::jsonb,
            clock_timestamp());
  end if;
end $$;
