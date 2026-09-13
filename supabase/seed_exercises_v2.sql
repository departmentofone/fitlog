-- New exercises: adductor/abductor machines (leg day staples that were missing) plus a
-- few other commonly-missed leg/shoulder exercises. Run AFTER migration_v4.sql.

insert into exercises (user_id, name, muscle_group) values
(null, 'Hip Adductor Machine', 'adductors'),
(null, 'Cable Hip Adduction', 'adductors'),
(null, 'Hip Abductor Machine', 'abductors'),
(null, 'Cable Hip Abduction', 'abductors'),
(null, 'Smith Machine Squat', 'quads'),
(null, 'Walking Lunge (Dumbbell)', 'quads'),
(null, 'Step-Up (Dumbbell)', 'quads'),
(null, 'Machine Lateral Raise', 'shoulders');
