-- FitLog schema v17: optional photo attachments on logged meals + private storage bucket.
-- Mirrors the progress-photos setup from migration_v3.sql.
-- Paste into the Supabase SQL editor and run once.

alter table meals add column if not exists photo_path text;

-- Private bucket for meal photos, one folder per user (path: <user_id>/<filename>)
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do nothing;

create policy "read own meal photos" on storage.objects for select
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "upload own meal photos" on storage.objects for insert
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own meal photos" on storage.objects for delete
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
