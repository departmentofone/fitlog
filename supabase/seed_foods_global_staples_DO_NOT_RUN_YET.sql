-- DO NOT RUN YET. Draft seed file staged for the Android/Play Store launch data import.
-- Do not execute this against any database and do not wire it into any migration runner
-- until the launch data-import step explicitly calls for it.
--
-- Global staple foods: the generic, brand-agnostic items every diet-tracking app needs
-- (proteins, carb staples, dairy, fats/oils, produce, nuts/seeds, and a handful of
-- near-universal packaged condiments) for a broad international Play Store audience.
-- Values are per 100g, sourced from USDA FoodData Central (fdc.nal.usda.gov) figures
-- where a specific match exists, otherwise a well-established typical value for that
-- food/product category (marked "estimate"). Checked against known reference points
-- (e.g. olive oil ~884 kcal/100g, chicken breast cooked ~165 kcal/31g protein/100g)
-- before finalizing. Cross-checked against seed_foods.sql, seed_foods_fruits_veg.sql,
-- seed_foods_local.sql, seed_foods_suhomesnato.sql, seed_foods_serbian_stores.sql,
-- seed_foods_serbian_everyday.sql and seed_foods_skroz_dobra_pekara.sql to avoid
-- duplicating items already in the library.

insert into foods (user_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, common_servings) values
-- Poultry
(null, 'Chicken breast, raw (skinless, boneless)', 120, 22.5, 0, 2.6, '[{"label":"1 breast","grams":174}]'),
(null, 'Chicken thigh, raw (skinless, boneless)', 116, 19.5, 0, 3.4, '[{"label":"1 thigh","grams":110}]'),
(null, 'Chicken drumstick, cooked', 172, 28.3, 0, 5.7, '[{"label":"1 drumstick","grams":60}]'),
(null, 'Chicken wing, cooked', 203, 30.5, 0, 8.1, '[{"label":"1 wing","grams":30}]'),
(null, 'Ground chicken, cooked', 187, 25, 0, 9.3, '[{"label":"1 cup crumbled","grams":140}]'),
(null, 'Turkey, ground, 93% lean, cooked', 176, 21.7, 0, 9, '[{"label":"1 patty (4 oz)","grams":113}]'),
(null, 'Turkey, ground, 99% lean, cooked', 114, 25, 0, 1, '[{"label":"1 patty (4 oz)","grams":113}]'),
(null, 'Duck breast, cooked (skinless)', 201, 23.5, 0, 11.2, '[{"label":"1 breast","grams":185}]'),

-- Beef
(null, 'Beef sirloin steak, cooked', 183, 29, 0, 6.5, '[{"label":"1 steak (6 oz)","grams":170}]'),
(null, 'Beef tenderloin (filet mignon), cooked', 220, 26, 0, 12, '[{"label":"1 filet (6 oz)","grams":170}]'),
(null, 'Beef ribeye steak, cooked', 291, 24, 0, 21, '[{"label":"1 steak (8 oz)","grams":225}]'),
(null, 'Beef flank steak, cooked', 192, 28, 0, 7.9, '[{"label":"100g","grams":100}]'),
(null, 'Beef liver, cooked', 175, 26, 3.9, 4.9, '[{"label":"100g","grams":100}]'), -- estimate: pan-fried beef liver, typical USDA-range value
(null, 'Ground beef, 85% lean, raw', 215, 17.2, 0, 15.8, '[{"label":"100g","grams":100}]'),

-- Pork
(null, 'Pork chop, cooked (bone-in)', 231, 26, 0, 14, '[{"label":"1 chop","grams":145}]'),
(null, 'Pork tenderloin, cooked', 143, 26, 0, 3.5, '[{"label":"100g","grams":100}]'),
(null, 'Ground pork, cooked', 297, 25, 0, 21, '[{"label":"100g","grams":100}]'),
(null, 'Bacon, pan-fried', 541, 37, 1.4, 42, '[{"label":"1 slice, cooked","grams":8}]'),
(null, 'Ham, deli slices (cooked)', 145, 21, 1.5, 5.5, '[{"label":"2 slices","grams":56}]'), -- estimate: typical cooked deli ham
(null, 'Pork sausage, cooked', 325, 19, 1, 27, '[{"label":"1 link","grams":68}]'), -- estimate: typical fresh pork breakfast sausage, cooked

-- Lamb
(null, 'Lamb, ground, cooked', 282, 24.5, 0, 20, '[{"label":"100g","grams":100}]'),
(null, 'Lamb chop, cooked', 294, 25, 0, 21, '[{"label":"1 chop","grams":100}]'),

-- Fish & seafood
(null, 'Cod, cooked', 105, 23, 0, 0.9, '[{"label":"1 fillet","grams":180}]'),
(null, 'Tilapia, cooked', 128, 26, 0, 2.7, '[{"label":"1 fillet","grams":110}]'),
(null, 'Halibut, cooked', 140, 27, 0, 2.9, '[{"label":"100g","grams":100}]'),
(null, 'Trout, cooked', 168, 23.8, 0, 7.2, '[{"label":"1 fillet","grams":140}]'),
(null, 'Shrimp, raw', 85, 20.3, 0.2, 0.5, '[{"label":"100g","grams":100}]'),
(null, 'Crab meat, cooked', 87, 18, 0, 1.1, '[{"label":"100g","grams":100}]'),
(null, 'Mussels, cooked', 172, 23.8, 7.4, 4.5, '[{"label":"100g","grams":100}]'),
(null, 'Scallops, cooked', 111, 20.5, 5.4, 0.8, '[{"label":"100g","grams":100}]'),
(null, 'Anchovies, canned in oil, drained', 210, 28.9, 0, 10.5, '[{"label":"5 fillets","grams":20}]'),

-- Eggs
(null, 'Egg yolk', 322, 16, 3.6, 27, '[{"label":"1 large yolk","grams":17}]'),
(null, 'Duck egg', 185, 13, 1, 14, '[{"label":"1 egg","grams":70}]'),
(null, 'Quail egg', 158, 13, 0.4, 11, '[{"label":"1 egg","grams":9}]'),

-- Legumes & plant protein
(null, 'Edamame, cooked', 122, 11, 10, 5, '[{"label":"1 cup","grams":155}]'),
(null, 'Kidney beans, cooked', 127, 8.7, 22.8, 0.5, '[{"label":"1 cup","grams":177}]'),
(null, 'Pinto beans, cooked', 143, 9, 26, 0.7, '[{"label":"1 cup","grams":171}]'),
(null, 'Navy beans, cooked', 140, 8.2, 26, 0.6, '[{"label":"1 cup","grams":182}]'),
(null, 'Black-eyed peas, cooked', 116, 7.7, 20.8, 0.5, '[{"label":"1 cup","grams":172}]'),
(null, 'Lima beans, cooked', 115, 7, 21, 0.4, '[{"label":"1 cup","grams":170}]'),
(null, 'Split peas, cooked', 118, 8.3, 21, 0.4, '[{"label":"1 cup","grams":196}]'),
(null, 'Soybeans, cooked', 173, 16.6, 9.9, 9, '[{"label":"1 cup","grams":172}]'),
(null, 'Seitan', 120, 21, 4, 2, '[{"label":"100g","grams":100}]'), -- estimate: prepared/hydrated wheat gluten, values vary by brand
(null, 'Tofu, silken', 55, 5.5, 2, 2.5, '[{"label":"100g","grams":100}]'),
(null, 'TVP (textured vegetable protein), dry', 366, 51, 33, 3.3, '[{"label":"1/4 cup dry","grams":24}]'),

-- Milk & dairy beverages
(null, 'Milk, 2% reduced fat', 50, 3.3, 4.8, 2, '[{"label":"1 cup","grams":244}]'),
(null, 'Milk, chocolate, low fat', 83, 3.2, 13, 1, '[{"label":"1 cup","grams":250}]'),
(null, 'Buttermilk, low fat', 40, 3.3, 4.8, 1, '[{"label":"1 cup","grams":245}]'),
(null, 'Kefir, plain, low fat', 41, 3.4, 4.8, 1, '[{"label":"1 cup","grams":245}]'),
(null, 'Almond milk, unsweetened', 15, 0.6, 0.6, 1.2, '[{"label":"1 cup","grams":240}]'),
(null, 'Soy milk, unsweetened', 33, 3.3, 1.8, 1.8, '[{"label":"1 cup","grams":240}]'),
(null, 'Oat milk, unsweetened', 47, 1, 7.5, 1.5, '[{"label":"1 cup","grams":240}]'), -- estimate: generic unsweetened oat milk, brands vary roughly 40-60 kcal/100g
(null, 'Coconut milk, canned (full fat)', 230, 2.3, 5.5, 24, '[{"label":"1/4 cup","grams":60}]'),

-- Cream & cultured dairy
(null, 'Heavy cream', 340, 2.1, 2.8, 36, '[{"label":"1 tbsp","grams":15}]'),
(null, 'Half and half', 131, 3, 4.3, 11.5, '[{"label":"1 tbsp","grams":15}]'),
(null, 'Sour cream, full fat', 198, 2.4, 4.6, 20, '[{"label":"1 tbsp","grams":12}]'),
(null, 'Whipped cream', 257, 2.1, 3, 26, '[{"label":"2 tbsp","grams":15}]'),

-- Cheese
(null, 'Parmesan cheese, hard', 392, 35.8, 3.2, 25.8, '[{"label":"1 tbsp, grated","grams":5}]'),
(null, 'Swiss cheese', 380, 27, 5.4, 28, '[{"label":"1 slice","grams":28}]'),
(null, 'Feta cheese', 264, 14, 4, 21, '[{"label":"1/4 cup crumbled","grams":38}]'),
(null, 'Brie cheese', 334, 21, 0.5, 28, '[{"label":"1 oz","grams":28}]'),
(null, 'Cream cheese', 342, 6, 4, 34, '[{"label":"1 tbsp","grams":14}]'),
(null, 'Blue cheese', 353, 21, 2.3, 29, '[{"label":"1 oz","grams":28}]'),
(null, 'Provolone cheese', 351, 26, 2.1, 27, '[{"label":"1 slice","grams":28}]'),
(null, 'Halloumi cheese', 320, 24, 2, 25, '[{"label":"100g","grams":100}]'), -- estimate: label figures range roughly 313-393 kcal by brand
(null, 'Paneer', 300, 19, 1.5, 24, '[{"label":"100g","grams":100}]'), -- estimate: full-fat paneer, label figures range roughly 296-321 kcal by brand
(null, 'Goat cheese, soft', 364, 21.6, 0, 30, '[{"label":"1 oz","grams":28}]'),
(null, 'Ricotta cheese, part-skim', 138, 11, 5, 8, '[{"label":"1/2 cup","grams":124}]'),
(null, 'Cottage cheese, full fat (4%)', 98, 11, 3.4, 4.3, '[{"label":"1 cup","grams":226}]'),
(null, 'Labneh', 150, 6, 4, 10, '[{"label":"2 tbsp","grams":30}]'), -- estimate: strained yogurt cheese, label figures vary roughly 90-170 kcal by brand/straining

-- Yogurt
(null, 'Yogurt, plain, low fat', 63, 5.3, 7, 1.6, '[{"label":"1 cup","grams":245}]'),
(null, 'Yogurt, plain, whole milk', 61, 3.5, 4.7, 3.3, '[{"label":"1 cup","grams":245}]'),
(null, 'Yogurt, vanilla, low fat', 105, 4, 19, 1.3, '[{"label":"1 cup","grams":245}]'),

-- Rice & whole grains
(null, 'White rice, raw', 365, 7.1, 80, 0.7, '[{"label":"1/4 cup dry","grams":47}]'),
(null, 'Jasmine rice, cooked', 129, 2.7, 28, 0.2, '[{"label":"1 cup","grams":158}]'),
(null, 'Basmati rice, cooked', 121, 3.5, 25, 0.4, '[{"label":"1 cup","grams":158}]'),
(null, 'Brown rice, raw', 370, 7.9, 77, 2.9, '[{"label":"1/4 cup dry","grams":46}]'),
(null, 'Wild rice, cooked', 101, 4, 21, 0.3, '[{"label":"1 cup","grams":164}]'),
(null, 'Quinoa, raw', 368, 14, 64, 6, '[{"label":"1/4 cup dry","grams":43}]'),
(null, 'Couscous, cooked', 112, 3.8, 23, 0.2, '[{"label":"1 cup","grams":157}]'),
(null, 'Bulgur, cooked', 83, 3.1, 19, 0.2, '[{"label":"1 cup","grams":182}]'),
(null, 'Barley, cooked (pearled)', 123, 2.3, 28, 0.4, '[{"label":"1 cup","grams":157}]'),
(null, 'Buckwheat groats, cooked', 92, 3.4, 20, 0.6, '[{"label":"1 cup","grams":168}]'),
(null, 'Farro, cooked', 170, 6, 34, 1.3, '[{"label":"1 cup","grams":194}]'), -- estimate: typical pearled farro, cooked
(null, 'Polenta / cornmeal mush, cooked', 70, 1.6, 15, 0.3, '[{"label":"1 cup","grams":245}]'),
(null, 'Grits, cooked', 60, 1.4, 13, 0.2, '[{"label":"1 cup","grams":242}]'),
(null, 'Oats, cooked (oatmeal, water)', 71, 2.5, 12, 1.5, '[{"label":"1 cup","grams":234}]'),
(null, 'Steel-cut oats, dry', 379, 13, 67, 6.5, '[{"label":"1/4 cup dry","grams":40}]'),
(null, 'Cream of wheat, dry', 366, 10, 77, 1.3, '[{"label":"3 tbsp dry","grams":28}]'),
(null, 'Granola, plain', 471, 10, 64, 20, '[{"label":"1/2 cup","grams":55}]'), -- estimate: generic plain granola, varies by brand
(null, 'Muesli', 362, 10, 66, 6, '[{"label":"1/2 cup","grams":45}]'), -- estimate: generic muesli, varies by brand

-- Pasta & noodles
(null, 'Whole wheat pasta, cooked', 124, 5.3, 26.5, 1.1, '[{"label":"1 cup","grams":140}]'),
(null, 'Rice noodles, cooked', 109, 1.8, 25, 0.2, '[{"label":"1 cup","grams":176}]'),
(null, 'Soba noodles, cooked', 99, 5.1, 21, 0.1, '[{"label":"1 cup","grams":114}]'),
(null, 'Egg noodles, cooked', 138, 4.5, 25, 2.1, '[{"label":"1 cup","grams":160}]'),

-- Bread & baked staples
(null, 'Bread, sourdough', 289, 11.4, 56, 1.5, '[{"label":"1 slice","grams":35}]'),
(null, 'Bread, rye', 259, 8.5, 48, 3.3, '[{"label":"1 slice","grams":32}]'),
(null, 'Bread, multigrain', 265, 13, 43, 3.5, '[{"label":"1 slice","grams":32}]'), -- estimate: typical multigrain sandwich bread
(null, 'Pita bread, white', 275, 9, 55, 1.2, '[{"label":"1 pita","grams":60}]'),
(null, 'Bagel, plain', 250, 10, 49, 1.5, '[{"label":"1 bagel","grams":95}]'),
(null, 'Tortilla, flour', 310, 8, 51, 7.5, '[{"label":"1 tortilla","grams":49}]'),
(null, 'Tortilla, corn', 218, 5.7, 44, 2.9, '[{"label":"1 tortilla","grams":26}]'),
(null, 'English muffin', 227, 8.2, 44, 1.8, '[{"label":"1 muffin","grams":57}]'),
(null, 'Naan bread', 310, 9, 50, 7, '[{"label":"1 naan","grams":90}]'), -- estimate: typical plain naan, varies by recipe
(null, 'Baguette', 274, 9, 55, 1.5, '[{"label":"1 slice","grams":30}]'),
(null, 'Crackers, saltine', 421, 9.5, 74, 10.6, '[{"label":"5 crackers","grams":15}]'),
(null, 'Graham crackers', 421, 7, 76, 11, '[{"label":"2 sheets","grams":28}]'),

-- Potatoes & starchy vegetables
(null, 'Potato, raw', 77, 2, 17, 0.1, '[{"label":"1 medium","grams":173}]'),
(null, 'Potato, boiled', 87, 1.9, 20, 0.1, '[{"label":"1 medium","grams":167}]'),
(null, 'Mashed potatoes (with milk & butter)', 113, 2, 17, 4.2, '[{"label":"1 cup","grams":210}]'), -- estimate: typical home-style mashed potatoes
(null, 'Sweet potato, raw', 86, 1.6, 20, 0.1, '[{"label":"1 medium","grams":130}]'),
(null, 'Yam, cooked', 116, 1.5, 27, 0.1, '[{"label":"1 cup cubed","grams":136}]'),
(null, 'Cassava, cooked', 160, 1.4, 38, 0.3, '[{"label":"1 cup","grams":206}]'),
(null, 'Plantain, cooked (boiled)', 116, 0.8, 31, 0.2, '[{"label":"1 cup","grams":154}]'),
(null, 'Taro, cooked', 112, 0.5, 26, 0.1, '[{"label":"1 cup","grams":132}]'),

-- Fats & oils
(null, 'Coconut oil', 862, 0, 0, 100, '[{"label":"1 tbsp","grams":14}]'),
(null, 'Vegetable oil (soybean/canola blend)', 884, 0, 0, 100, '[{"label":"1 tbsp","grams":14}]'),
(null, 'Canola oil', 884, 0, 0, 100, '[{"label":"1 tbsp","grams":14}]'),
(null, 'Sunflower oil', 884, 0, 0, 100, '[{"label":"1 tbsp","grams":14}]'),
(null, 'Avocado oil', 884, 0, 0, 100, '[{"label":"1 tbsp","grams":14}]'),
(null, 'Sesame oil', 884, 0, 0, 100, '[{"label":"1 tbsp","grams":14}]'),
(null, 'Margarine', 717, 0.2, 0.9, 80, '[{"label":"1 tbsp","grams":14}]'),
(null, 'Ghee (clarified butter)', 876, 0.3, 0, 99.5, '[{"label":"1 tbsp","grams":13}]'),
(null, 'Lard', 902, 0, 0, 100, '[{"label":"1 tbsp","grams":13}]'),
(null, 'Coconut, shredded, unsweetened', 660, 6.9, 24, 65, '[{"label":"1/4 cup","grams":20}]'),

-- Nuts & seeds
(null, 'Peanuts, raw', 567, 25.8, 16, 49, '[{"label":"1 oz","grams":28}]'),
(null, 'Pistachios', 560, 20, 28, 45, '[{"label":"1 oz","grams":28}]'),
(null, 'Pecans', 691, 9.2, 14, 72, '[{"label":"1 oz","grams":28}]'),
(null, 'Macadamia nuts', 718, 7.9, 14, 76, '[{"label":"1 oz","grams":28}]'),
(null, 'Brazil nuts', 656, 14.3, 12, 66, '[{"label":"1 oz","grams":28}]'),
(null, 'Hazelnuts', 628, 15, 17, 61, '[{"label":"1 oz","grams":28}]'),
(null, 'Pine nuts', 673, 14, 13, 68, '[{"label":"1 tbsp","grams":10}]'),
(null, 'Sunflower seeds', 584, 21, 20, 51, '[{"label":"1 oz","grams":28}]'),
(null, 'Pumpkin seeds (pepitas)', 559, 30, 11, 49, '[{"label":"1 oz","grams":28}]'),
(null, 'Sesame seeds', 573, 18, 23, 50, '[{"label":"1 tbsp","grams":9}]'),
(null, 'Hemp seeds', 553, 31, 8.7, 49, '[{"label":"3 tbsp","grams":30}]'),
(null, 'Tahini', 595, 17, 21, 54, '[{"label":"1 tbsp","grams":15}]'),
(null, 'Mixed nuts, roasted', 607, 20, 21, 54, '[{"label":"1 oz","grams":28}]'),
(null, 'Trail mix (nuts, seeds, dried fruit)', 462, 14, 43, 29, '[{"label":"1/4 cup","grams":35}]'), -- estimate: generic composition, varies widely by mix

-- Fruits
(null, 'Lemon', 29, 1.1, 9.3, 0.3, '[{"label":"1 medium","grams":58}]'),
(null, 'Lime', 30, 0.7, 11, 0.2, '[{"label":"1 medium","grams":67}]'),
(null, 'Tangerine / mandarin', 53, 0.8, 13.3, 0.3, '[{"label":"1 medium","grams":88}]'),
(null, 'Papaya', 43, 0.5, 11, 0.3, '[{"label":"1 cup cubed","grams":145}]'),
(null, 'Guava', 68, 2.6, 14, 0.5, '[{"label":"1 medium","grams":55}]'),
(null, 'Passion fruit', 97, 2.2, 23, 0.7, '[{"label":"1 medium","grams":18}]'),
(null, 'Lychee', 66, 0.8, 17, 0.4, '[{"label":"1 cup","grams":190}]'),
(null, 'Persimmon', 70, 0.6, 18.6, 0.2, '[{"label":"1 medium","grams":168}]'),
(null, 'Cranberries, raw', 46, 0.4, 12, 0.1, '[{"label":"1 cup","grams":100}]'),
(null, 'Dates, dried (Medjool)', 277, 1.8, 75, 0.2, '[{"label":"1 date","grams":24}]'),
(null, 'Raisins', 299, 3.1, 79, 0.5, '[{"label":"1/4 cup","grams":40}]'),
(null, 'Dried apricots', 241, 3.4, 63, 0.5, '[{"label":"1/4 cup","grams":33}]'),
(null, 'Prunes (dried plums)', 240, 2.2, 64, 0.4, '[{"label":"5 prunes","grams":42}]'),
(null, 'Dried figs', 249, 3.3, 64, 0.9, '[{"label":"2 figs","grams":40}]'),
(null, 'Cranberries, dried (sweetened)', 325, 0.1, 83, 1.1, '[{"label":"1/4 cup","grams":40}]'),
(null, 'Coconut, fresh meat', 354, 3.3, 15, 33, '[{"label":"1/2 cup shredded","grams":40}]'),

-- Vegetables
(null, 'Bok choy', 13, 1.5, 2.2, 0.2, '[{"label":"1 cup shredded","grams":70}]'),
(null, 'Leek', 61, 1.5, 14, 0.3, '[{"label":"1 cup chopped","grams":89}]'),
(null, 'Artichoke, cooked', 47, 3.3, 10.5, 0.2, '[{"label":"1 medium","grams":120}]'),
(null, 'Okra', 33, 1.9, 7.5, 0.2, '[{"label":"1 cup","grams":100}]'),
(null, 'Turnip', 28, 0.9, 6.4, 0.1, '[{"label":"1 cup cubed","grams":130}]'),
(null, 'Parsnip', 75, 1.2, 18, 0.3, '[{"label":"1 cup sliced","grams":133}]'),
(null, 'Butternut squash, cooked', 40, 0.9, 10.5, 0.1, '[{"label":"1 cup cubed","grams":205}]'),
(null, 'Snap peas / snow peas', 42, 2.8, 7.6, 0.2, '[{"label":"1 cup","grams":98}]'),
(null, 'Bean sprouts', 30, 3, 5.9, 0.2, '[{"label":"1 cup","grams":104}]'),
(null, 'Fennel bulb', 31, 1.2, 7.3, 0.2, '[{"label":"1 cup sliced","grams":87}]'),
(null, 'Swiss chard', 19, 1.8, 3.7, 0.2, '[{"label":"1 cup","grams":36}]'),
(null, 'Arugula', 25, 2.6, 3.7, 0.7, '[{"label":"1 cup","grams":20}]'),
(null, 'Collard greens', 32, 3, 5.4, 0.6, '[{"label":"1 cup chopped","grams":36}]'),
(null, 'Scallion / green onion', 32, 1.8, 7.3, 0.2, '[{"label":"1/4 cup chopped","grams":25}]'),
(null, 'Ginger, raw', 80, 1.8, 18, 0.8, '[{"label":"1 tbsp","grams":6}]'),
(null, 'Jalapeño pepper', 29, 0.9, 6.5, 0.4, '[{"label":"1 pepper","grams":14}]'),

-- Condiments, sauces & packaged staples
(null, 'Soy sauce', 53, 8, 4.9, 0.1, '[{"label":"1 tbsp","grams":18}]'),
(null, 'Balsamic vinegar', 88, 0.5, 17, 0, '[{"label":"1 tbsp","grams":16}]'),
(null, 'Apple cider vinegar', 21, 0, 0.9, 0, '[{"label":"1 tbsp","grams":15}]'),
(null, 'Worcestershire sauce', 78, 0, 19.5, 0, '[{"label":"1 tbsp","grams":17}]'), -- estimate: typical bottled Worcestershire sauce
(null, 'BBQ sauce', 172, 1, 40, 0.6, '[{"label":"2 tbsp","grams":35}]'), -- estimate: typical bottled BBQ sauce, varies by brand
(null, 'Sriracha hot sauce', 93, 1.9, 19, 0.9, '[{"label":"1 tsp","grams":6}]'), -- estimate: label figures vary roughly 80-105 kcal by brand
(null, 'Hot sauce (cayenne pepper, Tabasco-style)', 12, 0.5, 0.8, 0.4, '[{"label":"1 tsp","grams":5}]'),
(null, 'Dijon mustard', 66, 4, 5, 3.5, '[{"label":"1 tsp","grams":5}]'),
(null, 'Ranch dressing', 430, 1, 6, 45, '[{"label":"2 tbsp","grams":30}]'), -- estimate: typical bottled ranch dressing, varies by brand
(null, 'Italian dressing', 250, 0.4, 8, 24, '[{"label":"2 tbsp","grams":30}]'), -- estimate: typical bottled Italian dressing, varies by brand
(null, 'Maple syrup', 260, 0, 67, 0.2, '[{"label":"1 tbsp","grams":20}]'),
(null, 'Agave nectar', 310, 0, 76, 0.5, '[{"label":"1 tbsp","grams":21}]'),
(null, 'Jam / fruit preserves', 250, 0.4, 65, 0.1, '[{"label":"1 tbsp","grams":20}]'), -- estimate: generic fruit jam, varies by brand/fruit
(null, 'Teriyaki sauce', 89, 3, 16, 0, '[{"label":"1 tbsp","grams":18}]'),
(null, 'Applesauce, unsweetened', 42, 0.2, 11, 0.1, '[{"label":"1/2 cup","grams":122}]'),
(null, 'Olives, green', 145, 1, 3.8, 15, '[{"label":"5 olives","grams":17}]'),
(null, 'Olives, black', 115, 0.8, 6, 11, '[{"label":"5 olives","grams":25}]'),
(null, 'Sun-dried tomatoes', 258, 14, 56, 3, '[{"label":"1/4 cup","grams":27}]'),
(null, 'Brown sugar', 380, 0, 98, 0, '[{"label":"1 tsp","grams":4}]'),
(null, 'Coconut sugar', 375, 0, 100, 0, '[{"label":"1 tsp","grams":4}]'),
(null, 'Pickles, dill', 11, 0.3, 2.3, 0.2, '[{"label":"1 medium spear","grams":28}]');
