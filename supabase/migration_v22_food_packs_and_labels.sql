-- FitLog schema v22: opt-in food packs, and personal labels on any food.
-- Safe to run more than once.
--
-- 1. FOOD PACKS - the shared food library included ~130 Serbian-branded/regional products
--    (Lidl/Frikom/Bambi/etc, plus dishes like burek and ćevapi) mixed into the same default
--    list every account searches. That's clutter for anyone outside Serbia, so they're moved
--    behind an opt-in "pack": tagged with a `pack` value, hidden from search by default, and
--    shown again once a user turns that pack on (`user_settings.enabled_food_packs`). Globally
--    recognizable brands that happened to be typed into the same seed file (Coca-Cola, Snickers,
--    Twix, Kinder, Red Bull, Mars, Sprite, Fanta, Schweppes) were deliberately left untagged -
--    they belong in every account's default list, not gated behind a regional pack.
--
-- 2. FOOD LABELS - a personal tagging layer on top of any food (global, packed, or your own),
--    e.g. "breakfast" or "meal-prep favorite". Separate table because RLS can't let you attach
--    metadata to a row you don't own (most of the shared library) any other way, and because two
--    accounts must be able to tag the same food differently.

alter table foods add column if not exists pack text;
alter table user_settings add column if not exists enabled_food_packs text[] not null default '{}';

update foods set pack = 'serbia'
 where user_id is null and pack is null and name in (
    'Ajvar', 'Bajadera, Kraš', 'Bambi Coko Plazma keks (čokoladom preliven)', 'Bambi Plazma Diet keks',
    'Bambi Plazma Mini keks', 'Bambi Plazma keks', 'Beli sir (domaći/sremski)', 'Burek sa mesom',
    'Burek sa sirom (cheese burek)', 'Carnex bavarska kobasica', 'Carnex delikates viršle, pile/govedina', 'Carnex dimljena pileća prsa, slajs (smoked chicken breast)',
    'Carnex jetrena pašteta (liver pâté)', 'Carnex panceta, slanina (bacon)', 'Carnex pileća viršla (chicken hot dogs)', 'Cockta',
    'Corn Flakes žitarice (kukuruzne pahuljice)', 'Domaća kobasica, suva', 'Don Don "Tvojih 5 minuta" extra tamni tost hleb', 'Doner/gyro sendvič (mixed meat, lepinja, sos, salata)',
    'Dr. Oetker Original puding, vanila', 'Dukat tečni jogurt (drinking yogurt)', 'Feta Šabačka, Mlekara Šabac', 'Fetaks, Mlekara Šabac (feta stil sir u salamuri)',
    'Frikom Ekvador sladoled (chocolate-coated ice cream bar)', 'Frikom Kornet, vanila (wafer cone ice cream)', 'Frikom fitnes mešavina, smrznuto povrće', 'Frikom grašak, smrznuti (frozen peas)',
    'Frikom mešano povrće za belu čorbu (soup vegetable mix)', 'Frikom panirani riblji štapići (breaded fish sticks)', 'Frikom povrće za rusku salatu, smrznuto', 'Frikom povrće, zlatna mešavina (frozen corn/carrot/pea mix)',
    'Frikom sladoled, porodično pakovanje, vanila (tub ice cream)', 'Frikom spanać, seckani, smrznuti (frozen chopped spinach)', 'Frikom Šatorka / Kapri sladoled (chocolate-coated cone)', 'Gomex 1/1 grčki jogurt, 2% mm',
    'Gomex Graničar kobasica', 'Goveđi pršut (dry-cured beef)', 'Grekos High Protein jogurt', 'Grekos feta sir, Mlekara Subotica',
    'Guarana, gazirano voćno piće', 'Gumene bombone (gummy candy)', 'Idea Hrusty čips', 'Idea K Plus jogurt, prirodni',
    'Imlek Balans+ kefir, 2.8% mm', 'Jaffa Crvenka Jaffa Cakes keks', 'Kajmak', 'Kačkavalj',
    'Kikiriki, pečeni i slani (roasted salted peanuts)', 'Knjaz Miloš, gazirana prirodna mineralna voda', 'LIDL Crownfield crunchy musli sa lešnicima', 'LIDL Crownfield müsli, voćni',
    'LIDL Dulano goveđa dimljena salama (smoked beef salami)', 'LIDL Milbona grčki jogurt, 10% mm (Greek-style yogurt)', 'LIDL Milbona krem sir (cream cheese)', 'LIDL Milbona posni sir / skuta (kvark, nemasni)',
    'LIDL Milbona sir Emmentaler', 'LIDL Milbona voćni jogurt High Protein', 'LIDL Skyr, prirodni (plain)', 'LIDL Skyr, vanila/voće (flavored)',
    'LIDL Vitasia instant rezanci (instant noodles, suvo)', 'Lino Čokolino (instant kakao-žitna kašica)', 'MARBO Chipsy Classic čips', 'MARBO Chipsy rebrasti čips',
    'Maslačna kifla / kroasan (butter croissant)', 'Milka mlečna čokolada, alpsko mleko (milk chocolate)', 'Napolitanke, vanila (vanilla wafer)', 'Nectar voćni sok/nektar, pomorandža',
    'Next negazirano voćno piće', 'Panirani pileći file, smrznuto (frozen breaded chicken fillet)', 'Parče pice, mešano (generic pizza slice)', 'Pesto sos, bosiljak (basil pesto)',
    'Pečenica (dry-cured pork loin)', 'Pljeskavica, pečena', 'Podravka crveni pasulj, konzerviran (canned red beans, ready to eat)', 'Podravka instant supa, pileća (dry, per suvo pakovanje)',
    'Podravka Đuveč, konzervirano gotovo jelo', 'Pomfrit, smrznuti (frozen French fries)', 'Predsednik krekeri, slani (salted crackers)', 'Preliv za salatu, francuski/vinaigrette stil (salad dressing)',
    'Premia Gauda sir (gouda cheese)', 'President Somborska feta sir (Somboled)', 'Proja (kukuruzni hleb)', 'Pršut (dry-cured ham)',
    'Rosa, negazirana prirodna izvorska voda', 'Sardine u ulju, konzervirane (canned sardines in oil)', 'Senf (mustard, Zdravo!/Kelly''s stil)', 'Skroz Dobra Pekara Fit beskvasni hleb',
    'Skroz Dobra Pekara Hrono proja', 'Skroz Dobra Pekara Integralna kifla', 'Skroz Dobra Pekara Integralni pšenični hleb (po preporuci Ane Petrović)', 'Skroz Dobra Pekara Kifla zrno zdravlja',
    'Skroz Dobra Pekara Kuvani djevrek', 'Skroz Dobra Pekara Pitice sa jabukama i vanilom', 'Skroz Dobra Pekara Rol viršla', 'Slanina, suva (cured pork fat)',
    'Smrznuta pizza, Dr. Oetker Ristorante stil', 'Soko Štark Smoki flips sa kikirikijem', 'Somun / lepinja', 'Sremski kulen',
    'Stara kolenica (dimljena)', 'Sudžuk', 'Sunce tost hleb, tamni (dark toast bread)', 'Suva vešalica',
    'Swisslion Takovo Eurokrem (čoko-lešnik namaz)', 'Tartar sos (tartar sauce)', 'Tuna u ulju, konzervirana, ocedjena (canned tuna in oil, drained)', 'Urda (sir od surutke, whey cheese)',
    'Uštipci / mekike (fried dough)', 'Vanilice (punjene džemom, Serbian jam cookies)', 'Vegeta, dodatak jelima (all-purpose seasoning)', 'Vitalia Go Nutri Musli bar',
    'Vrnjci Voda, prirodna mineralna voda', 'Zdravo! sirni namaz Kremsi (cream cheese spread)', 'Zimska salama', 'Ćevapi, pečeni',
    'Čvarci (pork cracklings)', 'Štark "Najlepše želje" mlečna čokolada'
  );

create table if not exists food_labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id uuid not null references foods(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now(),
  unique (user_id, food_id, label)
);
create index if not exists food_labels_user_idx on food_labels (user_id);
create index if not exists food_labels_food_idx on food_labels (food_id);

alter table food_labels enable row level security;
drop policy if exists "own food labels" on food_labels;
create policy "own food labels" on food_labels for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
