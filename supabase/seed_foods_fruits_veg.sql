-- Incremental addition: more fruits and vegetables (peaches, nectarines, etc).
-- Safe to run once on a database that already has the base seed_foods.sql applied.

insert into foods (user_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, common_servings) values
(null, 'Peach', 39, 0.9, 10, 0.3, '[{"label":"1 medium","grams":150}]'),
(null, 'Nectarine', 44, 1.1, 10.6, 0.3, '[{"label":"1 medium","grams":140}]'),
(null, 'Pear', 57, 0.4, 15, 0.1, '[{"label":"1 medium","grams":178}]'),
(null, 'Watermelon', 30, 0.6, 8, 0.2, '[{"label":"1 cup diced","grams":152}]'),
(null, 'Cantaloupe / melon', 34, 0.8, 8, 0.2, '[{"label":"1 cup diced","grams":160}]'),
(null, 'Kiwi', 61, 1.1, 15, 0.5, '[{"label":"1 medium","grams":76}]'),
(null, 'Mango', 60, 0.8, 15, 0.4, '[{"label":"1 cup sliced","grams":165}]'),
(null, 'Pineapple', 50, 0.5, 13, 0.1, '[{"label":"1 cup chunks","grams":165}]'),
(null, 'Plum', 46, 0.7, 11, 0.3, '[{"label":"1 medium","grams":66}]'),
(null, 'Cherries', 63, 1.1, 16, 0.2, '[{"label":"1 cup","grams":154}]'),
(null, 'Pomegranate (arils)', 83, 1.7, 19, 1.2, '[{"label":"1/2 cup arils","grams":87}]'),
(null, 'Fig, fresh', 74, 0.8, 19, 0.3, '[{"label":"1 medium","grams":50}]'),
(null, 'Apricot', 48, 1.4, 11, 0.4, '[{"label":"1 medium","grams":35}]'),
(null, 'Raspberries', 52, 1.2, 12, 0.7, '[{"label":"1 cup","grams":123}]'),
(null, 'Blackberries', 43, 1.4, 10, 0.5, '[{"label":"1 cup","grams":144}]'),
(null, 'Grapefruit', 42, 0.8, 11, 0.1, '[{"label":"1/2 medium","grams":123}]'),
(null, 'Green peas', 81, 5.4, 14, 0.4, '[{"label":"1 cup","grams":160}]'),
(null, 'Radish', 16, 0.7, 3.4, 0.1, '[{"label":"1 cup sliced","grams":116}]'),
(null, 'Beet', 43, 1.6, 10, 0.2, '[{"label":"1 medium","grams":82}]'),
(null, 'Cabbage', 25, 1.3, 6, 0.1, '[{"label":"1 cup shredded","grams":89}]'),
(null, 'Brussels sprouts', 43, 3.4, 9, 0.3, '[{"label":"1 cup","grams":88}]'),
(null, 'Eggplant', 25, 1, 6, 0.2, '[{"label":"1 cup cubed","grams":82}]'),
(null, 'Celery', 16, 0.7, 3, 0.2, '[{"label":"1 stalk","grams":40}]'),
(null, 'Pumpkin', 26, 1, 6.5, 0.1, '[{"label":"1 cup cubed","grams":116}]'),
(null, 'Garlic', 149, 6.4, 33, 0.5, '[{"label":"1 clove","grams":3}]');
