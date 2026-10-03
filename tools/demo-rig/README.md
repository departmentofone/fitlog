# Demo rig

A way to run the real app against a fake account, so you can take screenshots, review designs or
check a change on every screen without touching the live database. It made the Play Store
screenshots in September and drove the full design review on 3 October 2026.

It starts headless Chrome on the local dev server (`npm run dev`, port 5173) and answers every
Supabase request itself, from an in-memory database: about six weeks of Push/Pull/Legs training
with a workout in progress today, meals and water, a weight trend, fasts, and the Mediterranean
diet followed. The exercises, foods and official Community items come from the repo's own seed SQL
(`catalog.json`, built by `extract.py`), plus the official workouts and programs from
migration_v35 (`official_v35.json`). Nothing is sent anywhere: requests to other sites fail, apart
from Google Fonts.

## Running it

With the dev server running:

```bash
cd tools/demo-rig
node server.mjs
```

It prints `rig ready on :9400`. Set `RIG_PORT` to run a second one alongside, `OUT_DIR` to put its
screenshots somewhere else, and `CHROME` if Chrome isn't in the default Windows location. On this
PC it needs to run outside Claude Code's sandbox.

Then, from another shell in the same folder:

```bash
. ./review.sh
go meals
shot meals
tall meals-full
```

- `go <route>` opens a screen (`workouts`, `meals`, `goals`, `settings`...)
- `shot <name>` saves the current view to `out/<name>.png`; `tall <name>` saves the whole scrolled screen
- `vp <width> <height> <scale>` changes the phone size (the rig starts at 360 × 640 at 3x)
- `tap "Text"` and `tapt "Text"` press a button by its label
- `ev 'javascript'` runs code in the page and prints the result
- `curl -s localhost:9400/log` shows console errors since the last call
- `curl -s "localhost:9400/reload?route=meals"` starts over with fresh demo data; add `&empty=1` for
  a brand-new account with nothing logged
- `curl -s localhost:9400/quit` stops it

`shoot.sh` makes the six Play Store screenshots in one go. `a11y.js` is an in-page check for
unlabelled controls and inputs, small tap targets and heading order: `ev "$(cat a11y.js)"`.

## Keeping it current

When the database changes (a new table or column the app reads), add it to `demo.mjs` or the app
will get empty results for it in the rig. When the seed SQL changes, rerun `python extract.py`.
