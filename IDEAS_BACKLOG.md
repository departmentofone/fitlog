# Ideas backlog

Future features noted down but not being built yet - not scoped, not designed, just worth
remembering. Move an item into its own PLAN.md (like FOOD_SCANNER_PLAN.md) when it's actually
getting built.

## Browsable community food packs

2026-09-22: The Serbian food pack (migration_v22, later made private to one account in
migration_v23 - see [store-listing/README.md's git history / migration_v23] for why) suggested a
bigger idea: a place to **browse and install optional food packs other people made**, not just
regional ones. Examples: a "Serbian groceries" pack, a "keto" pack (macros-first, low-carb
products), a "Japan" pack of local ingredients someone living there put together, a "vegan
staples" pack, etc.

Rough shape, none of this designed yet:
- Packs would need to be genuinely public/shared content, unlike today's food_labels (private) or
  the current `foods.pack` column (a flag on shared-library rows, not something a regular account
  can publish).
- Needs a real submission/moderation story - letting any account publish a pack that shows up for
  everyone is a spam and bad-data risk (see how much care migration_v22's classification took just
  for one pack curated by hand).
- Could reuse meal_presets' existing `is_shared` sharing model as a starting point, generalized
  from "share with whoever has the link/knows you" to "publish, browsable by anyone."
- Worth checking what similar apps (MyFitnessPal, Cronometer, etc.) do for community food
  databases before designing this, same as other features have used competitor research.

Not started. Revisit once the app has more than one real user and there's an actual case for it.

## "Insights" tab: when you train and eat (pinned)

2026-09-24: A tab that turns *when* things are logged into habits you can see, e.g. "you usually
train around 18:40", "breakfast averages 08:15 on weekdays, 10:05 on weekends", "your latest meal is
creeping later". Working name **Insights** (clearer than "Stats", which suggests the History
numbers the app already has); "Patterns" or "Habits" are alternatives.

The data is already being collected - nothing to backfill:
- Every workout set, meal and food logged has `created_at` (UTC, set by the database). Workouts
  also have `workout_sessions.started_at` / `duration_seconds` from the session timer.
- Undo keeps an entry's original time (sets, whole workouts and meal foods are re-inserted with
  their old `created_at`), so deleting and restoring doesn't skew the numbers.
- `user_settings.timezone` (migration_v30) holds the phone's IANA time zone, kept current by the app,
  so times can be shown in local time.

Things to handle when it's built:
- `created_at` is when something was *entered*, not necessarily when it was eaten. Logging lunch at
  3pm reads as a 3pm lunch; consider an optional "eaten at" override if that turns out to matter.
- Bulk-created entries (Copy day, loading a preset, "Log this day" from a meal plan, program
  import) all get the time of the copy, not a real meal time - exclude or down-weight them. There's
  no flag for this yet; adding a `source` column would make it reliable.
- Backdated logging (entering yesterday's meals today) should use the meal's `date`, and probably be
  excluded from time-of-day averages.
- Only one time zone per account is stored, so travel shifts older entries; fine for a first
  version.
- Candidate cards: average gym start time, workout length trend, first/last meal of the day,
  eating window (pairs well with Fasting), weekday vs weekend, most consistent training day.

Not started. Pinned by the owner to come back to.
