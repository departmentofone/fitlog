-- Incremental addition: Serbia-local dairy brands and classic dishes.
-- Safe to run once on a database that already has the base seed_foods.sql applied.

insert into foods (user_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, common_servings) values
(null, 'Dukat tečni jogurt (drinking yogurt)', 56, 3.2, 4.7, 2.8, '[{"label":"1 čaša (250ml)","grams":250},{"label":"1 kesica (500ml)","grams":500}]'),
(null, 'Grekos High Protein jogurt', 67, 10, 4.5, 0.2, '[{"label":"1 čašica (150g)","grams":150}]'),
(null, 'LIDL Skyr, prirodni (plain)', 63, 11, 4, 0.2, '[{"label":"1 čašica (150g)","grams":150},{"label":"1 kofica (450g)","grams":450}]'),
(null, 'LIDL Skyr, vanila/voće (flavored)', 88, 9, 11, 0.3, '[{"label":"1 čašica (150g)","grams":150}]'),
(null, 'Kajmak', 452, 7.5, 2, 47, '[{"label":"1 kašika","grams":20}]'),
(null, 'Ajvar', 132, 1.6, 8, 10, '[{"label":"1 kašika","grams":20}]'),
(null, 'Kačkavalj', 340, 25, 1.5, 26, '[{"label":"1 kriška","grams":30}]'),
(null, 'Beli sir (domaći/sremski)', 260, 18, 2, 20, '[{"label":"1 kriška","grams":30}]'),
(null, 'Ćevapi, pečeni', 250, 19, 2, 18, '[{"label":"1 ćevap","grams":30}]'),
(null, 'Pljeskavica, pečena', 230, 18, 1, 17, '[{"label":"1 pljeskavica","grams":150}]'),
(null, 'Burek sa mesom', 290, 10, 24, 18, '[{"label":"1 parče","grams":150}]'),
(null, 'Somun / lepinja', 275, 9, 52, 3, '[{"label":"1 komad","grams":150}]'),
(null, 'Proja (kukuruzni hleb)', 280, 7, 35, 12, '[{"label":"1 parče","grams":80}]'),
(null, 'Sremski kulen', 450, 20, 1, 40, '[{"label":"1 kriška","grams":15}]');
