# Build the shared catalog (exercises, foods, official diets / meal plans / meal presets) from the
# repo's own seed SQL, so the screenshots show the same library the real app ships with.
import json, re, sys, uuid, os

SUPA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'supabase')
OUT = os.path.join(os.path.dirname(__file__), 'catalog.json')


def tokenize_values(s, i):
    """Parse `(a, b, ...), (...), ...` starting at s[i]; stop at ';' or a keyword. Returns (rows, end)."""
    rows = []
    n = len(s)

    def skip_ws(j):
        while j < n:
            if s[j].isspace():
                j += 1
            elif s.startswith('--', j):
                j = s.index('\n', j) if '\n' in s[j:] else n
            else:
                break
        return j

    j = skip_ws(i)
    while j < n and s[j] == '(':
        j += 1
        row = []
        while True:
            j = skip_ws(j)
            if s[j] == "'":
                k = j + 1
                buf = []
                while True:
                    if s[k] == "'" and k + 1 < n and s[k + 1] == "'":
                        buf.append("'"); k += 2
                    elif s[k] == "'":
                        break
                    else:
                        buf.append(s[k]); k += 1
                val = ''.join(buf)
                j = k + 1
            else:
                m = re.match(r"[^,()]+", s[j:])
                tok = m.group(0).strip().split('::')[0].strip()
                j += len(m.group(0))
                low = tok.lower()
                if low == 'null':
                    val = None
                elif low in ('true', 'false'):
                    val = low == 'true'
                else:
                    try:
                        val = float(tok) if ('.' in tok or 'e' in low) else int(tok)
                    except ValueError:
                        val = tok
            # swallow casts like ::jsonb
            m = re.match(r"::[a-z_\[\]]+", s[j:])
            if m:
                j += len(m.group(0))
            row.append(val)
            j = skip_ws(j)
            if s[j] == ',':
                j += 1
                continue
            if s[j] == ')':
                j += 1
                break
            raise ValueError('unexpected %r at %d' % (s[j:j + 40], j))
        rows.append(row)
        j = skip_ws(j)
        if j < n and s[j] == ',':
            j = skip_ws(j + 1)
    return rows, j


def inserts(path, table):
    s = open(path, encoding='utf-8').read()
    out = []
    for m in re.finditer(r"insert into\s+(?:public\.)?" + table + r"\s*(\(([^)]*)\))?\s*(?:select[^;]*?from \()?values", s, re.I):
        cols = [c.strip() for c in m.group(2).split(',')] if m.group(2) else None
        rows, _ = tokenize_values(s, m.end())
        out.append((cols, rows))
    return out


def uid(*parts):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, 'fitlog-demo/' + '/'.join(map(str, parts))))


TS = '2026-01-01T00:00:00+00:00'
FOOD_DEFAULTS = dict(fiber_g=0, sugar_g=0, sodium_mg=0, cholesterol_mg=0, potassium_mg=0, calcium_mg=0,
                     iron_mg=0, vitamin_c_mg=0, vitamin_a_mcg=0, common_servings=[], barcode=None, pack=None)

exercises = {}
for f in ['seed_exercises.sql', 'seed_exercises_v2.sql', 'seed_exercises_v3_bodyweight.sql']:
    for cols, rows in inserts(os.path.join(SUPA, f), 'exercises'):
        for r in rows:
            d = dict(zip(cols, r))
            if d['name'] in exercises:
                continue
            exercises[d['name']] = dict(id=uid('ex', d['name']), user_id=None, name=d['name'],
                                        muscle_group=d['muscle_group'], created_at=TS)

foods = {}
FOOD_FILES = ['seed_foods.sql', 'seed_foods_batch2_produce_meats_dairy.sql', 'seed_foods_fruits_veg.sql',
              'seed_foods_global_staples_DO_NOT_RUN_YET.sql', 'seed_foods_android_launch.sql', 'seed_foods_local.sql']
for f in FOOD_FILES:
    for cols, rows in inserts(os.path.join(SUPA, f), 'foods'):
        for r in rows:
            d = dict(zip(cols, r))
            if d.get('user_id') is not None or d['name'] in foods:
                continue
            food = dict(FOOD_DEFAULTS, id=uid('food', d['name']), user_id=None, created_at=TS)
            for k, v in d.items():
                if k == 'user_id':
                    continue
                if k == 'common_servings' and isinstance(v, str):
                    v = json.loads(v)
                food[k] = v
            foods[d['name']] = food

# Micronutrient updates (`update foods set a = x, b = y where name = '...'`).
micro = open(os.path.join(SUPA, 'update_foods_micros.sql'), encoding='utf-8').read()
for m in re.finditer(r"update foods set (.*?) where (?:user_id is null and )?name\s*=\s*'((?:[^']|'')*)'", micro, re.I | re.S):
    name = m.group(2).replace("''", "'")
    if name not in foods:
        continue
    for a in re.finditer(r"(\w+)\s*=\s*([\d.]+)", m.group(1)):
        foods[name][a.group(1)] = float(a.group(2))


def food_id(name):
    if name not in foods:
        raise KeyError('missing food: ' + name)
    return foods[name]['id']


OWNER = 'official-owner'
v29 = os.path.join(SUPA, 'migration_v29_diets_and_meal_plans.sql')
od = inserts(v29, 'od')[0][1]
odf = inserts(v29, 'odf')[0][1]
op = inserts(v29, 'op')[0][1]
opi = inserts(v29, 'opi')[0][1]

diets, diet_foods, meal_plans, meal_plan_items = [], [], [], []
for i, (sort, name, desc) in enumerate(sorted(od)):
    did = uid('diet', name)
    diets.append(dict(id=did, user_id=OWNER, name=name, description=desc, is_shared=True, is_official=True,
                      source_id=None, created_at='2026-09-20T10:00:%02d+00:00' % i))
    for dname, fname in odf:
        if dname == name:
            diet_foods.append(dict(diet_id=did, food_id=food_id(fname)))
    for j, (pdiet, plan, pdesc) in enumerate(p for p in op if p[0] == name):
        pid = uid('plan', plan)
        meal_plans.append(dict(id=pid, user_id=OWNER, name=plan, description=pdesc, days=1, diet_id=did,
                               is_shared=True, is_official=True, source_id=None,
                               created_at='2026-09-20T11:00:%02d+00:00' % i))
        for (pl, meal, mo, io, fname, grams, label) in opi:
            if pl == plan:
                meal_plan_items.append(dict(id=uid('mpi', plan, mo, io), plan_id=pid, day_index=0, meal_name=meal,
                                            meal_order=mo, item_order=io, food_id=food_id(fname), grams=grams,
                                            serving_label=label))

v28 = os.path.join(SUPA, 'migration_v28_community.sql')
oi = inserts(v28, 'official_items')[0][1]
meal_presets, meal_preset_items = [], []
seen = {}
for (order, preset, desc, io, fname, grams, label) in oi:
    if preset not in seen:
        pid = uid('mp', preset)
        seen[preset] = pid
        meal_presets.append(dict(id=pid, user_id=OWNER, name=preset, description=desc, is_shared=True,
                                 is_official=True, source_id=None, created_at='2026-09-19T10:00:%02d+00:00' % order))
    elif desc:
        next(p for p in meal_presets if p['name'] == preset)['description'] = desc
    meal_preset_items.append(dict(id=uid('mpi2', preset, io), preset_id=seen[preset], food_id=food_id(fname),
                                  grams=grams, serving_label=label, created_at=TS))

cat = dict(exercises=list(exercises.values()), foods=list(foods.values()), diets=diets, diet_foods=diet_foods,
           meal_plans=meal_plans, meal_plan_items=meal_plan_items, meal_presets=meal_presets,
           meal_preset_items=meal_preset_items)
json.dump(cat, open(OUT, 'w', encoding='utf-8'))
print({k: len(v) for k, v in cat.items()})
print('Mediterranean foods:', sum(1 for x in diet_foods if x['diet_id'] == diets[0]['id']))
