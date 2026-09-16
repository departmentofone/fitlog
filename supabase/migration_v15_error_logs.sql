-- Lightweight client-side error logging - lets you find out about a real bug before your friend
-- has to tell you. Safe to run once.

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

-- Any signed-in user can write a log row (including for errors that happen before we know their
-- final auth state), but never read anyone else's - or their own, from the client. Read them
-- from the Supabase dashboard/SQL editor instead.
create policy "error_logs_insert" on error_logs
  for insert
  with check (auth.uid() is not null and (user_id is null or user_id = auth.uid()));
