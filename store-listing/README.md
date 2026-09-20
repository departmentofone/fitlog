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

**Full description** (4,000 max, ~2,300 used)

```
FitLog is a workout log, meal and macro tracker, and fasting timer in one app. It's completely free: no ads, no paywalls, and no premium tier. Every feature is available to everyone.

LOG YOUR TRAINING
• Log sets in seconds with big +/− steppers for weight and reps, with your last weight filled in for you
• Rate each set's effort (RPE) and mark warm-up sets
• Built-in rest timer between sets
• Supersets and circuits, with rest after each full round
• Exercise history, personal records, and estimated 1-rep max charts
• Weekly training volume and a muscle map of what you worked
• Reusable workout presets, and programs that bundle presets and goals to share
• Plate calculator for loading the bar

TRACK WHAT YOU EAT
• Meals with calories, protein, carbs, and fat, plus fiber, sugar, sodium, and other micronutrients
• Barcode scanner for packaged foods (powered by Open Food Facts)
• Custom foods, recipes that scale by servings, and meal presets
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
Your logs are visible only to you, unless you choose to share a preset, recipe, or program. FitLog has no ads, no trackers, and no data selling. You can delete your account, and all of its data, from Settings or on the web.

WHY IT'S FREE
FitLog started as a personal project and grew into something worth sharing. There are no premium plans and there never will be, because nobody should be locked out of a feature.

FitLog is a tracking tool, not medical advice. Talk to a professional before starting a new diet, fasting routine, or exercise program.
```

**Category:** Health & Fitness · **Tags:** Workout tracker, Calorie counter, Fitness, Nutrition, Intermittent fasting
**Contact email:** msolarovsocial@gmail.com · **Website:** https://fitlog-two-gamma.vercel.app ·
**Privacy policy:** https://fitlog-two-gamma.vercel.app/privacy

## Android package name

```
com.fitlog.app
```

Chosen 2026-09-20; checked as unused by any published Play app. **Permanent** once uploaded - it
can never be changed, and it is what the Play Store URL
(`play.google.com/store/apps/details?id=com.fitlog.app`) is built from. Enter it in PWABuilder
instead of the default it suggests (`app.vercel.fitlog_two_gamma.twa`), which would bake the
temporary Vercel hostname into the ID forever.

After the first upload, write the app-link file with it:

```
node scripts/set-assetlinks.mjs com.fitlog.app <upload-key SHA-256> <Play app-signing SHA-256>
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
