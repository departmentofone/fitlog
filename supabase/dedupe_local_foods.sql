-- Removes duplicate rows created by pasting seed_foods_local.sql twice.
-- Keeps the lowest-id copy of each named item; repoints any meal_items that
-- reference a duplicate to the kept row first, then deletes the duplicates.

with groups as (
  select distinct on (name) name, id as keeper_id
  from foods
  where user_id is null
    and name in (
      'Dukat tečni jogurt (drinking yogurt)',
      'Grekos High Protein jogurt',
      'LIDL Skyr, prirodni (plain)',
      'LIDL Skyr, vanila/voće (flavored)',
      'Kajmak',
      'Ajvar',
      'Kačkavalj',
      'Beli sir (domaći/sremski)',
      'Ćevapi, pečeni',
      'Pljeskavica, pečena',
      'Burek sa mesom',
      'Somun / lepinja',
      'Proja (kukuruzni hleb)',
      'Sremski kulen'
    )
  order by name, id
),
losers as (
  select f.id as loser_id, g.keeper_id
  from foods f
  join groups g on f.name = g.name
  where f.user_id is null and f.id <> g.keeper_id
)
update meal_items
set food_id = losers.keeper_id
from losers
where meal_items.food_id = losers.loser_id;

with groups as (
  select distinct on (name) name, id as keeper_id
  from foods
  where user_id is null
    and name in (
      'Dukat tečni jogurt (drinking yogurt)',
      'Grekos High Protein jogurt',
      'LIDL Skyr, prirodni (plain)',
      'LIDL Skyr, vanila/voće (flavored)',
      'Kajmak',
      'Ajvar',
      'Kačkavalj',
      'Beli sir (domaći/sremski)',
      'Ćevapi, pečeni',
      'Pljeskavica, pečena',
      'Burek sa mesom',
      'Somun / lepinja',
      'Proja (kukuruzni hleb)',
      'Sremski kulen'
    )
  order by name, id
)
delete from foods f
using groups g
where f.user_id is null and f.name = g.name and f.id <> g.keeper_id;
