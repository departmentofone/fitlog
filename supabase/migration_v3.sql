-- FitLog schema v3: units preference, progress photo entries + private storage bucket.
-- Paste into the Supabase SQL editor and run once.

alter table user_settings
  add column if not exists unit_system text not null default 'metric' check (unit_system in ('metric', 'imperial'));

create table progress_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  weight numeric,
  notes text,
  photo_path text,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table progress_entries enable row level security;
create policy "own progress entries" on progress_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private bucket for progress photos, one folder per user (path: <user_id>/<filename>)
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy "read own progress photos" on storage.objects for select
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "upload own progress photos" on storage.objects for insert
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own progress photos" on storage.objects for delete
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
