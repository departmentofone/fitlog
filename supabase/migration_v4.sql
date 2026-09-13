-- FitLog schema v4: meal finalize/collapse, micronutrients, adductor/abductor muscle groups.
-- Paste into the Supabase SQL editor and run once.
-- NOTE: run this file by itself first (the new enum values below can't be used in the
-- same transaction they're created in) — the exercises that use them come in a separate file.

alter table meals add column if not exists completed boolean not null default false;

alter table foods add column if not exists fiber_g numeric not null default 0;
alter table foods add column if not exists sugar_g numeric not null default 0;
alter table foods add column if not exists sodium_mg numeric not null default 0;
alter table foods add column if not exists cholesterol_mg numeric not null default 0;
alter table foods add column if not exists potassium_mg numeric not null default 0;
alter table foods add column if not exists calcium_mg numeric not null default 0;
alter table foods add column if not exists iron_mg numeric not null default 0;
alter table foods add column if not exists vitamin_c_mg numeric not null default 0;
alter table foods add column if not exists vitamin_a_mcg numeric not null default 0;

alter type muscle_group add value if not exists 'adductors';
alter type muscle_group add value if not exists 'abductors';
