# Google Play store listing

Everything Play Console → **Grow users → Store presence → Main store listing** asks for. Copy the text
blocks as-is; the character counts are checked against Play's limits.

## App details

**App name** (30 max, 30 used)

```
FitLog: Workout & Meal Tracker
```

**Short description** (80 max, 73 used)

```
Free workout, meal & macro tracker. No ads, no paywalls, no premium tier.
```

**Full description** (4,000 max, ~2,941 used)

```
FitLog is a workout log, meal and macro tracker, and fasting timer in one app. It's completely free: no ads, no paywalls, and no premium tier. Every feature is available to everyone.

LOG YOUR TRAINING
• Log sets in seconds with big +/− steppers for weight and reps, with your last weight filled in for you
• Rate each set's effort (RPE) and mark warm-up sets
• A note on every workout, plus pinned notes on each exercise
• Built-in rest timer between sets
• Supersets and circuits, with rest after each full round
• Exercise history, personal records, and estimated 1-rep max charts
• Weekly training volume and a muscle map of what you worked
• Reusable workout presets, and programs that bundle presets and goals
• Plate calculator for loading the bar

TRACK WHAT YOU EAT
• Meals with calories, protein, carbs, and fat, plus fiber, sugar, sodium, and other micronutrients
• Barcode scanner for packaged foods (powered by Open Food Facts)
• A food library you control: edit or delete the foods you add, tag any food with your own labels, and turn on regional product packs if you want them
• Custom foods, recipes that scale by servings, and meal presets with a dedicated editor to build and update them
• Follow a diet like Mediterranean, DASH, Keto or plant-based: its foods come first when you log, and off-diet foods are flagged
• Meal plans: log a whole day of meals in one tap, or combine days into a week
• Community: browse diets, meal plans, recipes and workouts others have shared, plus official ones, and save a copy in one tap
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
• Customizable bottom bar with the sections you use most
• Works offline and syncs when you're back online
• Light and dark themes, five accent colors, and metric or imperial units
• Export all of your data at any time

PRIVATE BY DEFAULT
Your logs are visible only to you, unless you choose to share a preset, recipe, or program. Foods you add are private to your account too. FitLog has no ads, no trackers, and no data selling. You can delete your account, and all of its data, from Settings or on the web.

WHY IT'S FREE
FitLog started as a personal project and grew into something worth sharing. There are no premium plans and there never will be, because nobody should be locked out of a feature.

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

## Graphics

| Play asset | File | Spec check |
|---|---|---|
| App icon | `icon-512.png` | 512×512, 32-bit PNG, full square (Play rounds the corners) |
| Feature graphic | `feature-graphic-1024x500.png` | 1024×500, 24-bit PNG, no alpha |
| Phone screenshots (4) | `phone-screenshots/1-workouts.png` … `4-more.png` | 1080×1920 (9:16), 24-bit PNG, ≤ 8 MB each |

Upload the screenshots in file-name order. The same four images (with alpha) live in
`public/screenshots/` for the PWA manifest's richer install sheet.

### How they were made
Captured from the real app (the developer's own account, 15 Sep 2026) at a 360×640 viewport and 3×
scale, rendered with the Sora font embedded. The feature graphic is composed from the first two
screenshots. To re-shoot after a redesign, follow the same approach: a 360×640 viewport, DOM → PNG
at scale 3, then flatten the alpha channel with sharp for Play.

**Before uploading, check you're happy publishing what's visible:** exercise names, weights, and
meal totals from your real log (no email address or other personal identifiers appear).

### Nice to have (not required)
- 7-inch and 10-inch tablet screenshots (only if you want the listing to look good on tablets).
- A promo video (YouTube URL).
