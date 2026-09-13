-- Shared exercise library (user_id null = visible to every signed-in user).
-- Run after migration_v2.sql (which makes exercises.user_id nullable and adds the read policy).

insert into exercises (user_id, name, muscle_group) values
-- Chest
(null, 'Barbell Bench Press', 'chest'),
(null, 'Incline Barbell Bench Press', 'chest'),
(null, 'Decline Barbell Bench Press', 'chest'),
(null, 'Dumbbell Bench Press', 'chest'),
(null, 'Incline Dumbbell Press', 'chest'),
(null, 'Dumbbell Flyes', 'chest'),
(null, 'Cable Crossover (High-to-Low)', 'chest'),
(null, 'Cable Crossover (Low-to-High)', 'chest'),
(null, 'Machine Chest Press', 'chest'),
(null, 'Pec Deck Machine', 'chest'),
(null, 'Push-Up', 'chest'),
(null, 'Dips (Chest-Focused)', 'chest'),

-- Back
(null, 'Deadlift', 'back'),
(null, 'Barbell Row', 'back'),
(null, 'Pendlay Row', 'back'),
(null, 'T-Bar Row', 'back'),
(null, 'Dumbbell Row', 'back'),
(null, 'Lat Pulldown (Wide Grip)', 'back'),
(null, 'Lat Pulldown (Close Grip)', 'back'),
(null, 'Pull-Up', 'back'),
(null, 'Chin-Up', 'back'),
(null, 'Seated Cable Row', 'back'),
(null, 'Cable Row (V-Bar)', 'back'),
(null, 'Machine Row', 'back'),
(null, 'Straight-Arm Pulldown (Cable)', 'back'),
(null, 'Face Pull (Cable Rope)', 'back'),

-- Shoulders
(null, 'Overhead Barbell Press', 'shoulders'),
(null, 'Seated Dumbbell Shoulder Press', 'shoulders'),
(null, 'Arnold Press', 'shoulders'),
(null, 'Dumbbell Lateral Raise', 'shoulders'),
(null, 'Cable Lateral Raise', 'shoulders'),
(null, 'Dumbbell Front Raise', 'shoulders'),
(null, 'Machine Shoulder Press', 'shoulders'),
(null, 'Dumbbell Rear Delt Fly', 'shoulders'),
(null, 'Cable Rear Delt Fly', 'shoulders'),
(null, 'Barbell Upright Row', 'shoulders'),
(null, 'Barbell Shrug', 'shoulders'),
(null, 'Dumbbell Shrug', 'shoulders'),

-- Biceps
(null, 'Barbell Curl', 'biceps'),
(null, 'EZ-Bar Curl', 'biceps'),
(null, 'Dumbbell Bicep Curl', 'biceps'),
(null, 'Hammer Curl', 'biceps'),
(null, 'Incline Dumbbell Curl', 'biceps'),
(null, 'Preacher Curl (Barbell)', 'biceps'),
(null, 'Preacher Curl (Machine)', 'biceps'),
(null, 'Cable Curl (Straight Bar)', 'biceps'),
(null, 'Cable Curl (Rope Hammer)', 'biceps'),
(null, 'Concentration Curl', 'biceps'),
(null, 'Machine Bicep Curl', 'biceps'),

-- Triceps
(null, 'Close-Grip Bench Press', 'triceps'),
(null, 'Triceps Pushdown (Straight Bar)', 'triceps'),
(null, 'Triceps Pushdown (Rope)', 'triceps'),
(null, 'Overhead Triceps Extension (Dumbbell)', 'triceps'),
(null, 'Overhead Triceps Extension (Cable)', 'triceps'),
(null, 'Skull Crushers (EZ-Bar)', 'triceps'),
(null, 'Dips (Triceps-Focused)', 'triceps'),
(null, 'Machine Triceps Extension', 'triceps'),
(null, 'Cable Triceps Kickback', 'triceps'),

-- Forearms
(null, 'Barbell Wrist Curl', 'forearms'),
(null, 'Dumbbell Reverse Wrist Curl', 'forearms'),
(null, 'Cable Reverse Curl', 'forearms'),
(null, "Farmer's Carry", 'forearms'),

-- Abs
(null, 'Cable Crunch', 'abs'),
(null, 'Hanging Leg Raise', 'abs'),
(null, 'Machine Crunch', 'abs'),
(null, 'Sit-Up', 'abs'),
(null, 'Plank', 'abs'),
(null, 'Cable Woodchopper', 'abs'),
(null, 'Ab Wheel Rollout', 'abs'),

-- Quads
(null, 'Barbell Back Squat', 'quads'),
(null, 'Barbell Front Squat', 'quads'),
(null, 'Leg Press (Machine)', 'quads'),
(null, 'Hack Squat (Machine)', 'quads'),
(null, 'Dumbbell Lunge', 'quads'),
(null, 'Bulgarian Split Squat (Dumbbell)', 'quads'),
(null, 'Leg Extension (Machine)', 'quads'),
(null, 'Goblet Squat (Dumbbell)', 'quads'),

-- Hamstrings
(null, 'Romanian Deadlift (Barbell)', 'hamstrings'),
(null, 'Romanian Deadlift (Dumbbell)', 'hamstrings'),
(null, 'Lying Leg Curl (Machine)', 'hamstrings'),
(null, 'Seated Leg Curl (Machine)', 'hamstrings'),
(null, 'Good Morning (Barbell)', 'hamstrings'),
(null, 'Cable Pull-Through', 'hamstrings'),

-- Glutes
(null, 'Barbell Hip Thrust', 'glutes'),
(null, 'Cable Glute Kickback', 'glutes'),
(null, 'Machine Glute Kickback', 'glutes'),
(null, 'Sumo Deadlift', 'glutes'),
(null, 'Dumbbell Glute Bridge', 'glutes'),

-- Calves
(null, 'Standing Calf Raise (Machine)', 'calves'),
(null, 'Seated Calf Raise (Machine)', 'calves'),
(null, 'Leg Press Calf Raise', 'calves'),
(null, 'Dumbbell Calf Raise', 'calves'),

-- Cardio
(null, 'Treadmill Run', 'cardio'),
(null, 'Stationary Bike', 'cardio'),
(null, 'Rowing Machine', 'cardio'),
(null, 'StairMaster', 'cardio'),
(null, 'Jump Rope', 'cardio'),
(null, 'Elliptical', 'cardio');
