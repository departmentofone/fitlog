-- Push-up, pull-up, dip, and crunch variations - the base movements (Push-Up, Pull-Up,
-- Chin-Up, Dips (Chest/Triceps-Focused), Cable Crunch, Machine Crunch) already exist from
-- earlier seeds; these are the variations that were missing. Run whenever, no dependency
-- on other seed files.

insert into exercises (user_id, name, muscle_group) values
(null, 'Wide-Grip Push-Up', 'chest'),
(null, 'Diamond Push-Up', 'triceps'),
(null, 'Incline Push-Up', 'chest'),
(null, 'Decline Push-Up', 'chest'),
(null, 'Archer Push-Up', 'chest'),
(null, 'Pike Push-Up', 'shoulders'),
(null, 'Clap Push-Up', 'chest'),
(null, 'Hindu Push-Up', 'chest'),
(null, 'One-Arm Push-Up', 'chest'),
(null, 'Knee Push-Up', 'chest'),
(null, 'Wide-Grip Pull-Up', 'back'),
(null, 'Close-Grip Pull-Up', 'back'),
(null, 'Neutral-Grip Pull-Up', 'back'),
(null, 'Commando Pull-Up', 'back'),
(null, 'L-Sit Pull-Up', 'back'),
(null, 'Weighted Pull-Up', 'back'),
(null, 'Archer Pull-Up', 'back'),
(null, 'Ring Dip', 'chest'),
(null, 'Bench Dip', 'triceps'),
(null, 'Weighted Dip (Chest-Focused)', 'chest'),
(null, 'Weighted Dip (Triceps-Focused)', 'triceps'),
(null, 'Bicycle Crunch', 'abs'),
(null, 'Reverse Crunch', 'abs'),
(null, 'V-Up', 'abs'),
(null, 'Sit-Up', 'abs'),
(null, 'Hanging Leg Raise', 'abs'),
(null, 'Weighted Crunch', 'abs');
