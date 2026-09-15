-- Incremental addition: branded products from LIDL/Maxi/Gomex/Idea/Diskont (Serbia).
-- Safe to run once on a database that already has the base seed_foods.sql applied.
-- Values sourced from product labels via keepitfit.rs, openfoodfacts.org and manufacturer data where available;
-- rows marked "estimate" below use a reasonable typical value for that food/product type because a specific
-- label value could not be verified online.

insert into foods (user_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, common_servings) values
-- Dairy
(null, 'LIDL Milbona grčki jogurt, 10% mm (Greek-style yogurt)', 107, 3.2, 4.3, 8.5, '[{"label":"1 čašica (150g)","grams":150},{"label":"1 kofica (400g)","grams":400}]'),
(null, 'LIDL Milbona voćni jogurt High Protein', 65, 10, 6, 0.3, '[{"label":"1 čašica (155g)","grams":155}]'),
(null, 'LIDL Milbona krem sir (cream cheese)', 231, 5.5, 3.3, 21.5, '[{"label":"1 kašika","grams":20},{"label":"1 čašica (150g)","grams":150}]'),
(null, 'Imlek Balans+ kefir, 2.8% mm', 55, 3.3, 4.3, 2.8, '[{"label":"1 čaša (250ml)","grams":250},{"label":"1 kutija (500ml)","grams":500}]'),
(null, 'Urda (sir od surutke, whey cheese)', 138, 16, 5.5, 8, '[{"label":"1 kašika","grams":30},{"label":"100g","grams":100}]'),
(null, 'LIDL Milbona posni sir / skuta (kvark, nemasni)', 80, 13, 3.5, 1, '[{"label":"1 čašica (250g)","grams":250}]'), -- estimate: typical low-fat quark/skuta values
(null, 'Premia Gauda sir (gouda cheese)', 352, 25, 0, 28, '[{"label":"1 kriška","grams":25}]'),
(null, 'LIDL Milbona sir Emmentaler', 380, 28, 0, 30, '[{"label":"1 kriška","grams":25}]'), -- estimate: typical Emmentaler cheese values
(null, 'Gomex 1/1 grčki jogurt, 2% mm', 90, 5, 4, 6, '[{"label":"1 čašica (150g)","grams":150}]'), -- estimate: Gomex private-label brand, no published label found
(null, 'Idea K Plus jogurt, prirodni', 62, 3.4, 4.7, 3.2, '[{"label":"1 čaša (180ml)","grams":180},{"label":"1 kesica (500ml)","grams":500}]'), -- estimate: Idea private-label brand, no published label found
(null, 'Zdravo! sirni namaz Kremsi (cream cheese spread)', 225, 6, 4, 20, '[{"label":"1 kašika","grams":20},{"label":"1 čašica (150g)","grams":150}]'), -- estimate: typical cream cheese spread values
(null, 'Fetaks, Mlekara Šabac (feta stil sir u salamuri)', 290, 17, 2, 23, '[{"label":"1 kocka","grams":30}]'), -- estimate: typical Serbian feta-style brined cheese values

-- Deli meats & sausages
(null, 'Carnex pileća viršla (chicken hot dogs)', 206, 12, 0.7, 17, '[{"label":"1 viršla","grams":50}]'),
(null, 'Carnex delikates viršle, pile/govedina', 305, 14, 0.3, 27, '[{"label":"1 viršla","grams":50}]'),
(null, 'Carnex bavarska kobasica', 215, 16, 0.8, 16, '[{"label":"1 kobasica","grams":75}]'),
(null, 'Carnex dimljena pileća prsa, slajs (smoked chicken breast)', 54, 12, 0.7, 0.4, '[{"label":"1 kriška","grams":15},{"label":"1 pakovanje (100g)","grams":100}]'),
(null, 'Carnex jetrena pašteta (liver pâté)', 305, 10, 1.7, 28, '[{"label":"1 kašika","grams":20},{"label":"1 konzerva (100g)","grams":100}]'),
(null, 'Carnex panceta, slanina (bacon)', 541, 37, 1.4, 42, '[{"label":"1 kriška","grams":15}]'), -- estimate: typical raw bacon values
(null, 'LIDL Dulano goveđa dimljena salama (smoked beef salami)', 260, 18, 1, 20, '[{"label":"1 kriška","grams":15}]'), -- estimate: verified real product (Cenoteka), typical smoked salami values used
(null, 'Gomex Graničar kobasica', 300, 14, 2, 26, '[{"label":"1 kobasica","grams":70}]'), -- estimate: Gomex private-label brand, no published label found

-- Frozen foods
(null, 'Frikom panirani riblji štapići (breaded fish sticks)', 202, 12, 15, 9.9, '[{"label":"1 štapić","grams":25},{"label":"5 štapića","grams":125}]'),
(null, 'Frikom grašak, smrznuti (frozen peas)', 59, 5.4, 7.1, 0.7, '[{"label":"1 porcija, kuvano (150g)","grams":150}]'),
(null, 'Frikom povrće, zlatna mešavina (frozen corn/carrot/pea mix)', 71, 3.3, 14.2, 0.8, '[{"label":"1 porcija (150g)","grams":150}]'),
(null, 'Frikom fitnes mešavina, smrznuto povrće', 34, 1.6, 5.3, 0.3, '[{"label":"1 porcija (200g)","grams":200}]'),
(null, 'Frikom mešano povrće za belu čorbu (soup vegetable mix)', 52, 2.1, 10, 0.3, '[{"label":"1 porcija (150g)","grams":150}]'), -- partial estimate: carbs/fat estimated, calories/protein from label
(null, 'Frikom povrće za rusku salatu, smrznuto', 60, 1.5, 12, 0.2, '[{"label":"1 porcija (150g)","grams":150}]'), -- estimate: typical potato/carrot/pea salad-mix values
(null, 'Frikom spanać, seckani, smrznuti (frozen chopped spinach)', 25, 3, 3, 0.3, '[{"label":"1 porcija (150g)","grams":150}]'), -- estimate: typical frozen chopped spinach values
(null, 'Panirani pileći file, smrznuto (frozen breaded chicken fillet)', 195, 14, 14, 10, '[{"label":"1 file","grams":100}]'), -- estimate: typical frozen breaded chicken fillet values
(null, 'Pomfrit, smrznuti (frozen French fries)', 150, 2.5, 24, 5, '[{"label":"1 porcija (150g)","grams":150}]'), -- estimate: typical frozen fries, oven-baked values

-- Bakery
(null, 'Sunce tost hleb, tamni (dark toast bread)', 271.7, 8.6, 49.2, 4.5, '[{"label":"1 kriška","grams":25}]'),
(null, 'Don Don "Tvojih 5 minuta" extra tamni tost hleb', 259, 8.4, 50.7, 2.5, '[{"label":"1 kriška","grams":25}]'),
(null, 'Maslačna kifla / kroasan (butter croissant)', 406, 8, 45, 21, '[{"label":"1 kifla","grams":60}]'), -- estimate: typical butter croissant values
(null, 'Uštipci / mekike (fried dough)', 320, 6, 35, 17, '[{"label":"1 komad","grams":50}]'), -- estimate: typical fried-dough values

-- Breakfast & cereal
(null, 'Bambi Plazma keks', 430, 11, 68, 12, '[{"label":"3 keksa (25g)","grams":25},{"label":"1 pakovanje (300g)","grams":300}]'),
(null, 'Jaffa Crvenka Jaffa Cakes keks', 378, 4.1, 69, 9, '[{"label":"1 kolačić","grams":20}]'),
(null, 'Swisslion Takovo Eurokrem (čoko-lešnik namaz)', 535, 4.9, 58.5, 31, '[{"label":"1 kašika","grams":15}]'),
(null, 'Lino Čokolino (instant kakao-žitna kašica)', 411, 7, 84, 4.1, '[{"label":"1 porcija, suvo (40g)","grams":40}]'),
(null, 'LIDL Crownfield müsli, voćni', 382, 8.5, 66.7, 7.1, '[{"label":"1 porcija (50g)","grams":50}]'),
(null, 'LIDL Crownfield crunchy musli sa lešnicima', 475, 7.9, 63, 20, '[{"label":"1 porcija (50g)","grams":50}]'),
(null, 'Vitalia Go Nutri Musli bar', 398, 5, 68.4, 11.6, '[{"label":"1 bar (30g)","grams":30}]'),
(null, 'Dr. Oetker Original puding, vanila', 92, 2.9, 16.9, 1.4, '[{"label":"1 porcija (125g)","grams":125}]'),
(null, 'LIDL Vitasia instant rezanci (instant noodles, suvo)', 436, 9, 60, 17, '[{"label":"1 pakovanje (85g)","grams":85}]'), -- estimate: typical dry instant-noodle block values
(null, 'Corn Flakes žitarice (kukuruzne pahuljice)', 357, 7, 84, 0.9, '[{"label":"1 činija (30g)","grams":30}]'), -- well-known typical corn flakes values

-- Snacks
(null, 'Soko Štark Smoki flips sa kikirikijem', 521, 13, 50, 29, '[{"label":"1 kesica (50g)","grams":50}]'),
(null, 'MARBO Chipsy Classic čips', 540, 7, 47.7, 34.7, '[{"label":"1 kesica (40g)","grams":40},{"label":"1 kesica (140g)","grams":140}]'),
(null, 'MARBO Chipsy rebrasti čips', 527, 6.1, 45, 36, '[{"label":"1 kesica (140g)","grams":140}]'), -- partial estimate: carbs/fat estimated, calories/protein from label
(null, 'Idea Hrusty čips', 540, 6, 50, 33, '[{"label":"1 kesica (100g)","grams":100}]'), -- estimate: Idea private-label brand, no published label found
(null, 'Kikiriki, pečeni i slani (roasted salted peanuts)', 585, 25, 16, 50, '[{"label":"1 šaka (30g)","grams":30}]'), -- well-known typical roasted peanut values
(null, 'Napolitanke, vanila (vanilla wafer)', 500, 6, 65, 25, '[{"label":"1 pakovanje (330g)","grams":330}]'), -- estimate: typical vanilla wafer values
(null, 'Vanilice (punjene džemom, Serbian jam cookies)', 480, 6, 60, 24, '[{"label":"1 komad","grams":15}]'), -- estimate: typical shortbread jam-cookie values
(null, 'Predsednik krekeri, slani (salted crackers)', 440, 10, 65, 13, '[{"label":"5 krekera (25g)","grams":25}]');
