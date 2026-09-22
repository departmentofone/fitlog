# Food Barcode Scanner — Implementation Plan

Status: planning only, no code written. Target: point the phone camera at a packaged
food's barcode, look up nutrition info, and either log it directly to a meal or
prefill the existing "create custom food" form.

This document is meant to be handed to whoever implements the feature later. It
assumes familiarity with the existing food-logging flow in
`src/features/meals/FoodPicker.tsx`, `src/hooks/useFoods.ts`, and the `foods` table.

---

## 0. Current state (for context)

- Food logging today: `FoodPicker` (`src/features/meals/FoodPicker.tsx`) is opened
  from inside `MealCard.tsx` per-meal. It lets the user search `foods` by name
  (`useFoodSearch` in `src/hooks/useFoods.ts`), pick one, choose grams or a
  `common_servings` entry, and call `onAdd({ foodId, grams, servingLabel })`. If no
  match exists, "+ New food" opens `NewFoodForm`, which calls `useCreateFood()` to
  insert a row into `foods` (macros per 100g + optional micros + one common serving).
- `foods` table (`supabase/migration.sql` + `update_foods_micros.sql`): per-100g
  macros (`calories_per_100g`, `protein_per_100g`, `carbs_per_100g`, `fat_per_100g`),
  a `common_servings jsonb` array, and per-100g micros (`fiber_g`, `sugar_g`,
  `sodium_mg`, `cholesterol_mg`, `potassium_mg`, `calcium_mg`, `iron_mg`,
  `vitamin_c_mg`, `vitamin_a_mcg`). RLS: rows are either global (`user_id is null`,
  presumably seeded) or owned by the creating user; everyone can `select` global +
  own rows, but only mutate their own.
- Bottom navigation (`src/components/Layout.tsx`): `PINNED_TABS = ['workouts',
  'meals']` are always shown. `BOTTOM_NAV_CHOICES` is every other tab (`diet`,
  `goals`, `achievements`, `programs`, `misc` today), and the user picks up to
  `MAX_BOTTOM_NAV_EXTRAS = 2` of those to show alongside the pinned tabs
  (`src/hooks/useUserSettings.ts`-backed `bottom_nav_tabs`). Tabs are registered in
  `src/types.ts`'s `Tab` union and routed via a plain `tab === 'x'` chain in
  `src/App.tsx`, lazy-loaded per feature folder.
- Stack: no Capacitor/Cordova wrapper in this repo. The Android release is a
  TWA (Trusted Web Activity) built externally (Bubblewrap/PWABuilder) against the
  Vercel-hosted origin — there's no `android/` folder or `twa-manifest.json`
  checked in here, so Android-side manifest changes happen in that separate
  packaging step, not in this repo. iOS is an installed home-screen PWA
  (`vite-plugin-pwa`, `display: standalone`) for the developer's personal phone only.

---

## 1. Barcode detection approach

### Option A — native `BarcodeDetector` Web API
- Supported today (per caniuse, checked live): **Chrome for Android is fully
  supported as of Chrome 152**, and it's been usable on Android Chrome since
  roughly Chrome 83, because the actual decoding is delegated to **Google Play
  Services** ("Barcode Detection in Google Play services" —
  https://android-developers.googleblog.com/2015/08/barcode-detection-in-google-play.html).
  That means it only works on devices with GMS installed (true for the vast
  majority of Play Store Android phones, but not on GMS-less/AOSP forks).
- **Desktop Chrome/Edge is only partially supported** (no full rollout as of
  checking caniuse for versions 83–155), and it is not something to depend on for
  a desktop fallback.
- **Safari (desktop and iOS) does not support it at all.** caniuse marks it
  "disabled by default" for Safari 17+, and this has been true for years with no
  Apple commitment to ship it (see community writeups such as
  https://dev.to/ilhannegis/barcode-scanning-on-ios-the-missing-web-api-and-a-webassembly-solution-2in2).
  Since the developer personally uses an installed iOS PWA, relying on native
  `BarcodeDetector` alone would leave the feature completely broken on their own
  phone.

Sources: https://caniuse.com/mdn-api_barcodedetector,
https://caniuse.com/mdn-api_barcodedetector_detect,
https://android-developers.googleblog.com/2015/08/barcode-detection-in-google-play.html

### Option B — WASM polyfill (ZXing-C++ via WebAssembly)
- `@sec-ant/barcode-detector` (https://github.com/Sec-ant/barcode-detector,
  https://www.npmjs.com/package/@sec-ant/barcode-detector) implements the exact
  `BarcodeDetector` interface as a ponyfill/polyfill backed by
  `zxing-wasm` (https://github.com/Sec-ant/zxing-wasm), a WebAssembly build of the
  well-maintained ZXing-C++ decoder. It works everywhere WebAssembly + camera
  access work, including iOS Safari, and its `.wasm` binary can be self-hosted
  (via `setZXingModuleOverrides`) instead of pulled from jsDelivr at runtime,
  which matters for a Vercel-hosted app that wants a predictable CSP and offline
  behavior.

### Recommendation
**Use the polyfill (`@sec-ant/barcode-detector`) as the single code path, not a
native-first-with-fallback split.** Concretely:

- Feature-detect `window.BarcodeDetector` and only import/instantiate the
  polyfill when it's missing (i.e. real native detector on newer Android Chrome,
  else the WASM decoder — the package supports exactly this "ponyfill" usage
  pattern). This avoids shipping/initializing a ~1-2MB wasm module on devices
  that already have a fast native implementation, while guaranteeing the iOS PWA
  (the developer's own daily-driver install) actually works.
- Do **not** try to special-case "Android TWA vs iOS PWA" in the app logic — the
  feature-detection above naturally does the right thing on both, and avoids
  hard-coding assumptions that will drift as Chrome's rollout changes.
- Feed frames from a `<video>` element (via `getUserMedia`) into
  `detector.detect(videoFrame)` in a `requestAnimationFrame` loop, same pattern
  ZXing/BarcodeDetector demos use (e.g.
  https://github.com/tony-xlh/barcode-detection-api-demo). Constrain to
  `facingMode: 'environment'` and to barcode formats actually used on retail
  packaging (`ean_13`, `ean_8`, `upc_a`, `upc_e`; optionally `code_128` for some
  bulk/deli labels) to keep the decode loop cheap — don't request all formats.

---

## 2. Nutrition-by-barcode lookup API

### Primary: Open Food Facts (OFF)
- **No API key needed for reads.** Endpoint for a single barcode lookup:
  `GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json` (per the
  official API docs: https://openfoodfacts.github.io/openfoodfacts-server/api/).
- **Rate limits (per the official docs, current as checked):** 15 req/min/IP for
  product-by-barcode GETs, 10 req/min/IP for search queries — and importantly,
  **"if your requests come from your users directly (e.g. a mobile app), the
  limits apply per user."** Since barcode lookups here will be called
  client-side from each installed PWA/TWA instance (not proxied through a
  shared FitLog backend IP), each user gets their own budget — a single user
  scanning groceries will not realistically hit 15 lookups/minute. (Note: other
  sources quote different numbers, e.g. a third-party blog citing 100/min for
  GETs — treat the official docs page as authoritative and re-check before
  launch in case limits change.)
- **Required header:** set a descriptive `User-Agent` in the form
  `AppName/Version (contact-email)`, e.g. `FitLog/1.0 (departmentofone.app@gmail.com)`
  — this is explicitly requested by OFF's API docs so they can identify and
  whitelist/contact well-behaved clients instead of blocking them.
- **License / attribution (ODbL):** OFF's terms of use
  (https://world.openfoodfacts.org/terms-of-use) require that any reuse "mention
  the licence and attribute the authorship to Open Food Facts with a link to
  https://openfoodfacts.org" (or the specific product page). The database
  structure is ODbL, individual facts are under the Database Contents License,
  and product **images** are separately CC BY-SA. Commercial use is explicitly
  allowed under ODbL as long as attribution is given and, if you redistribute a
  derivative *database*, it's shared alike.
  - **Does FitLog's donate-button model change anything?** No — ODbL's
    commercial-use permission isn't conditioned on being free vs. paid;
    attribution is required either way. The more relevant question is whether
    caching looked-up products into FitLog's own `foods` table counts as
    "redistributing the database" (which would trigger share-alike). The terms
    page doesn't spell this out precisely (this is a genuinely open question —
    ODbL's share-alike is usually understood to apply to redistributing the
    *database itself*, not to an app merely displaying/using facts it looked up
    for its own users — "produced works" are treated differently under ODbL,
    but this app-specific nuance isn't confirmed anywhere in OFF's own docs).
    **Safe, low-effort compliance path:** show a persistent, unobtrusive
    "Nutrition data via Open Food Facts (ODbL)" credit with a link somewhere
    reachable from the scanner (e.g. a small line in the scan-result/create-food
    screen, or once in an About/Settings screen), and don't claim the imported
    numbers as FitLog's own proprietary data. Do not bulk-mirror the OFF dataset
    or resell/relicense it. If the developer wants certainty rather than a
    reasonable-effort reading, OFF has a forum thread specifically for this
    (https://forum.openfoodfacts.org/t/conditions-to-use-the-open-food-facts-api/443)
    and is generally responsive to "can I do X" questions before launch.
- **Known weakness — regional coverage:** OFF is crowdsourced (barcode scans +
  photographed labels from its own contributor community), and coverage is
  strongly correlated with contributor density per country. Western Europe
  (France especially, where OFF originated) and North America are well covered;
  I could not find any OFF-published per-country coverage statistics for Serbia
  or the wider Balkans specifically (searched; nothing authoritative turned up
  beyond OFF's own general "3M+ products, 200+ countries" headline figure, which
  says nothing about depth in any one country). Given the developer already
  maintains several Serbia-specific seed files in this repo
  (`supabase/seed_foods_serbian_everyday.sql`,
  `seed_foods_serbian_stores.sql`, `seed_foods_skroz_dobra_pekara.sql`,
  `seed_foods_suhomesnato.sql`), the realistic expectation is that **imported,
  Western-brand packaged goods (Coca-Cola, Nutella, most EU supermarket private
  labels sold under the same barcode across the EU) will resolve fine, while
  small Serbian-only brands, local bakeries, and butcher-counter products will
  frequently miss.** This matches the developer's own evident experience
  needing to hand-seed local foods already.
- **Fallback on a miss:** treat "not found in OFF" as an expected, common case,
  not an error state — see the UX flow below (§3) for exactly what happens:
  prefill the barcode into the existing "create custom food" form so the user's
  manual entry gets captured under that barcode for next time.

### Other options considered
- **USDA FoodData Central** — free, high-quality, but US-centric (branded foods
  are mostly US products) and does not primarily key its branded-food dataset by
  scannable retail barcode/GTIN as reliably as OFF does for international
  products; weaker fit than OFF for a Serbian user base. Worth knowing about as
  a secondary source for common raw ingredients but not as the barcode-lookup
  primary.
- **Commercial nutrition-by-barcode APIs** (e.g. Nutritionix, Edamam,
  Spoonacular, Passio) typically require paid tiers or API keys with request
  caps at meaningful volume, add a vendor dependency and possibly a per-call
  cost for a free app with just a donate button, and were not researched further
  since OFF is free, keyless, and sufficient for a v1. Worth a second look only
  if OFF's Serbian coverage proves unacceptably sparse in practice.

**Recommendation:** Open Food Facts only for v1. Add the attribution line, set the
descriptive User-Agent, and lean on the "create custom food" fallback for misses
rather than adding a second paid API up front.

---

## 3. UI/UX flow

### Entry point: dedicated "Scanner" tab vs. a button inside FoodPicker

| | Dedicated bottom-nav tab | Button inside `FoodPicker` |
|---|---|---|
| Matches developer's own framing | Yes — they explicitly suggested "Scanner" as a tab | No |
| Nav slot cost | Competes for 1 of only 2 `MAX_BOTTOM_NAV_EXTRAS` slots against `diet`, `goals`, `achievements`, `programs`, `misc` (`src/components/Layout.tsx`) — a real cost given only 2 slots exist for 6 candidates | Free — no nav changes at all |
| Discoverability | High — permanent, one tap from anywhere, good for a "grab your phone, scan the fridge" habit | Lower — only discoverable when already mid-way through adding a food to a specific meal |
| Fits the "log directly to a meal" requirement | Needs extra state: which meal is the scan going into? (today, `FoodPicker` only exists *inside* a specific `MealCard`, scoped to one meal) | Natural fit — already scoped to the meal being edited |
| Fits the "prefill create-custom-food" requirement | Fits equally well either way | Fits equally well either way |

**Recommendation: do both, cheaply.** Build the scanner as one shared component/hook
(e.g. `useBarcodeScanner` + `BarcodeScannerView`) and mount it from two entry
points:
1. A new button inside `FoodPicker`'s top-level search screen (next to "+ New
   food"), e.g. "Scan barcode" — this is the zero-nav-cost, already-in-context
   path, and covers "log directly to a meal" cleanly since `FoodPicker` already
   knows which meal it's adding to.
2. The requested standalone **"Scanner" tab**, added to `BOTTOM_NAV_CHOICES` in
   `Layout.tsx` (not pinned — let it compete for one of the 2 extra slots like
   everything else) for the "grab phone, scan something, decide what to do with
   it later" case where the user isn't already mid-meal-edit. From this
   standalone tab, a successful scan should let the user either pick which meal
   to log into (a lightweight meal picker, mirroring what `MealsTab`/`MealCard`
   already do) or just save/create the custom food without logging it anywhere
   yet.

This avoids forcing a nav-slot decision the developer didn't ask for while still
delivering the literal "Scanner tab" they asked for.

### Step-by-step flow

1. **Entry** — user taps "Scan barcode" (in `FoodPicker`) or opens the "Scanner"
   tab.
2. **Camera view** — request camera permission (see §4) if not already granted;
   show a live `<video>` preview with a viewfinder box overlay; run the
   detect-loop from §1 against `environment`-facing camera frames.
3. **Detection** — on a decoded barcode (debounce/require 2-3 consecutive
   identical reads to avoid a garbled one-frame misread), stop the camera,
   haptic/sound tick if easy, and move to lookup.
4. **Lookup** —
   a. First check FitLog's own `foods` table for a row with that barcode (see
      §5 schema change) — covers previously-scanned/created items instantly and
      for free, no network call.
   b. If not cached, call Open Food Facts by barcode (§2). Show a brief loading
      state (this is a live network call on the user's connection).
5. **Lookup hit** — show a confirm screen: product name/brand/image (OFF
   provides an image URL) and the per-100g macros mapped into FitLog's `Food`
   shape, with:
   - an amount-entry step reusing the existing `AmountForm` pattern from
     `FoodPicker.tsx` (grams or OFF's `serving_size` if present, mapped to a
     `common_servings` entry), and
   - **"Add to meal"** (only when entered from the meal-scoped path) or
     **"Save food"** (when entered from the standalone tab), which persists the
     product into `foods` (with `barcode` set) via a barcode-aware variant of
     `useCreateFood`, so the second scan of the same product is an instant
     cache hit.
6. **Lookup miss** (barcode not in OFF, or OFF has the product but is missing
   required macro fields) — do **not** dead-end. Route straight into the
   existing `NewFoodForm` (`FoodPicker.tsx`) with the scanned `barcode`
   pre-filled as a hidden field, so:
   - the user fills in name/macros manually as they already do today for any
     unknown food,
   - the resulting row is saved with that barcode attached, so **the very next
     scan of the same product in the future is an instant local hit** — this is
     the main lever against OFF's weak Serbian-brand coverage (§2).
7. **Errors** (camera permission denied, no camera hardware, OFF request
   failed/timed out, offline) — each falls back to the same `NewFoodForm` path
   with a short inline reason, rather than a blocking error screen, and offline
   should still allow the "check FitLog's own cached `foods` by barcode" step
   in 4(a) since that's just a local Supabase read... note this still needs
   network for Supabase itself unless using the app's existing offline/query
   persistence layer (`@tanstack/react-query-persist-client` is already a
   dependency here, so a previously-fetched-and-cached food-by-barcode lookup
   could plausibly resolve offline via the query cache — worth confirming
   against however `useFoodSearch` already behaves offline today, rather than
   building new offline logic from scratch for this feature).

---

## 4. Permissions & PWA considerations

### Camera permission mechanics differ meaningfully by shell — this is the biggest risk area

- **HTTPS** — already satisfied; the app is on Vercel and `getUserMedia`/
  `BarcodeDetector` both require a secure context, which is a non-issue here.
- **Installed iOS PWA (developer's own phone)** — camera access via
  `getUserMedia` inside a home-screen-installed PWA works in modern iOS Safari
  the same as in-browser Safari, subject to the normal per-origin permission
  prompt. This is the lower-risk path and should be the first one validated
  during development.
- **Android TWA — a real, currently-open risk.** A TWA is not a WebView with
  custom permission plumbing you control; camera/microphone permission requests
  from the page are meant to be transparently delegated to Chrome's own
  per-origin permission system (the same prompt as if the user visited the site
  in Chrome directly). However, there is a **documented, apparently-unresolved
  regression**: GoogleChrome/android-browser-helper issue #464
  (https://github.com/GoogleChrome/android-browser-helper/issues/464, opened
  March 2024) reports that **starting at Chrome 122, the camera permission
  prompt simply does not appear inside a TWA**, even though the identical page
  works fine when opened directly in Chrome or in a non-trusted WebView. The
  issue's current state on GitHub is ambiguous (shows as closed but with no
  documented fix/resolution comment visible), and no later Chrome-version fix
  was found in searching. **This directly threatens the primary (Android TWA)
  launch target** — if it reproduces on the developer's packaging, users could
  see a scanner that just shows a black camera view with no way to grant
  permission, with no on-page error to explain why.
  - **Action item, not optional:** before shipping, build/side-load an actual
    signed TWA (via whatever Bubblewrap/PWABuilder setup is used for the Play
    Store release) with a throwaway camera-permission test page, on a real
    device with current Chrome, and confirm the prompt actually appears and
    `getUserMedia` resolves. Do not assume it works based on this being "just
    the web camera API" — the TWA layer is exactly where this has broken for
    other developers.
  - If it reproduces: workarounds to investigate at that point include (a)
    pre-declaring `android.permission.CAMERA` in the wrapped app's
    `AndroidManifest.xml`/`twa-manifest.json` so the OS-level permission is at
    least grantable (this is necessary but may not be sufficient given the
    issue describes the in-page prompt itself not firing), (b) testing across
    a couple of Chrome versions/devices since TWA bugs like this are sometimes
    device/OEM-WebView-version specific, and (c), as a last resort, having the
    Scanner feature detect a permission dead-end and show a manual "type the
    barcode number" text input as a fallback path into the same lookup flow —
    cheap to add and makes the feature non-blocking even if the camera path is
    flaky on some Android/Chrome combination.
- **Play Store Data Safety form implications:**
  - The `CAMERA` permission will automatically surface in the Play Store
    listing's "App permissions" / "About this app" section once it's present in
    the wrapped app's manifest — this is independent of how the Data Safety
    form is filled out, and cannot be hidden.
  - Because Google Play requires a privacy policy whenever an app requests a
    sensitive permission like `CAMERA`
    (per Play Console's permissions/privacy-policy guidance), **FitLog needs a
    published privacy policy URL** if it doesn't already have one for the Play
    listing (check current listing setup — this may already be satisfied if
    Play Store submission has already begun, but flagging in case it hasn't).
  - For the Data Safety section itself: since barcode decoding happens
    transiently, client-side, from live camera frames, and **no photo/video is
    stored or transmitted anywhere** (only the decoded barcode digits are sent
    to Open Food Facts, and only nutrition facts come back), this should *not*
    require declaring "Photos and videos" as a collected personal-data category
    in the Data Safety form — that category is about the app collecting/storing/
    sharing camera-captured media, not about requesting camera access per se.
    This reasoning should be sanity-checked against Play Console's current Data
    Safety form UI at submission time rather than taken as certain, since
    Google's policy pages describe general principles rather than this specific
    scenario in so many words.

---

## 5. Effort estimate

### Schema
- Add `barcode text` (nullable, indexed) to `foods` — new migration file
  following the existing pattern (`migration_v12_add_barcode.sql` or similar,
  matching how `update_foods_micros.sql` etc. were added incrementally rather
  than editing `migration.sql` in place). Add a non-unique index on `barcode`
  (not unique — two users could independently create a custom food entry for
  the same barcode, or OFF could return slightly different data on retry) to
  make the "check cache before hitting OFF" lookup in §3 step 4(a) fast.
- No changes needed to `meal_items`/`meals` — logging a scanned food is still
  just "create/find a `foods` row, then add a `meal_items` row," identical to
  today's flow.

### New code (rough shape, no code written yet)
- `src/hooks/useBarcodeScanner.ts` — wraps camera stream setup/teardown,
  feature-detects native vs. polyfilled `BarcodeDetector` (§1), runs the
  detect loop, returns the decoded value once confidently read.
- `src/hooks/useFoodByBarcode.ts` (or extend `useFoods.ts`) — checks local
  `foods` table by `barcode` first, then calls the Open Food Facts API,
  mapping its response fields (`product.nutriments.energy-kcal_100g`,
  `proteins_100g`, `carbohydrates_100g`, `fat_100g`, `fiber_100g`, `sugars_100g`,
  `sodium_100g` or `salt_100g` depending on which the product provides, etc.)
  into the shape `useCreateFood`'s `CreateFoodInput` already expects. Extend
  `CreateFoodInput`/`useCreateFood` to accept and persist the optional
  `barcode` field.
- `src/features/scanner/BarcodeScannerView.tsx` — the camera preview +
  viewfinder + lookup-result confirm screen, reusing `AmountForm`-style amount
  entry (either by extracting it from `FoodPicker.tsx` into a shared component,
  or duplicating the small amount of logic — extracting is cleaner given it'll
  now be used from two places).
- `src/features/scanner/ScannerTab.tsx` — the standalone tab: mounts
  `BarcodeScannerView`, adds the lightweight "which meal (if any)" picker for
  the direct-log path, handles the "just save the food" path otherwise.
- Wire into `src/components/Layout.tsx` (`TABS`, leave `PINNED_TABS` alone,
  it naturally joins `BOTTOM_NAV_CHOICES`), `src/types.ts` (`Tab` union), and
  `src/App.tsx` (lazy import + route line), following the exact pattern every
  existing tab already uses — mechanical, low-risk changes.
- A small edit to `FoodPicker.tsx` to add the "Scan barcode" entry button and
  swap in `BarcodeScannerView` in place of its own screen when active.
- New dependency: `@sec-ant/barcode-detector` (and its `zxing-wasm` peer,
  pulled in transitively) — check its bundle/wasm size impact and confirm it
  plays nicely with `vite-plugin-pwa`'s `injectManifest` precache glob
  (`globPatterns: ['**/*.{js,css,html,svg,png,ico}']` in `vite.config.ts`
  currently does **not** include `.wasm`, so this glob will need updating or
  the wasm asset will silently fail to precache — worth explicitly checking on
  implementation, not just assuming it works offline).

### Sizing
This is a **medium-sized feature**, not a small bolt-on: 1 schema migration, 2
new hooks, 2-3 new components, small edits to 3-4 existing files (`Layout.tsx`,
`types.ts`, `App.tsx`, `FoodPicker.tsx`, `useFoods.ts`), one new dependency, and
non-trivial testing surface (needs verification on both a real installed
Android TWA build and the developer's iOS PWA — this cannot be fully verified
in a desktop browser tab, and the TWA camera-permission risk in §4 specifically
means "works in `npm run dev`" is not sufficient proof it will work in
production). The nutrition-field-mapping step (OFF → FitLog's `Food` shape) is
fiddly but low-risk grunt work, not a design problem. The single biggest
uncertainty is the TWA camera permission behavior (§4) — that should be spiked
first, before investing in the rest of the UI, since if it's broken on the
target Chrome version it may force a different approach (e.g. shipping a
"type the barcode manually" fallback as a first-class path rather than an
edge case).

---

## Open questions for the developer

1. Is there already a published privacy policy URL for the Play Store listing?
   If not, that's a prerequisite for shipping any camera-permission feature,
   independent of this plan.
2. Should the standalone "Scanner" tab's "save without logging" path create a
   food silently, or should it always require picking a meal (i.e. is
   "just build up my custom food library by scanning my pantry" a real use
   case worth supporting)?
3. Worth spiking the TWA camera-permission risk (§4) before committing to the
   rest of the build — does the developer want that spike done first as a
   separate, small task?
