-- FitLog schema v8: customizable bottom nav bar (Workouts/Meals pinned, up to
-- 2 extra shortcuts chosen in Settings). Paste into the Supabase SQL editor and run once.

alter table user_settings add column if not exists bottom_nav_tabs text[] not null default '{}';
