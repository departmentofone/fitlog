-- Backfills approximate micronutrients (per 100g) for the most commonly-logged shared
-- foods. Anything not listed here just stays at 0 until edited — safe to run any time
-- after migration_v4.sql. Values are approximate (USDA-ish), same spirit as the macros.

update foods set fiber_g=0, sugar_g=0, sodium_mg=74, cholesterol_mg=85, potassium_mg=256, calcium_mg=15, iron_mg=1, vitamin_c_mg=0, vitamin_a_mcg=9 where name='Chicken breast, cooked' and user_id is null;
update foods set fiber_g=0, sugar_g=0.5, sodium_mg=124, cholesterol_mg=373, potassium_mg=126, calcium_mg=50, iron_mg=1.2, vitamin_c_mg=0, vitamin_a_mcg=160 where name='Egg, whole' and user_id is null;
update foods set fiber_g=10, sugar_g=1, sodium_mg=2, cholesterol_mg=0, potassium_mg=429, calcium_mg=54, iron_mg=4.7, vitamin_c_mg=0, vitamin_a_mcg=0 where name='Oats, dry' and user_id is null;
update foods set fiber_g=0.4, sugar_g=0.1, sodium_mg=1, cholesterol_mg=0, potassium_mg=35, calcium_mg=10, iron_mg=0.2, vitamin_c_mg=0, vitamin_a_mcg=0 where name='White rice, cooked' and user_id is null;
update foods set fiber_g=1.8, sugar_g=0.4, sodium_mg=5, cholesterol_mg=0, potassium_mg=86, calcium_mg=10, iron_mg=0.5, vitamin_c_mg=0, vitamin_a_mcg=0 where name='Brown rice, cooked' and user_id is null;
update foods set fiber_g=2.6, sugar_g=12, sodium_mg=1, cholesterol_mg=0, potassium_mg=358, calcium_mg=5, iron_mg=0.3, vitamin_c_mg=8.7, vitamin_a_mcg=3 where name='Banana' and user_id is null;
update foods set fiber_g=2.4, sugar_g=10, sodium_mg=1, cholesterol_mg=0, potassium_mg=107, calcium_mg=6, iron_mg=0.1, vitamin_c_mg=4.6, vitamin_a_mcg=3 where name='Apple' and user_id is null;
update foods set fiber_g=2.6, sugar_g=1.7, sodium_mg=33, cholesterol_mg=0, potassium_mg=316, calcium_mg=47, iron_mg=0.7, vitamin_c_mg=89, vitamin_a_mcg=31 where name='Broccoli' and user_id is null;
update foods set fiber_g=2.2, sugar_g=0.4, sodium_mg=79, cholesterol_mg=0, potassium_mg=558, calcium_mg=99, iron_mg=2.7, vitamin_c_mg=28, vitamin_a_mcg=469 where name='Spinach' and user_id is null;
update foods set fiber_g=0, sugar_g=0, sodium_mg=59, cholesterol_mg=63, potassium_mg=384, calcium_mg=9, iron_mg=0.3, vitamin_c_mg=0, vitamin_a_mcg=58 where name='Salmon, cooked' and user_id is null;
update foods set fiber_g=0, sugar_g=3.6, sodium_mg=36, cholesterol_mg=5, potassium_mg=141, calcium_mg=110, iron_mg=0.04, vitamin_c_mg=0, vitamin_a_mcg=0 where name='Greek yogurt, plain nonfat' and user_id is null;
update foods set fiber_g=0, sugar_g=5, sodium_mg=43, cholesterol_mg=10, potassium_mg=132, calcium_mg=113, iron_mg=0.03, vitamin_c_mg=0, vitamin_a_mcg=46 where name='Milk, whole' and user_id is null;
update foods set fiber_g=6.8, sugar_g=5.6, sodium_mg=472, cholesterol_mg=0, potassium_mg=248, calcium_mg=138, iron_mg=2.7, vitamin_c_mg=0, vitamin_a_mcg=0 where name='Whole wheat bread' and user_id is null;
update foods set fiber_g=2.4, sugar_g=5, sodium_mg=490, cholesterol_mg=0, potassium_mg=100, calcium_mg=151, iron_mg=3.6, vitamin_c_mg=0, vitamin_a_mcg=0 where name='White bread' and user_id is null;
update foods set fiber_g=2.2, sugar_g=1.2, sodium_mg=10, cholesterol_mg=0, potassium_mg=535, calcium_mg=15, iron_mg=1.1, vitamin_c_mg=9.6, vitamin_a_mcg=0 where name='Potato, baked' and user_id is null;
update foods set fiber_g=3.3, sugar_g=6.5, sodium_mg=36, cholesterol_mg=0, potassium_mg=475, calcium_mg=38, iron_mg=0.7, vitamin_c_mg=19.6, vitamin_a_mcg=961 where name='Sweet potato, baked' and user_id is null;
update foods set fiber_g=8.7, sugar_g=0.3, sodium_mg=1, cholesterol_mg=0, potassium_mg=355, calcium_mg=27, iron_mg=2.1, vitamin_c_mg=0, vitamin_a_mcg=0 where name='Black beans, cooked' and user_id is null;
update foods set fiber_g=7.9, sugar_g=1.8, sodium_mg=2, cholesterol_mg=0, potassium_mg=369, calcium_mg=19, iron_mg=3.3, vitamin_c_mg=1.5, vitamin_a_mcg=0 where name='Lentils, cooked' and user_id is null;
update foods set fiber_g=0, sugar_g=0, sodium_mg=2, cholesterol_mg=0, potassium_mg=1, calcium_mg=1, iron_mg=0.6, vitamin_c_mg=0, vitamin_a_mcg=0 where name='Olive oil' and user_id is null;
update foods set fiber_g=6, sugar_g=9, sodium_mg=17, cholesterol_mg=0, potassium_mg=649, calcium_mg=43, iron_mg=1.9, vitamin_c_mg=0, vitamin_a_mcg=0 where name='Peanut butter' and user_id is null;
update foods set fiber_g=12.5, sugar_g=4.4, sodium_mg=1, cholesterol_mg=0, potassium_mg=733, calcium_mg=269, iron_mg=3.7, vitamin_c_mg=0, vitamin_a_mcg=0 where name='Almonds' and user_id is null;
update foods set fiber_g=6.7, sugar_g=0.7, sodium_mg=7, cholesterol_mg=0, potassium_mg=485, calcium_mg=12, iron_mg=0.6, vitamin_c_mg=10, vitamin_a_mcg=7 where name='Avocado' and user_id is null;
update foods set fiber_g=2.4, sugar_g=9.4, sodium_mg=0, cholesterol_mg=0, potassium_mg=181, calcium_mg=40, iron_mg=0.1, vitamin_c_mg=53, vitamin_a_mcg=11 where name='Orange' and user_id is null;
update foods set fiber_g=0, sugar_g=0, sodium_mg=75, cholesterol_mg=90, potassium_mg=270, calcium_mg=18, iron_mg=2.6, vitamin_c_mg=0, vitamin_a_mcg=0 where name='Ground beef 85/15, cooked' and user_id is null;
update foods set fiber_g=0, sugar_g=0, sodium_mg=247, cholesterol_mg=30, potassium_mg=237, calcium_mg=9, iron_mg=0.7, vitamin_c_mg=0, vitamin_a_mcg=17 where name='Tuna, canned in water' and user_id is null;
update foods set fiber_g=0, sugar_g=2.7, sodium_mg=364, cholesterol_mg=10, potassium_mg=104, calcium_mg=83, iron_mg=0.14, vitamin_c_mg=0, vitamin_a_mcg=25 where name='Cottage cheese, low fat' and user_id is null;
update foods set fiber_g=0, sugar_g=0.5, sodium_mg=621, cholesterol_mg=105, potassium_mg=98, calcium_mg=721, iron_mg=0.7, vitamin_c_mg=0, vitamin_a_mcg=265 where name='Cheddar cheese' and user_id is null;
update foods set fiber_g=2.8, sugar_g=0.9, sodium_mg=7, cholesterol_mg=0, potassium_mg=172, calcium_mg=17, iron_mg=1.5, vitamin_c_mg=0, vitamin_a_mcg=1 where name='Quinoa, cooked' and user_id is null;
update foods set fiber_g=1.8, sugar_g=0.6, sodium_mg=1, cholesterol_mg=0, potassium_mg=44, calcium_mg=7, iron_mg=1, vitamin_c_mg=0, vitamin_a_mcg=0 where name='Pasta, cooked' and user_id is null;
update foods set fiber_g=2.8, sugar_g=4.7, sodium_mg=69, cholesterol_mg=0, potassium_mg=320, calcium_mg=33, iron_mg=0.3, vitamin_c_mg=5.9, vitamin_a_mcg=835 where name='Carrot' and user_id is null;
update foods set fiber_g=1.2, sugar_g=2.6, sodium_mg=5, cholesterol_mg=0, potassium_mg=237, calcium_mg=10, iron_mg=0.3, vitamin_c_mg=14, vitamin_a_mcg=42 where name='Tomato' and user_id is null;
update foods set fiber_g=2.4, sugar_g=10, sodium_mg=1, cholesterol_mg=0, potassium_mg=77, calcium_mg=6, iron_mg=0.3, vitamin_c_mg=9.7, vitamin_a_mcg=3 where name='Blueberries' and user_id is null;
update foods set fiber_g=7.6, sugar_g=4.8, sodium_mg=7, cholesterol_mg=0, potassium_mg=291, calcium_mg=49, iron_mg=2.9, vitamin_c_mg=1.3, vitamin_a_mcg=1 where name='Chickpeas, cooked' and user_id is null;
update foods set fiber_g=6.7, sugar_g=2.6, sodium_mg=2, cholesterol_mg=0, potassium_mg=441, calcium_mg=98, iron_mg=2.9, vitamin_c_mg=1.3, vitamin_a_mcg=1 where name='Walnuts' and user_id is null;
update foods set fiber_g=1, sugar_g=4, sodium_mg=150, cholesterol_mg=40, potassium_mg=200, calcium_mg=130, iron_mg=0.5, vitamin_c_mg=0, vitamin_a_mcg=0 where name='Whey protein powder' and user_id is null;
