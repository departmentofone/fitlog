-- Incremental addition: suhomesnato (dry-cured/smoked meat) products.
-- Values are approximate per 100g. Safe to run once on a database that already has seed_foods.sql applied.

insert into foods (user_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, common_servings) values
(null, 'Pršut (dry-cured ham)', 250, 28, 0, 15, '[{"label":"1 kriška","grams":15}]'),
(null, 'Goveđi pršut (dry-cured beef)', 190, 34, 0, 5, '[{"label":"1 kriška","grams":15}]'),
(null, 'Suva vešalica', 300, 30, 0, 20, '[{"label":"1 kriška","grams":15}]'),
(null, 'Stara kolenica (dimljena)', 320, 27, 0, 24, '[{"label":"1 kriška","grams":20}]'),
(null, 'Pečenica (dry-cured pork loin)', 200, 32, 0, 8, '[{"label":"1 kriška","grams":15}]'),
(null, 'Slanina, suva (cured pork fat)', 665, 9, 0, 69, '[{"label":"1 kriška","grams":10}]'),
(null, 'Čvarci (pork cracklings)', 600, 15, 0, 60, '[{"label":"1 kašika","grams":15}]'),
(null, 'Sudžuk', 450, 24, 1, 38, '[{"label":"1 kriška","grams":15}]'),
(null, 'Domaća kobasica, suva', 430, 22, 1, 37, '[{"label":"1 kriška","grams":15}]'),
(null, 'Zimska salama', 400, 20, 1, 35, '[{"label":"1 kriška","grams":15}]');
