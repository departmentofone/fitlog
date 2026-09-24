-- v30: new accounts start with the preworkout question switched off, and each account remembers its
-- time zone so future stats ("average gym time", "usual breakfast time") can read created_at in local
-- time. Existing accounts keep their current preworkout choice. Safe to run more than once.

-- 1. Preworkout question off by default (only affects settings rows created from now on).
alter table public.user_settings alter column ask_preworkout set default false;

-- 2. The phone's IANA time zone (e.g. 'Europe/Belgrade'), kept up to date by the app.
alter table public.user_settings add column if not exists timezone text;
