-- FitLog catch-up: applies every migration the live database was found to be missing on
-- 2026-09-17 (v9, v13, v14, v15, v16, v17, v17b, v18), in one go.
-- Idempotent - safe to run even if some of these were already applied. Paste the whole file
-- into the Supabase SQL editor and run it once.

-- v9: push notification subscriptions
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
drop policy if exists "own push subscriptions" on push_subscriptions;
create policy "own push subscriptions" on push_subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- v13: haptics toggle
alter table user_settings
  add column if not exists haptics_enabled boolean not null default true;

-- v14: rest days
create table if not exists rest_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
alter table rest_days enable row level security;
drop policy if exists "rest_days_owner" on rest_days;
create policy "rest_days_owner" on rest_days for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- v15: client error logs (insert-only from the client)
create table if not exists error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  stack text,
  url text,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table error_logs enable row level security;
drop policy if exists "error_logs_insert" on error_logs;
create policy "error_logs_insert" on error_logs for insert
  with check (auth.uid() is not null and (user_id is null or user_id = auth.uid()));

-- v16: body measurements
create table if not exists body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  waist_cm numeric,
  chest_cm numeric,
  arms_cm numeric,
  hips_cm numeric,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
alter table body_measurements enable row level security;
drop policy if exists "own body measurements" on body_measurements;
create policy "own body measurements" on body_measurements for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- v17: meal photos + private bucket
alter table meals add column if not exists photo_path text;
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;
drop policy if exists "read own meal photos" on storage.objects;
create policy "read own meal photos" on storage.objects for select
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "upload own meal photos" on storage.objects;
create policy "upload own meal photos" on storage.objects for insert
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "delete own meal photos" on storage.objects;
create policy "delete own meal photos" on storage.objects for delete
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- v17b: cached barcode lookups
alter table foods add column if not exists barcode text;
create index if not exists foods_barcode_idx on foods (barcode) where barcode is not null;

-- v18: supersets
alter table workout_sets add column if not exists superset_group integer;

-- Make PostgREST pick up the new tables/columns immediately.
notify pgrst, 'reload schema';
