# Google Play store listing

Everything Play Console → **Grow users → Store presence → Main store listing** asks for. Copy the text
blocks as-is; the character counts are checked against Play's limits.

## App details

**App name** (30 max, 30 used)

```
FitLog: Workout & Meal Tracker
```

**Short description** (80 max, 80 used)

```
Workout and meal tracker. Share your routines and diets, or save other people's.
```

**Full description** (4,000 max, 3,121 used)

```
FitLog is a workout log, meal and macro tracker, and fasting timer in one app, with a Community where people share the routines, recipes and diets that work for them.

COMMUNITY
• Share your workout presets, programs, recipes, meals, meal plans and diets to Community
• Browse what other people have shared, search by name or ingredient, and save a copy in one tap
• Anything you save is your own copy, so you can change it however you like
• Start from official diets like Mediterranean, DASH, Keto and plant-based, with sample meal plans
• Shared items never show your name or email

LOG YOUR TRAINING
• Log sets in seconds with big +/− steppers for weight and reps, with your last weight filled in for you
• Rate each set's effort (RPE) and mark warm-up sets
• A note on every workout, plus pinned notes on each exercise
• Built-in rest timer between sets
• Supersets and circuits, with rest after each full round
• Exercise history, personal records, and estimated 1-rep max charts
• Weekly training volume and a muscle map of what you worked
• Reusable workout presets, and programs that bundle presets and goals, ready to share
• Plate calculator for loading the bar

TRACK WHAT YOU EAT
• Meals with calories, protein, carbs, and fat, plus fiber, sugar, sodium, and other micronutrients
• Barcode scanner for packaged foods (powered by Open Food Facts)
• A food library you control: edit or delete the foods you add, tag any food with your own labels, and turn on regional product packs if you want them
• Custom foods, recipes that scale by servings, and meal presets with a dedicated editor to build and update them
• Follow a diet like Mediterranean, DASH, Keto or plant-based: its foods come first when you log, and off-diet foods are flagged
• Meal plans: log a whole day of meals in one tap, or combine days into a week
• Copy a whole day of meals in one tap
• Water and alcohol tracking
• Daily totals, trends, and a nutrition breakdown

REACH YOUR GOALS
• Maintenance-calorie (TDEE) calculator and calorie goals for cutting, maintaining, or bulking
• Body weight chart, body measurements, and progress photo comparisons
• Intermittent fasting timer with fasting-stage guides
• Streaks, rest days that keep your streak going, and achievements
• A weekly summary of your training and nutrition

MADE TO BE QUICK
• A + button to log a set, add a meal, or start a fast from anywhere
• Works offline and syncs when you're back online
• Light and dark themes, five accent colors, and metric or imperial units
• Export all of your data at any time

PRIVATE BY DEFAULT
Your logs are visible only to you, unless you choose to share a preset, recipe, or program. Foods you add are private to your account too. FitLog does not sell your data or share it for marketing. You can delete your account, and all of its data, from Settings or on the web.

ABOUT
FitLog is made and maintained by one developer. Questions, bug reports and ideas are welcome at departmentofone.app@gmail.com.

FitLog is a tracking tool, not medical advice. Talk to a professional before starting a new diet, fasting routine, or exercise program.
```

**Category:** Health & Fitness · **Tags:** Workout tracker, Calorie counter, Fitness, Nutrition, Intermittent fasting
**Contact email:** departmentofone.app@gmail.com · **Website:** https://fitlog-two-gamma.vercel.app ·
**Privacy policy:** https://fitlog-two-gamma.vercel.app/privacy

## Android package name

```
com.departmentofone.fitlog
```

`com.fitlog.app` (chosen 2026-09-20) turned out to already be reserved by someone else on Play -
Console rejected it with "This package name is already in use," even though no app is published
under it. Package names are a permanent, global namespace: once any app anywhere has ever used one,
it's gone forever for every developer, with no appeal. Switched to `com.departmentofone.fitlog`
(2026-09-22), matching the "Department of One" developer/publisher name.

**Permanent** once uploaded - it can never be changed, and it is what the Play Store URL
(`play.google.com/store/apps/details?id=com.departmentofone.fitlog`) is built from. Enter it in
PWABuilder instead of the default it suggests (`app.vercel.fitlog_two_gamma.twa`), which would bake
the temporary Vercel hostname into the ID forever. If this one also turns out to be taken, the
fallbacks are `app.departmentofone.fitlog`, then `com.deptofone.fitlog`.

After the first upload, write the app-link file with it:

```
node scripts/set-assetlinks.mjs com.departmentofone.fitlog <upload-key SHA-256> <Play app-signing SHA-256>
```

### Other PWABuilder settings

- **Start URL:** `/?source=play`. The app hides the Buy Me a Coffee link when it sees this marker
  or Chrome's `android-app://` referrer (`src/lib/platform.ts`). The marker covers phones where the
  app opens in something other than Chrome. Play's Payments policy doesn't allow a link to an
  outside payment page inside the app.
- **Target SDK:** API 36 (Android 16) or higher. Play has required it for new apps since
  31 Aug 2026.
- **Permissions:** the generated Android manifest must not contain
  `com.google.android.gms.permission.AD_ID` (see the Advertising ID answer in
  `PLAY_CONSOLE_ANSWERS.md`).

## Graphics

| Play asset | File | Spec check |
|---|---|---|
| App icon | `icon-512.png` | 512×512, 32-bit PNG, full square (Play rounds the corners) |
| Feature graphic | `feature-graphic-1024x500.png` | 1024×500, 24-bit PNG, no alpha |
| Phone screenshots (6) | `phone-screenshots/1-workouts.png` … `6-progress.png` | 1080×1920 (9:16), 24-bit PNG, ≤ 8 MB each |

Upload the screenshots in file-name order (1 Workouts, 2 Set logging, 3 Meals, 4 Community,
5 Diets, 6 Progress). Workouts, Set logging, Meals and Progress are also copied to
`public/screenshots/` for the PWA manifest's install sheet. Progress replaced the old More menu
shot, since the More menu no longer exists.

### How they were made
Captured on 28 Sep 2026 from the current build (the Train / Eat / Progress / Community layout)
running locally in headless Chrome at 360×640 and 3× scale, then saved as 24-bit PNGs with no alpha.
The app was signed in to a made-up demo account whose data was served from memory: six weeks of
Push/Pull/Legs training with a workout in progress, meals and water for today, a weight trend,
and the Mediterranean diet followed. Exercises, foods and the official Community diets, meal plans
and meals come from the seed SQL in `supabase/`, so the numbers match the real library (206 foods
on Mediterranean, 20 official Community items). No request reached Supabase and nothing personal
is shown.

The feature graphic keeps its logo, tagline and phone frames, with the new screenshots 1 and 4 in
the two phones.

The chip row was redrawn on 29 Sep 2026: "Free forever" and "No ads" became "Works offline" and
"Fasting timer", next to the existing "Diets & meal plans", so the graphic makes no pricing
promises. Re-upload it in Play Console.

### Nice to have (not required)
- 7-inch and 10-inch tablet screenshots (only if you want the listing to look good on tablets).
- A promo video (YouTube URL).
