-- FitLog schema v23: make the Serbian pack private to one account instead of a public opt-in pack.
-- Safe to run more than once.
--
-- The Serbian pack from migration_v22 lived in the shared library (`user_id` null) and was only
-- ever gated by an opt-in toggle - meaning ANY current or future account could turn it on and see
-- it. That's not what was wanted: these are the account owner's own regional groceries, not
-- something to offer every FitLog user. This reassigns those ~118 foods to be owned by that one
-- account, which the existing "read foods" RLS policy already keeps fully private
-- (`user_id is null or user_id = auth.uid()`) - no new mechanism needed. They stay fully usable:
-- logged into meals, edited, and added to presets exactly like any other food you own, and a food
-- from this set only becomes visible to anyone else if a preset containing it is deliberately
-- marked "Shared with friend" - the same opt-in sharing every other custom food already has.
--
-- Only safe to run once nobody else has used these foods yet (true today: the app isn't public,
-- and no other account had a reason to search for Serbian-branded products). Running against a
-- database where someone else has already logged one of these would reassign a food out from
-- under their log - fine here, but worth knowing if this file is ever reused as a template.
--
-- Adds a personal "Serbian" label on each of them first (while `pack` still says 'serbia', before
-- it's cleared) so they stay easy to find and filter in the Foods tab.

insert into food_labels (user_id, food_id, label)
select (select id from auth.users where email = 'msolarovsocial@gmail.com'), id, 'Serbian'
  from foods
 where pack = 'serbia'
   and not exists (
     select 1 from food_labels l
      where l.food_id = foods.id
        and l.user_id = (select id from auth.users where email = 'msolarovsocial@gmail.com')
        and l.label = 'Serbian'
   );

update foods
   set user_id = (select id from auth.users where email = 'msolarovsocial@gmail.com'),
       pack = null
 where pack = 'serbia';
