-- Incremental addition: Plazma biscuit variants + Serbian feta cheese brands.
-- Values sourced from product labels via keepitfit.rs and dnevnikishrane.com (label-derived databases).
-- Safe to run once on a database that already has seed_foods.sql applied.
-- Note: plain "Bambi Plazma keks" already exists in seed_foods_serbian_stores.sql (430/11/68/12) -
-- this file adds the other Plazma variants, plus real branded feta cheeses (none existed yet;
-- the "Fetaks, Mlekara Šabac" row in seed_foods_serbian_stores.sql was a rough estimate, kept as-is).

insert into foods (user_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, common_servings) values
-- Plazma variants (Bambi)
(null, 'Bambi Coko Plazma keks (čokoladom preliven)', 462.9, 10.3, 67.4, 16.9, '[{"label":"3 keksa (25g)","grams":25},{"label":"1 pakovanje (150g)","grams":150}]'),
(null, 'Bambi Plazma Mini keks', 443, 11.9, 70.4, 12, '[{"label":"1 kesica (35g)","grams":35},{"label":"1 pakovanje (200g)","grams":200}]'),
(null, 'Bambi Plazma Diet keks', 481, 11, 69, 12, '[{"label":"3 keksa (25g)","grams":25},{"label":"1 pakovanje (300g)","grams":300}]'),

-- Feta cheese, Serbian brands
(null, 'President Somborska feta sir (Somboled)', 220, 13.5, 2.2, 17.5, '[{"label":"1 kocka (30g)","grams":30},{"label":"1 pakovanje (270g)","grams":270}]'),
(null, 'Feta Šabačka, Mlekara Šabac', 197, 11.8, 2.6, 15.5, '[{"label":"1 kocka (30g)","grams":30},{"label":"1 pakovanje (400g)","grams":400}]'),
(null, 'Grekos feta sir, Mlekara Subotica', 183, 11, 2, 14.5, '[{"label":"1 kocka (30g)","grams":30},{"label":"1 pakovanje (200g)","grams":200}]');
