-- FitLog schema v10: muscle subgroups (lats/traps/lower back, front/side/rear delts,
-- upper/lower chest) so you can log exactly what you targeted, not just the broad region.
-- Paste into the Supabase SQL editor and run once. Each statement below must run on its
-- own (not wrapped together with other changes in one transaction) - that's already how
-- this file is laid out, just don't combine it with anything else when pasting.

alter type muscle_group add value if not exists 'lats';
alter type muscle_group add value if not exists 'traps';
alter type muscle_group add value if not exists 'lower_back';
alter type muscle_group add value if not exists 'front_delts';
alter type muscle_group add value if not exists 'side_delts';
alter type muscle_group add value if not exists 'rear_delts';
alter type muscle_group add value if not exists 'upper_chest';
alter type muscle_group add value if not exists 'lower_chest';
