-- FitLog schema v25: fix the site_content write policy from v24. Safe to run more than once.
--
-- v24's policy compared auth.uid() to a subquery on auth.users. That table is off-limits to the
-- signed-in "authenticated" role, so every save from the admin page failed with "permission
-- denied", even for the right account. This looks up the owner's id once, here in the SQL
-- editor (which can read auth.users), and writes it into the policy as a fixed value.

do $$
declare
  owner_id uuid;
begin
  select id into owner_id from auth.users where email = 'msolarovsocial@gmail.com';
  if owner_id is null then
    raise exception 'No auth user with that email - nothing changed';
  end if;

  drop policy if exists "only the site owner can write" on site_content;
  execute format(
    'create policy "only the site owner can write" on site_content for all using (auth.uid() = %L::uuid) with check (auth.uid() = %L::uuid)',
    owner_id, owner_id
  );

  -- Lets the admin page ask "is the signed-in account the owner?" without putting the owner's
  -- email or id in the page's public source. Any other account is signed straight back out.
  execute format(
    'create or replace function public.is_site_owner() returns boolean language sql stable as $f$ select auth.uid() = %L::uuid $f$',
    owner_id
  );
end $$;

grant execute on function public.is_site_owner() to anon, authenticated;
