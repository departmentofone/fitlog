# Design sync notes (FitLog -> Claude Design)

Project: "FitLog Design System" - https://claude.ai/design/p/3a5998d3-3386-4cc4-8c33-47e954828d74
First synced 2026-09-24: 16 components, all with authored previews graded good.

## How this repo is set up for the sync

- FitLog is an app, not a component library. `design-system/` is a small library entry made for
  this sync: `index.ts` re-exports only the self-contained UI pieces (no data hooks, no login) plus
  `FitLogTheme` (design-system/FitLogTheme.tsx), the root wrapper that sets `data-theme` /
  `data-palette` on <html> like the app's useApplyTheme does.
- Build it before every sync: `npm run build:ds` (cfg.buildCmd) - Vite library build + tsc
  declarations into `design-system/dist/` (gitignored). Then the converter with
  `--node-modules ./node_modules --entry ./design-system/dist/index.js --out ./ds-bundle`.
- `design-system/ds.css` imports `src/index.css` (the app's real Tailwind + token remaps + light
  theme + accent palettes) and undoes the app-shell rules (`html, body, #root` are overflow:hidden /
  height:100% in the app so the shell never scrolls - designs must scroll).
- `ds.css` also carries a Tailwind `@source inline(...)` safelist. Without it the compiled CSS only
  has classes the app itself uses, so designs using e.g. `w-80` or `grid-cols-4` rendered unstyled.
  The colour x opacity x variant combinations are deliberately trimmed (the untrimmed list made the
  CSS 900 KB; now ~290 KB / 35 KB gzip). Add families there if Claude Design keeps reaching for
  something missing.
- Sora: Google Fonts in the app (index.html link), so there is no @font-face in the CSS. The sync
  ships the variable woff2 files (latin + latin-ext, weight 400-800) from `design-system/fonts/`
  via cfg.extraFonts. Refresh them only if the app changes font.
- `vite.config.ts` sets `publicDir: false` - with the repo root as Vite's root, the app's public/
  (icons, privacy page) otherwise got copied into the library output.
- cfg.provider = FitLogTheme: preview cells render on a white card otherwise, which made `text-white`
  and the translucent dark cards invisible.
- cfg.dtsPropsFor covers ExplainerCard (`Explainer`) and MacroLine (`MacroTotals`) - their generated
  props referenced app types that don't exist in the bundle.

## Gotchas found while authoring previews

- CountUp animates from 0 over ~600ms, so captures caught it mid-count (1,328 instead of 1,333).
  Previews pass `durationMs={0}` (commented in the preview). That exposed a real bug - 0 divided by
  0 gave "NaN" - fixed in src/components/CountUp.tsx (durationMs <= 0 now snaps).
- A nested `FitLogTheme theme="light"` inside the provider doesn't show in a card: the outer
  provider's layout effect runs last and resets <html> to dark. Light/accents are documented in
  conventions.md rather than previewed.

## Known render warns

- None at first sync.

## Re-sync risks (what can silently go stale)

- The component list is hand-picked in `design-system/index.ts`. New self-contained components in
  src/ won't sync until they're added there (and get a preview in `.design-sync/previews/`).
- Components depending on app hooks (useUserSettings, Supabase queries) must NOT be added - they'd
  need a login in Claude Design. SwipeToDelete and GuidelinesSheet were left out on purpose (gesture
  / full-screen overlay).
- The safelist and conventions.md name classes; if src/index.css renames tokens (e.g. drops
  `text-on-accent` or `--color-success`), re-run the class check before uploading:
  `node .ds-sync/check-classes.mjs ds-bundle/_ds_bundle.css <classes>` (a helper script written
  into the gitignored .ds-sync/ - recreate it if missing).
- Previews use fixed dates (Sept 2026) for DateNav / MonthCalendar; MonthCalendar still highlights
  the real "today", so its card changes day to day (cosmetic only).
- Sora woff2 files were fetched from Google Fonts (v17) on 2026-09-24.
