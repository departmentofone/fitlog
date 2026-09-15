-- Incremental addition: everyday/convenience products (drinks, candy, ice cream, condiments,
-- ready meals) from Serbian grocery chains - filling the gap from the first pass, which
-- skewed toward health-conscious items. Safe to run once seed_foods.sql is applied.
-- Values sourced from product labels via keepitfit.rs, openfoodfacts.org and manufacturer
-- data where available; rows marked "estimate" use a reasonable typical value because a
-- specific label value could not be verified online.

insert into foods (user_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, common_servings) values
-- Beverages
(null, 'Coca-Cola', 42, 0, 10.6, 0, '[{"label":"1 čaša (250ml)","grams":250},{"label":"1 limenka (330ml)","grams":330},{"label":"1 flaša (500ml)","grams":500}]'),
(null, 'Coca-Cola Zero', 0.3, 0, 0, 0, '[{"label":"1 čaša (250ml)","grams":250},{"label":"1 limenka (330ml)","grams":330},{"label":"1 flaša (500ml)","grams":500}]'),
(null, 'Fanta Pomorandža (orange soda)', 45, 0, 11, 0, '[{"label":"1 limenka (330ml)","grams":330},{"label":"1 flaša (500ml)","grams":500}]'), -- estimate: label figures vary 39-57 kcal across regional Fanta batches, used typical European mid-range value
(null, 'Sprite', 41, 0, 10.5, 0, '[{"label":"1 limenka (330ml)","grams":330},{"label":"1 flaša (500ml)","grams":500}]'), -- estimate: European-market Sprite label figure, US labels differ slightly
(null, 'Sprite Zero', 0.3, 0, 0, 0, '[{"label":"1 limenka (330ml)","grams":330},{"label":"1 flaša (500ml)","grams":500}]'),
(null, 'Schweppes Indian Tonic Water', 37, 0, 8.9, 0, '[{"label":"1 limenka (250ml)","grams":250},{"label":"1 flaša (1L)","grams":1000}]'),
(null, 'Knjaz Miloš, gazirana prirodna mineralna voda', 0, 0, 0, 0, '[{"label":"1 flaša (0.33L)","grams":330},{"label":"1 flaša (0.5L)","grams":500},{"label":"1 flaša (1.5L)","grams":1500}]'),
(null, 'Rosa, negazirana prirodna izvorska voda', 0, 0, 0, 0, '[{"label":"1 flaša (0.33L)","grams":330},{"label":"1 flaša (0.5L)","grams":500},{"label":"1 flaša (1.5L)","grams":1500}]'),
(null, 'Vrnjci Voda, prirodna mineralna voda', 0, 0, 0, 0, '[{"label":"1 flaša (0.5L)","grams":500},{"label":"1 flaša (1.5L)","grams":1500}]'), -- estimate: natural still mineral water, same profile as other Serbian bottled spring waters
(null, 'Nectar voćni sok/nektar, pomorandža', 47, 0.5, 11.7, 0.1, '[{"label":"1 čašica (200ml)","grams":200},{"label":"1 kutija (1L)","grams":1000}]'),
(null, 'Next negazirano voćno piće', 40, 0.2, 9.8, 0, '[{"label":"1 čaša (250ml)","grams":250},{"label":"1 kutija (1L)","grams":1000}]'), -- estimate: Nectar Group's lower-fruit-content "still fruit drink" line, no published label found, used typical fruit-drink value
(null, 'Cockta', 42, 0, 10.4, 0, '[{"label":"1 čaša (250ml)","grams":250},{"label":"1 flaša (500ml)","grams":500}]'), -- estimate: search sources disagreed (44-110 kcal); used typical cola-style soft drink value consistent with its sugar content
(null, 'Guarana, gazirano voćno piće', 45, 0, 11, 0, '[{"label":"1 limenka (250ml)","grams":250},{"label":"1 flaša (500ml)","grams":500}]'), -- estimate: typical guarana-flavored Balkan soda value, specific brand label not verified
(null, 'Red Bull energy drink', 45, 0.5, 11, 0, '[{"label":"1 limenka (250ml)","grams":250}]'),

-- Candy & chocolate
(null, 'Milka mlečna čokolada, alpsko mleko (milk chocolate)', 534, 6.5, 58, 30, '[{"label":"1 kockica (5g)","grams":5},{"label":"1 tablica (100g)","grams":100}]'),
(null, 'Kinder Bueno', 568, 8.4, 50, 37, '[{"label":"1 bar (43g)","grams":43},{"label":"pakovanje, 2 bara (86g)","grams":86}]'),
(null, 'Kinder Chocolate', 568, 8.8, 53.6, 35.2, '[{"label":"1 pločica (12.5g)","grams":12.5},{"label":"pakovanje, 8 pločica (100g)","grams":100}]'),
(null, 'Kinder Surprise / Kinder Joy', 552, 8.1, 52.3, 34.2, '[{"label":"1 jaje (20g)","grams":20}]'),
(null, 'Snickers', 491, 7.5, 61.5, 23.9, '[{"label":"1 bar (50g)","grams":50},{"label":"1 mini bar (18g)","grams":18}]'),
(null, 'Twix', 502, 4.9, 64.8, 24.9, '[{"label":"1 dupli bar (50g)","grams":50}]'), -- partial estimate: protein figure not published for this exact SKU, typical caramel-cookie-bar protein value used
(null, 'Mars', 449, 4, 68.5, 17.5, '[{"label":"1 bar (51g)","grams":51}]'),
(null, 'Bajadera, Kraš', 549, 8, 54, 32, '[{"label":"1 komad (15g)","grams":15},{"label":"1 kutija (350g)","grams":350}]'),
(null, 'Štark "Najlepše želje" mlečna čokolada', 540, 9, 54, 32, '[{"label":"1 kockica (10g)","grams":10},{"label":"1 tablica (80g)","grams":80}]'),
(null, 'Gumene bombone (gummy candy)', 340, 5.5, 77.5, 2, '[{"label":"1 šaka (30g)","grams":30},{"label":"1 kesica (80g)","grams":80}]'), -- estimate: generic gummy-candy average across Serbian brands (gelatin-based), specific brand label not verified

-- Ice cream (Frikom)
(null, 'Frikom Šatorka / Kapri sladoled (chocolate-coated cone)', 243, 3.1, 27.7, 13.8, '[{"label":"1 komad (65g)","grams":65}]'), -- estimate: scaled to 100g from a comparable Frikom chocolate-coated cone item, exact Šatorka label not verified
(null, 'Frikom Ekvador sladoled (chocolate-coated ice cream bar)', 260, 3, 24, 17, '[{"label":"1 komad (70g)","grams":70}]'), -- estimate: typical chocolate-coated vanilla ice cream bar values, specific label not found
(null, 'Frikom Kornet, vanila (wafer cone ice cream)', 220, 3.5, 30, 9, '[{"label":"1 kornet (120g)","grams":120}]'), -- estimate: typical wafer-cone vanilla ice cream values, specific label not found
(null, 'Frikom sladoled, porodično pakovanje, vanila (tub ice cream)', 177, 2.9, 20, 9.4, '[{"label":"1 kuglica (60g)","grams":60},{"label":"1/8 kutije (100g)","grams":100}]'),

-- Condiments & seasoning
(null, 'Vegeta, dodatak jelima (all-purpose seasoning)', 164, 8.5, 21, 2, '[{"label":"1 kašičica (5g)","grams":5},{"label":"1 kašika (10g)","grams":10}]'),
(null, 'Senf (mustard, Zdravo!/Kelly''s stil)', 60, 4, 8, 3, '[{"label":"1 kašičica (5g)","grams":5},{"label":"1 porcija za hot dog (10g)","grams":10}]'), -- estimate: generic prepared-mustard values, specific Zdravo!/Kelly's label not verified
(null, 'Pesto sos, bosiljak (basil pesto)', 475, 5, 6, 47, '[{"label":"1 kašika (15g)","grams":15}]'),
(null, 'Tartar sos (tartar sauce)', 211, 1, 13, 17, '[{"label":"1 kašika (15g)","grams":15}]'), -- estimate: generic tartar sauce values, specific Serbian-market brand not verified
(null, 'Preliv za salatu, francuski/vinaigrette stil (salad dressing)', 320, 0.5, 10, 32, '[{"label":"1 kašika (15g)","grams":15}]'), -- estimate: typical creamy vinaigrette-style bottled dressing sold in Serbian stores

-- Ready meals / frozen convenience
(null, 'Smrznuta pizza, Dr. Oetker Ristorante stil', 257, 9.2, 24, 13.3, '[{"label":"1/4 pizze (100g)","grams":100},{"label":"cela pizza (~350g)","grams":350}]'),
(null, 'Podravka instant supa, pileća (dry, per suvo pakovanje)', 380, 8, 55, 14, '[{"label":"1 kesica, suvo (38g)","grams":38}]'), -- estimate: typical dry instant-soup-powder values, specific Podravka SKU label not verified
(null, 'Podravka Đuveč, konzervirano gotovo jelo', 85, 2, 14, 2, '[{"label":"1 konzerva (380g)","grams":380},{"label":"1 porcija (200g)","grams":200}]'), -- estimate: typical canned vegetable-tomato ready-meal values, exact label not verified
(null, 'Sardine u ulju, konzervirane (canned sardines in oil)', 220, 20, 0, 15, '[{"label":"1 konzerva (120g)","grams":120}]'), -- estimate: mid-range of typical canned-sardines-in-oil values (label figures range 200-260 kcal by brand)
(null, 'Tuna u ulju, konzervirana, ocedjena (canned tuna in oil, drained)', 198, 29, 0, 8.2, '[{"label":"1 konzerva, ocedjena (80g)","grams":80}]'),
(null, 'Podravka crveni pasulj, konzerviran (canned red beans, ready to eat)', 90, 5, 14, 1, '[{"label":"1 konzerva (400g)","grams":400},{"label":"1 porcija (200g)","grams":200}]'), -- estimate: typical canned ready-to-eat bean stew values, exact label not verified

-- Fast-food-style & bakery indulgence
(null, 'Doner/gyro sendvič (mixed meat, lepinja, sos, salata)', 220, 12, 20, 11, '[{"label":"1 porcija/sendvič (300g)","grams":300}]'), -- estimate: composite of meat, bread, sauce and salad, actual value varies widely by vendor
(null, 'Parče pice, mešano (generic pizza slice)', 250, 11, 31, 10, '[{"label":"1 parče (100g)","grams":100}]'), -- estimate: mid-range of typical pizzeria-slice values across common toppings
(null, 'Burek sa sirom (cheese burek)', 300, 9, 21, 20, '[{"label":"1 parče (150g)","grams":150}]');
