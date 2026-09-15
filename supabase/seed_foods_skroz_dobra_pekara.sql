-- Incremental addition: Skroz Dobra Pekara products (Serbian bakery brand).
-- Safe to run once seed_foods.sql is applied.
-- Skroz Dobra Pekara is a large Serbian bakery chain (family company founded 1999,
-- HQ/roots in Belgrade, 70+ locations across Serbia including Novi Sad, Vrbas, Čačak),
-- selling fresh bread, pastries, pies, sandwiches, pizza and desserts. Values below are
-- taken from real, user-submitted nutrition labels for this exact brand on keepitfit.rs
-- (a Serbian nutrition-tracking database), matched to specific keepitfit.rs food entries
-- named after this brand's products. No fabricated/estimated values are included in this
-- file; only products with a verifiable label-derived entry were added. Common serving
-- weights are estimates (typical single-piece weight for that product type) since
-- keepitfit.rs only lists per-100g values.

insert into foods (user_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, common_servings) values
(null, 'Skroz Dobra Pekara Integralna kifla', 320.5, 9.9, 44.4, 10.9, '[{"label":"1 kifla (~70g)","grams":70}]'),
(null, 'Skroz Dobra Pekara Kifla zrno zdravlja', 280, 7.2, 54.2, 3.8, '[{"label":"1 kifla (~70g)","grams":70}]'),
(null, 'Skroz Dobra Pekara Fit beskvasni hleb', 270.8, 8.9, 42.2, 4.7, '[{"label":"1 kriška (~30g)","grams":30},{"label":"1 vekna (~400g)","grams":400}]'),
(null, 'Skroz Dobra Pekara Integralni pšenični hleb (po preporuci Ane Petrović)', 281.4, 6.2, 52.9, 5.0, '[{"label":"1 kriška (~30g)","grams":30},{"label":"1 vekna (~400g)","grams":400}]'),
(null, 'Skroz Dobra Pekara Hrono proja', 265.1, 8.0, 25.0, 14.1, '[{"label":"1 komad (~100g)","grams":100}]'),
(null, 'Skroz Dobra Pekara Kuvani djevrek', 273, 6.0, 49.0, 6.0, '[{"label":"1 djevrek (~80g)","grams":80}]'),
(null, 'Skroz Dobra Pekara Rol viršla', 414, 9.0, 39.0, 24.0, '[{"label":"1 komad (~100g)","grams":100}]'),
(null, 'Skroz Dobra Pekara Pitice sa jabukama i vanilom', 347.5, 0.2, 40.9, 18.8, '[{"label":"1 pitica (~60g)","grams":60}]');
