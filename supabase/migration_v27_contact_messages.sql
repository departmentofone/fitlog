-- FitLog schema v27: contact-form messages for the Department of One site (not FitLog itself).
-- Needs v25 first (uses is_site_owner()). Safe to run more than once.
--
-- Anyone can send a message (the form posts with the anon key); only the site owner can read,
-- mark or delete them, from the admin page. The check constraints are the real limits - the
-- form enforces the same ones, but anyone can post to the API directly.

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (char_length(btrim(subject)) between 1 and 200),
  email text not null check (char_length(email) <= 320 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message text not null check (char_length(btrim(message)) between 1 and 5000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_created_idx on contact_messages (created_at desc);

alter table contact_messages enable row level security;

drop policy if exists "anyone can send a message" on contact_messages;
create policy "anyone can send a message" on contact_messages
  for insert with check (is_read = false);

drop policy if exists "only the site owner can read messages" on contact_messages;
create policy "only the site owner can read messages" on contact_messages
  for select using (public.is_site_owner());

drop policy if exists "only the site owner can update messages" on contact_messages;
create policy "only the site owner can update messages" on contact_messages
  for update using (public.is_site_owner()) with check (public.is_site_owner());

drop policy if exists "only the site owner can delete messages" on contact_messages;
create policy "only the site owner can delete messages" on contact_messages
  for delete using (public.is_site_owner());

-- Editable intro line on the contact page.
insert into site_content (key, value) values
  ('contact_intro', 'Questions, bug reports, feature ideas, or just saying hi — it all lands in the same inbox, and I read every message.')
on conflict (key) do nothing;
