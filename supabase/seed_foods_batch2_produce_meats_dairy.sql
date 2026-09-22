-- Second big batch for the shared food library: fills real gaps found by checking what's already
-- in seed_foods.sql / seed_foods_fruits_veg.sql / seed_foods_global_staples_DO_NOT_RUN_YET.sql
-- (already quite thorough for common produce, meat cuts and dairy) against vegetables, fruits,
-- condiments/spreads, cheeses, meats (fresh and processed), and dairy. Two things drove what's
-- here specifically:
--   1. Plain global versions of things that ONLY existed as Serbian-branded products before
--      migration_v23 moved that pack private (salami, prosciutto, pesto, tartar sauce, mustard,
--      hot dogs) - those categories had zero generic entry left in the shared library.
--   2. Common produce/cheese/dairy items not already covered, picked for how likely they are to
--      actually get searched for, not an attempt at total botanical completeness.
-- Values are standard per-100g reference figures (USDA-style), approximate like the rest of the
-- library. Idempotent: safe to run more than once, safe alongside every other seed file.

insert into foods (user_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, common_servings)
select v.user_id, v.name, v.calories_per_100g, v.protein_per_100g, v.carbs_per_100g, v.fat_per_100g, v.common_servings::jsonb
from (values

-- === Vegetables ===
(null::uuid, 'Red cabbage', 31, 1.4, 7.4, 0.2, '[{"label":"1 cup shredded","grams":89}]'),
(null, 'Napa cabbage', 16, 1.2, 3.2, 0.2, '[{"label":"1 cup shredded","grams":76}]'),
(null, 'Watercress', 11, 2.3, 1.3, 0.1, '[{"label":"1 cup","grams":34}]'),
(null, 'Daikon radish', 18, 0.6, 4.1, 0.1, '[{"label":"1 cup, sliced","grams":116}]'),
(null, 'Kohlrabi, raw', 27, 1.7, 6.2, 0.1, '[{"label":"1 cup, chopped","grams":135}]'),
(null, 'Rutabaga, cooked', 35, 1.1, 8, 0.2, '[{"label":"1 cup, cubed","grams":170}]'),
(null, 'Shallot, raw', 72, 2.5, 16.8, 0.1, '[{"label":"1 shallot","grams":25}]'),
(null, 'Chives, raw', 30, 3.3, 4.4, 0.7, '[{"label":"1 tbsp, chopped","grams":3}]'),
(null, 'Jicama, raw', 38, 0.7, 8.8, 0.1, '[{"label":"1 cup, sliced","grams":120}]'),
(null, 'Endive, raw', 17, 1.3, 3.4, 0.2, '[{"label":"1 cup, chopped","grams":50}]'),
(null, 'Water chestnuts, canned', 97, 1.4, 24, 0.1, '[{"label":"1/2 cup, sliced","grams":70}]'),
(null, 'Chili pepper, red/green', 40, 1.9, 8.8, 0.4, '[{"label":"1 pepper","grams":18}]'),

-- === Fruits ===
(null, 'Honeydew melon', 36, 0.5, 9.1, 0.1, '[{"label":"1 cup, diced","grams":170}]'),
(null, 'Star fruit (carambola)', 31, 1, 6.7, 0.3, '[{"label":"1 fruit","grams":91}]'),
(null, 'Dragon fruit (pitaya)', 60, 1.2, 13, 0.4, '[{"label":"1 cup, diced","grams":227}]'),
(null, 'Rhubarb, raw', 21, 0.9, 4.5, 0.2, '[{"label":"1 cup, diced","grams":122}]'),
(null, 'Currants, raw', 56, 1.4, 13.8, 0.2, '[{"label":"1/2 cup","grams":56}]'),
(null, 'Mulberries, raw', 43, 1.4, 9.8, 0.4, '[{"label":"1 cup","grams":140}]'),
(null, 'Clementine', 47, 0.85, 12, 0.15, '[{"label":"1 clementine","grams":74}]'),
(null, 'Jackfruit, raw', 95, 1.7, 23.2, 0.6, '[{"label":"1 cup, sliced","grams":165}]'),
(null, 'Kumquat', 71, 1.9, 15.9, 0.9, '[{"label":"1 kumquat","grams":19}]'),

-- === Condiments & spreads ===
(null, 'Pesto sauce, basil', 303, 4, 4.5, 30, '[{"label":"1 tbsp","grams":16},{"label":"1 tsp","grams":5.3}]'),
(null, 'Tartar sauce', 300, 0.6, 6, 31, '[{"label":"1 tbsp","grams":14}]'),
(null, 'Guacamole', 155, 2, 9, 14, '[{"label":"2 tbsp","grams":30}]'),
(null, 'Tzatziki', 85, 3.5, 4, 6.5, '[{"label":"2 tbsp","grams":30}]'),
(null, 'Marinara / pasta sauce', 29, 1.3, 5.5, 0.4, '[{"label":"1/2 cup","grams":125}]'),
(null, 'Alfredo sauce', 150, 3, 6, 13, '[{"label":"1/4 cup","grams":60}]'),
(null, 'Yellow mustard', 60, 3.7, 5.8, 3.3, '[{"label":"1 tsp","grams":5}]'),
(null, 'Honey mustard', 178, 1.5, 27, 6.8, '[{"label":"1 tbsp","grams":17}]'),
(null, 'Horseradish, prepared', 48, 1.2, 11.3, 0.7, '[{"label":"1 tsp","grams":5}]'),
(null, 'Cocktail sauce', 108, 1, 26, 0.2, '[{"label":"2 tbsp","grams":30}]'),
(null, 'Buffalo sauce', 15, 0.5, 2, 1, '[{"label":"1 tbsp","grams":15}]'),
(null, 'Chimichurri', 380, 1, 3, 40, '[{"label":"1 tbsp","grams":14}]'),
(null, 'Sweet chili sauce', 152, 0.6, 37, 0.1, '[{"label":"1 tbsp","grams":18}]'),

-- === Cheeses ===
(null, 'Gruyère cheese', 413, 29.8, 0.4, 32.3, '[{"label":"1 slice (28g)","grams":28}]'),
(null, 'Camembert cheese', 300, 19.8, 0.5, 24.3, '[{"label":"1 wedge (28g)","grams":28}]'),
(null, 'Monterey Jack cheese', 373, 24.5, 0.7, 30.3, '[{"label":"1 slice (28g)","grams":28}]'),
(null, 'Colby cheese', 394, 23.8, 2.6, 32.1, '[{"label":"1 slice (28g)","grams":28}]'),
(null, 'American cheese, processed slices', 371, 16.8, 8.7, 31, '[{"label":"1 slice (21g)","grams":21}]'),
(null, 'String cheese / mozzarella stick', 296, 24, 3, 21, '[{"label":"1 stick (28g)","grams":28}]'),
(null, 'Queso fresco', 264, 15.5, 3.2, 21, '[{"label":"1/4 cup, crumbled","grams":38}]'),
(null, 'Manchego cheese', 400, 26, 0, 32, '[{"label":"1 slice (28g)","grams":28}]'),
(null, 'Ricotta cheese, whole milk', 174, 11.3, 3, 13, '[{"label":"1/4 cup","grams":62}]'),
(null, 'Burrata cheese', 300, 15, 3, 25, '[{"label":"1 oz (28g)","grams":28}]'),

-- === Meats: fresh/raw ===
(null, 'Beef brisket, cooked', 258, 26, 0, 17, '[]'),
(null, 'Beef short ribs, cooked', 295, 24, 0, 22, '[]'),
(null, 'Veal cutlet, cooked', 196, 31, 0, 7, '[]'),
(null, 'Chicken liver, cooked', 172, 24.5, 0.9, 6.5, '[]'),
(null, 'Pork belly, cooked', 518, 9.3, 0, 53, '[]'),
(null, 'Rabbit, cooked', 173, 33, 0, 3.5, '[]'),
(null, 'Venison, cooked', 158, 30, 0, 3.2, '[]'),
(null, 'Rotisserie chicken, dark meat (with skin)', 220, 24, 0, 13, '[]'),

-- === Meats: processed ===
(null, 'Hot dog / frankfurter', 290, 10.4, 4.3, 26.1, '[{"label":"1 hot dog (45g)","grams":45}]'),
(null, 'Pepperoni', 494, 23, 1.2, 44, '[{"label":"15 slices (28g)","grams":28}]'),
(null, 'Salami', 336, 22, 1, 26, '[{"label":"3 slices (30g)","grams":30}]'),
(null, 'Prosciutto / dry-cured ham', 195, 25, 0, 10, '[{"label":"2 slices (20g)","grams":20}]'),
(null, 'Corned beef, cooked', 251, 18.9, 0.5, 19, '[]'),
(null, 'Pastrami', 147, 21, 1, 6, '[{"label":"3 slices (60g)","grams":60}]'),
(null, 'Chorizo, cooked', 455, 24, 2.6, 38, '[]'),
(null, 'Bologna', 310, 12, 3, 27.5, '[{"label":"1 slice (28g)","grams":28}]'),
(null, 'Beef jerky', 410, 33, 11, 25, '[{"label":"1 oz (28g)","grams":28}]'),
(null, 'Canadian bacon', 145, 22, 1.5, 5.8, '[{"label":"2 slices (46g)","grams":46}]'),
(null, 'Breakfast sausage links, cooked', 330, 16, 3, 28, '[{"label":"2 links (48g)","grams":48}]'),

-- === Dairy ===
(null, 'Evaporated milk, canned', 134, 6.8, 10, 7.6, '[{"label":"1/4 cup","grams":63}]'),
(null, 'Sweetened condensed milk', 321, 7.9, 54.4, 8.7, '[{"label":"2 tbsp","grams":38}]'),
(null, 'Milk, 1% low fat', 42, 3.4, 5, 1, '[{"label":"1 cup (240ml)","grams":244}]'),
(null, 'Lactose-free milk, 2%', 50, 3.3, 5, 2, '[{"label":"1 cup (240ml)","grams":244}]'),
(null, 'Powdered milk, nonfat, dry', 362, 36, 52, 0.8, '[{"label":"1/4 cup dry","grams":30}]'),
(null, 'Ice cream, vanilla', 207, 3.5, 24, 11, '[{"label":"1/2 cup","grams":66}]'),
(null, 'Frozen yogurt, vanilla', 159, 4, 24, 6, '[{"label":"1/2 cup","grams":72}]')

) as v(user_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, common_servings)
where not exists (
  select 1 from foods f where f.user_id is null and f.name = v.name
);
