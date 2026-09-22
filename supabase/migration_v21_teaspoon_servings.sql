-- FitLog v21: teaspoon servings for foods that are usually measured in small amounts.
-- A teaspoon is a third of a tablespoon, so each tsp serving is the food's own tbsp grams / 3.
-- Oils, fats, soy sauce, vinegars etc. get the teaspoon FIRST, which makes it the default amount
-- when you add them (the amount picker starts on the first serving); spreads, sweeteners and seeds
-- keep tablespoon as the default and get teaspoon as a second option. Tablespoon stays everywhere.
-- Safe to run more than once: a food that already has a teaspoon serving is skipped.

update foods set common_servings = '[{"label":"1 tsp","grams":4.7}]'::jsonb || common_servings
 where user_id is null and name = 'Olive oil'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":4.7}]'::jsonb || common_servings
 where user_id is null and name = 'Avocado oil'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":4.7}]'::jsonb || common_servings
 where user_id is null and name = 'Canola oil'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":4.7}]'::jsonb || common_servings
 where user_id is null and name = 'Coconut oil'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":4.7}]'::jsonb || common_servings
 where user_id is null and name = 'Sesame oil'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":4.7}]'::jsonb || common_servings
 where user_id is null and name = 'Sunflower oil'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":4.7}]'::jsonb || common_servings
 where user_id is null and name = 'Vegetable oil (soybean/canola blend)'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":4.7}]'::jsonb || common_servings
 where user_id is null and name = 'Butter'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":4.3}]'::jsonb || common_servings
 where user_id is null and name = 'Ghee (clarified butter)'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":4.3}]'::jsonb || common_servings
 where user_id is null and name = 'Lard'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":4.7}]'::jsonb || common_servings
 where user_id is null and name = 'Margarine'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":6}]'::jsonb || common_servings
 where user_id is null and name = 'Soy sauce'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":5.7}]'::jsonb || common_servings
 where user_id is null and name = 'Worcestershire sauce'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":6}]'::jsonb || common_servings
 where user_id is null and name = 'Teriyaki sauce'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":5}]'::jsonb || common_servings
 where user_id is null and name = 'Apple cider vinegar'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":5.3}]'::jsonb || common_servings
 where user_id is null and name = 'Balsamic vinegar'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":3}]'::jsonb || common_servings
 where user_id is null and name = 'Sesame seeds'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":2}]'::jsonb || common_servings
 where user_id is null and name = 'Ginger, raw'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp, grated","grams":1.7}]'::jsonb || common_servings
 where user_id is null and name = 'Parmesan cheese, hard'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":5}]'::jsonb || common_servings
 where user_id is null and name = 'Heavy cream'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = '[{"label":"1 tsp","grams":5}]'::jsonb || common_servings
 where user_id is null and name = 'Half and half'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = common_servings || '[{"label":"1 tsp","grams":7}]'::jsonb
 where user_id is null and name = 'Honey'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = common_servings || '[{"label":"1 tsp","grams":6.7}]'::jsonb
 where user_id is null and name = 'Maple syrup'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = common_servings || '[{"label":"1 tsp","grams":7}]'::jsonb
 where user_id is null and name = 'Agave nectar'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = common_servings || '[{"label":"1 tsp","grams":6.7}]'::jsonb
 where user_id is null and name = 'Jam / fruit preserves'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = common_servings || '[{"label":"1 tsp","grams":5.3}]'::jsonb
 where user_id is null and name = 'Peanut butter'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = common_servings || '[{"label":"1 tsp","grams":5.3}]'::jsonb
 where user_id is null and name = 'Almond butter'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = common_servings || '[{"label":"1 tsp","grams":5}]'::jsonb
 where user_id is null and name = 'Tahini'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = common_servings || '[{"label":"1 tsp","grams":4.7}]'::jsonb
 where user_id is null and name = 'Mayonnaise'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = common_servings || '[{"label":"1 tsp","grams":5.7}]'::jsonb
 where user_id is null and name = 'Ketchup'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = common_servings || '[{"label":"1 tsp","grams":4}]'::jsonb
 where user_id is null and name = 'Chia seeds'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = common_servings || '[{"label":"1 tsp","grams":2.3}]'::jsonb
 where user_id is null and name = 'Flaxseed, ground'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = common_servings || '[{"label":"1 tsp","grams":3.3}]'::jsonb
 where user_id is null and name = 'Hemp seeds'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');

update foods set common_servings = common_servings || '[{"label":"1 kašičica (5g)","grams":5}]'::jsonb
 where user_id is null and name = 'Pesto sos, bosiljak (basil pesto)'
   and not exists (select 1 from jsonb_array_elements(common_servings) s where s->>'label' ilike '%tsp%' or s->>'label' ilike '%kašičica%');
