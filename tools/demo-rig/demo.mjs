// Demo account for the store screenshots: ~6 weeks of Push/Pull/Legs training, a workout in
// progress today, meals from the shared food library, a weight trend, fasts and settings.
// Deterministic (seeded) so reshoots come out the same.
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'

export const USER = {
  id: '0d3e5f10-2c4b-4e8a-9f61-7a2b3c4d5e6f',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@fitlog.test',
  email_confirmed_at: '2026-06-01T09:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  created_at: '2026-06-01T09:00:00Z',
  updated_at: '2026-06-01T09:00:00Z',
}
const U = USER.id

let seed = 7
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const pad = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const daysAgo = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d }
const at = (n, h, m = 0) => { const d = daysAgo(n); d.setHours(h, m, 0, 0); return d.toISOString() }

const PLANS = {
  push: [
    ['Barbell Bench Press', [[40, 10, true]], 70, 8, 3, 2.5],
    ['Overhead Barbell Press', [], 42.5, 8, 3, 0],
    ['Incline Dumbbell Press', [], 24, 10, 3, 2],
    ['Dumbbell Lateral Raise', [], 10, 15, 3, 0],
    ['Triceps Pushdown (Rope)', [], 25, 12, 3, 2.5],
  ],
  pull: [
    ['Deadlift', [[60, 5, true]], 120, 5, 3, 5],
    ['Pull-Up', [], 0, 8, 3, 0],
    ['Barbell Row', [], 60, 8, 3, 2.5],
    ['Face Pull (Cable Rope)', [], 20, 15, 3, 0],
    ['Barbell Curl', [], 30, 10, 3, 0],
  ],
  legs: [
    ['Barbell Back Squat', [[60, 8, true]], 100, 6, 3, 2.5],
    ['Romanian Deadlift (Barbell)', [], 80, 8, 3, 5],
    ['Leg Press (Machine)', [], 160, 10, 3, 10],
    ['Lying Leg Curl (Machine)', [], 40, 12, 3, 2.5],
    ['Standing Calf Raise (Machine)', [], 60, 12, 3, 5],
  ],
}

// Days ago -> workout type. Today (0) is a push day in progress. Everything else in the last three
// weeks is a rest day, so the streak reads like a steady routine.
const SCHEDULE = []
for (let n = 42; n >= 1; n--) {
  const dow = daysAgo(n).getDay() // 0 Sun .. 6 Sat
  const t = { 1: 'push', 2: 'pull', 4: 'legs', 5: 'push', 6: 'pull' }[dow]
  if (t) SCHEDULE.push([n, t])
}

export function buildDemo(catalog) {
  seed = 7
  const db = {}
  for (const k of Object.keys(catalog)) db[k] = catalog[k].map((r) => ({ ...r }))
  const ex = (name) => {
    const e = db.exercises.find((x) => x.name === name)
    if (!e) throw new Error('missing exercise ' + name)
    return e
  }
  const food = (name) => {
    const f = db.foods.find((x) => x.name === name)
    if (!f) throw new Error('missing food ' + name)
    return f
  }

  Object.assign(db, {
    workout_sessions: [], workout_sets: [], meals: [], meal_items: [], water_logs: [], progress_entries: [],
    fasting_sessions: [], rest_days: [], goals: [], alcohol_logs: [], body_measurements: [], exercise_notes: [],
    workout_presets: [], workout_preset_items: [], recipes: [], recipe_ingredients: [], programs: [],
    food_labels: [], community_reports: [], push_subscriptions: [], error_logs: [],
  })

  // Official workouts and programs from migration_v35, owned by a separate "FitLog" account.
  const OWNER = '11111111-2222-4333-8444-555555555555'
  const officialV35 = JSON.parse(readFileSync(new URL('./official_v35.json', import.meta.url), 'utf8'))
  officialV35.workouts.forEach((w, i) => {
    const pid = randomUUID()
    db.workout_presets.push({ id: pid, user_id: OWNER, name: w.name, description: w.description, is_shared: true, is_official: true, source_id: null, created_at: new Date(Date.parse('2026-09-01T10:00:00Z') + i * 1000).toISOString() })
    const num = {}
    for (const [name, sets, reps] of w.items) for (let k = 0; k < sets; k++) { num[name] = (num[name] ?? 0) + 1; db.workout_preset_items.push({ id: randomUUID(), preset_id: pid, exercise_id: ex(name).id, set_number: num[name], weight: 0, reps, is_warmup: false }) }
  })
  officialV35.programs.forEach((p, i) => db.programs.push({ id: randomUUID(), user_id: OWNER, name: p.name, description: p.description, is_shared: true, is_official: true, source_id: null, diet_goal: null, calorie_goal: null, water_goal_ml: null, workouts: p.workouts, recipes: [], meal_presets: [], created_at: new Date(Date.parse('2026-09-01T11:00:00Z') + i * 1000).toISOString() }))

  // ---- training
  const addSession = (n, type, opts = {}) => {
    const week = Math.floor((42 - n) / 7) // progression: heavier each week
    const sid = randomUUID()
    const start = at(n, 18, 5)
    db.workout_sessions.push({
      id: sid, user_id: U, date: iso(daysAgo(n)), preworkout: false,
      notes: opts.notes ?? null,
      started_at: opts.live ? new Date(Date.now() - 47 * 60 * 1000 - 12 * 1000).toISOString() : null,
      duration_seconds: opts.live ? null : 3600 + Math.round(rnd() * 1500),
      created_at: start,
    })
    let t = Date.parse(start)
    const plan = opts.items ?? PLANS[type]
    for (const [i, [name, warmups, base, reps, sets, step]] of plan.entries()) {
      if (opts.limit && i >= opts.limit) break
      const e = ex(name)
      let num = 1
      const w = base ? base + step * Math.floor(week / 2) : 0
      for (const [ww, wr] of warmups) db.workout_sets.push({ id: randomUUID(), session_id: sid, exercise_id: e.id, set_number: num++, weight: ww, reps: wr, difficulty: 5, is_warmup: true, created_at: new Date((t += 150000)).toISOString() })
      const nSets = opts.setsFor?.[name] ?? sets
      for (let s = 0; s < nSets; s++) {
        const r = Math.max(reps - (s === nSets - 1 && rnd() > 0.6 ? 1 : 0), 1)
        db.workout_sets.push({ id: randomUUID(), session_id: sid, exercise_id: e.id, set_number: num++, weight: w, reps: r, difficulty: 7 + Math.min(s, 2), is_warmup: false, created_at: new Date((t += 170000)).toISOString() })
      }
    }
    return sid
  }
  for (const [n, type] of SCHEDULE) addSession(n, type)
  for (let n = 1; n <= 11; n++) if (!SCHEDULE.some(([d]) => d === n)) db.rest_days.push({ id: randomUUID(), user_id: U, date: iso(daysAgo(n)), created_at: at(n, 9) })
  // Today: push day, four exercises in, the fifth not started.
  addSession(0, 'push', { live: true, limit: 4, setsFor: { 'Dumbbell Lateral Raise': 2 }, notes: 'Felt strong today. Bench moved fast.' })

  db.exercise_notes.push({ user_id: U, exercise_id: ex('Barbell Bench Press').id, notes: 'Grip one finger inside the rings. Pause the first rep.', updated_at: at(10, 18) })
  db.goals.push({ id: randomUUID(), user_id: U, category: 'workout', title: 'Bench 80 kg for 5', notes: null, target_date: iso(daysAgo(-60)), completed: false, target_exercise_id: ex('Barbell Bench Press').id, target_weight: 80, target_reps: 5, created_at: at(40, 10) })
  db.goals.push({ id: randomUUID(), user_id: U, category: 'custom', title: 'Train 4 times a week for 3 months', notes: null, target_date: iso(daysAgo(-45)), completed: false, target_exercise_id: null, target_weight: null, target_reps: null, created_at: at(40, 10) })

  for (const [name, type] of [['Push day', 'push'], ['Pull day', 'pull'], ['Leg day', 'legs']]) {
    const pid = randomUUID()
    db.workout_presets.push({ id: pid, user_id: U, name, is_shared: false, is_official: false, source_id: null, description: null, created_at: at(40, 9) })
    for (const [name2, warmups, base, reps, sets] of PLANS[type]) {
      let num = 1
      for (const [ww, wr] of warmups) db.workout_preset_items.push({ id: randomUUID(), preset_id: pid, exercise_id: ex(name2).id, set_number: num++, weight: ww, reps: wr, is_warmup: true })
      for (let s = 0; s < sets; s++) db.workout_preset_items.push({ id: randomUUID(), preset_id: pid, exercise_id: ex(name2).id, set_number: num++, weight: base, reps, is_warmup: false })
    }
  }

  // ---- nutrition
  const MENUS = {
    Breakfast: [
      [['Greek yogurt, plain nonfat', 250, '1 cup'], ['Strawberries', 150, null], ['Walnuts', 20, null], ['Honey', 10, null]],
      [['Oats, dry', 60, '1/2 cup dry'], ['Milk, 2% reduced fat', 244, '1 cup'], ['Banana', 118, '1 medium'], ['Peanut butter', 16, '1 tbsp']],
      [['Egg, whole', 150, '3 large'], ['Whole wheat bread', 64, '2 slices'], ['Avocado', 50, '1/3 avocado'], ['Tomato', 123, '1 medium']],
    ],
    Lunch: [
      [['Chicken breast, cooked', 180, null], ['Brown rice, cooked', 195, '1 cup'], ['Broccoli', 150, null], ['Olive oil', 10, null]],
      [['Salmon, cooked', 150, null], ['Quinoa, cooked', 185, '1 cup'], ['Spinach', 60, null], ['Lemon', 30, null]],
      [['Tuna, canned in water', 165, '1 can, drained'], ['Chickpeas, cooked', 120, null], ['Cucumber', 100, null], ['Olive oil', 10, null]],
    ],
    Snack: [
      [['Apple', 182, '1 medium'], ['Almonds', 28, '1 oz (about 23 almonds)']],
      [['Cottage cheese, low fat', 200, null], ['Blueberries', 74, '1/2 cup']],
    ],
    Dinner: [
      [['Turkey breast, cooked', 150, null], ['Sweet potato, baked', 200, null], ['Green beans', 120, null], ['Olive oil', 10, null]],
      [['Pasta, cooked', 200, '1 1/4 cups'], ['Shrimp, cooked', 150, null], ['Tomato', 123, '1 medium'], ['Parmesan cheese, hard', 10, null]],
      [['Lentils, cooked', 200, '1 cup'], ['Brown rice, cooked', 150, null], ['Onion', 60, null], ['Olive oil', 10, null]],
    ],
  }
  const addMeal = (n, name, items, hour, completed = true) => {
    const mid = randomUUID()
    db.meals.push({ id: mid, user_id: U, date: iso(daysAgo(n)), name, completed, photo_path: null, created_at: at(n, hour) })
    for (const [fname, grams, label] of items) db.meal_items.push({ id: randomUUID(), meal_id: mid, food_id: food(fname).id, grams, serving_label: label, created_at: at(n, hour, 5) })
  }
  for (let n = 20; n >= 1; n--) {
    addMeal(n, 'Breakfast', MENUS.Breakfast[n % 3], 8)
    addMeal(n, 'Lunch', MENUS.Lunch[n % 3], 13)
    if (n % 2) addMeal(n, 'Snack', MENUS.Snack[n % 2], 16)
    addMeal(n, 'Dinner', MENUS.Dinner[n % 3], 20)
    db.water_logs.push({ id: randomUUID(), user_id: U, date: iso(daysAgo(n)), ml: 2000 + Math.round(rnd() * 4) * 250 })
  }
  addMeal(0, 'Breakfast', MENUS.Breakfast[0], 8)
  addMeal(0, 'Lunch', MENUS.Lunch[0], 13)
  addMeal(0, 'Snack', MENUS.Snack[0], 16, false)
  db.water_logs.push({ id: randomUUID(), user_id: U, date: iso(daysAgo(0)), ml: 1750 })

  // ---- body
  for (let n = 70; n >= 0; n -= 3) {
    const trend = 82.4 - (70 - n) * 0.055
    const w = Math.round((trend + (rnd() - 0.5) * 0.6) * 10) / 10
    db.progress_entries.push({ id: randomUUID(), user_id: U, date: iso(daysAgo(n)), weight: w, notes: null, photo_path: null, created_at: at(n, 7, 30) })
  }
  for (const [n, waist, chest, arms] of [[63, 88, 104, 36.5], [35, 86.5, 104.5, 37], [7, 85, 105, 37.5]]) db.body_measurements.push({ id: randomUUID(), user_id: U, date: iso(daysAgo(n)), waist_cm: waist, chest_cm: chest, arms_cm: arms, hips_cm: 98, created_at: at(n, 7) })

  for (let n = 14; n >= 1; n--) {
    if (n % 7 === 0) continue
    const s = new Date(Date.parse(at(n + 1, 20, 30)))
    const hours = 16 + (n % 3 === 0 ? 2 : 0) + rnd() * 0.5
    db.fasting_sessions.push({ id: randomUUID(), user_id: U, start_time: s.toISOString(), end_time: new Date(s.getTime() + hours * 3600e3).toISOString(), target_hours: 16, created_at: s.toISOString() })
  }

  // Following a diet from Community saves your own copy of it and follows that.
  const official = db.diets.find((d) => d.name === 'Mediterranean')
  const med = { ...official, id: randomUUID(), user_id: U, is_shared: false, is_official: false, source_id: official.id, created_at: at(30, 9) }
  db.diets.push(med)
  for (const df of catalog.diet_foods.filter((x) => x.diet_id === official.id)) db.diet_foods.push({ diet_id: med.id, food_id: df.food_id })
  db.user_settings = [{
    user_id: U, ask_preworkout: false, diet_goal: 'deficit', calorie_goal: 2300, water_goal_ml: 2500, weight_goal: 76,
    current_weight: db.progress_entries.at(-1).weight, height_cm: 181, age: 29, sex: 'male', activity_level: 'moderate',
    unit_system: 'metric', theme: 'dark', color_palette: 'emerald', haptics_enabled: true, bottom_nav_tabs: [],
    health_data_consent_at: '2026-06-01T09:01:00Z', enabled_food_packs: [], active_diet_id: med.id,
    community_guidelines_accepted_at: '2026-06-02T09:00:00Z', hidden_community_users: [], timezone: 'Europe/Belgrade',
    updated_at: at(1, 9),
  }]
  return db
}
