-- FitLog schema v24: NOT part of FitLog itself - a tiny content store for the separate
-- "Department of One" portfolio site (department-of-one.vercel.app), reusing this Supabase
-- project by choice so its admin page can sign in with the same account instead of a new one.
-- Safe to run more than once.
--
-- One row per editable text field on the site (hero heading, principle card copy, footer
-- tagline, etc). The site's own JS reads every row with the anon key at page load; only the
-- account below can write, checked by user id (not just "any authenticated FitLog user" -
-- this project also has real FitLog testers signed in, who must NOT be able to edit the site).

create table if not exists site_content (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

drop policy if exists "anyone can read site content" on site_content;
create policy "anyone can read site content" on site_content
  for select using (true);

drop policy if exists "only the site owner can write" on site_content;
create policy "only the site owner can write" on site_content
  for all
  using (auth.uid() = (select id from auth.users where email = 'msolarovsocial@gmail.com'))
  with check (auth.uid() = (select id from auth.users where email = 'msolarovsocial@gmail.com'));

-- Seed with the site's current copy, so the admin page has something to load and edit, and the
-- site keeps working exactly as it does today even before anything is ever edited.
insert into site_content (key, value) values
  ('hero_eyebrow', 'Currently a team of one'),
  ('hero_title_pre', 'Software built by'),
  ('hero_title_em', 'exactly'),
  ('hero_title_post', 'one person.'),
  ('hero_lede', 'No team, no roadmap meetings, no growth targets to hit — just apps I actually wanted to use, made free for everyone else too.'),
  ('principle_1_title', 'Free, always'),
  ('principle_1_desc', 'No premium tier, no paywalls, no feature held hostage. If it ships, everyone gets it.'),
  ('principle_2_title', 'No dark patterns'),
  ('principle_2_desc', 'No manipulative upsells, no fake urgency, no tricking anyone into a subscription.'),
  ('principle_3_title', 'Privacy by default'),
  ('principle_3_desc', 'Your data is yours. No ad trackers, no selling data, delete your account any time.'),
  ('principle_4_title', 'Built solo, shipped for real'),
  ('principle_4_desc', 'One person writing, testing, and maintaining every line — not a placeholder side-project.'),
  ('fitlog_desc', 'A workout log, meal & macro tracker, and fasting timer in one free app. Built because the alternatives were bloated, ad-choked, or locked half their features behind a paywall.'),
  ('more_soon_text', 'Next thing''s already in the oven — check back soon.'),
  ('footer_tagline', 'A one-person software studio. Small, free, and built to last.')
on conflict (key) do nothing;
