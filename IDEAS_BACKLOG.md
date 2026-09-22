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
