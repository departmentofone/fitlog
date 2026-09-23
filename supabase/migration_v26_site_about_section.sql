-- FitLog schema v26: text for the new "About" section on the Department of One site, so it can
-- be edited from the admin page like everything else. Needs v24 (site_content) first.
-- Safe to run more than once: an existing row (e.g. already edited) is left alone.

insert into site_content (key, value) values
  ('about_title', 'Why this exists'),
  ('about_body_1', 'I''ve always been inspired by the people behind The Pirate Bay. Not for the controversy, but for the idea underneath it: that a handful of people can build something genuinely useful and hand it to everyone for free, with nobody standing at the door asking for money.'),
  ('about_body_2', 'For a long time I didn''t know how I''d ever give back in a similar way. Building apps turned out to be the answer: tools anyone can use, free, for good, the way I always wished more software worked.')
on conflict (key) do nothing;
