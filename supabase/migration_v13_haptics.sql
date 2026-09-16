-- Adds the haptics/motion feedback toggle (Settings > Motion & Haptics), default on.
-- Safe to run once. The app itself treats a missing column as "on" via a fallback in code,
-- so nothing breaks if this hasn't been run yet - but run it so the setting actually persists.

alter table user_settings
  add column if not exists haptics_enabled boolean not null default true;
