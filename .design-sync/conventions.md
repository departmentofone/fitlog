# Building with FitLog

FitLog is a mobile-first workout, meal and macro tracker: dark by default, one accent colour,
frosted rounded cards, Sora for all text. Design phone screens (about 360-430px wide).

## Wrap every screen in `FitLogTheme` (once, at the root)

```jsx
<FitLogTheme theme="dark" accent="emerald">{/* screen */}</FitLogTheme>
```

It paints the app background and body font, and sets `data-theme` / `data-palette` on `<html>`,
which re-tints the whole Tailwind `slate` and `emerald` scales. Without it, `text-white` text sits on
a white page and cards disappear. `theme`: `"dark"` (default) | `"light"`. `accent`: `"emerald"`
(default) | `"violet"` | `"cyan"` | `"rose"` | `"amber"`. Only one theme per page - don't nest it.

## Styling: Tailwind utility classes, FitLog's vocabulary

No CSS-in-JS, no custom colours. Use `slate` for surfaces and text and `emerald` for the accent.
Never write hex colours: the slate/emerald classes are what flips for light mode and the user's
accent.

| Role | Classes |
|---|---|
| Card | `rounded-3xl border-t border-white/10 bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5` |
| Row inside a card | `rounded-xl bg-slate-800/60 px-3 py-2` |
| Heading / body / muted text | `text-white` / `text-slate-300` / `text-slate-400`, `text-slate-500` |
| Screen title | `text-xl font-semibold text-white` |
| Big number | `text-3xl font-bold text-white` (numbers are tabular by default) |
| Accent text / tinted pill | `text-emerald-400` / `rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400` |
| Primary button | `min-h-11 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-on-accent` |
| Secondary button | `min-h-11 rounded-xl bg-slate-800 px-4 text-sm font-medium text-slate-200` |
| "+ Add" button | `min-h-11 w-full rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-300` |
| Text input | `w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none` |
| Success / warning / error | `text-success` / `text-amber-400` / `text-red-400` |
| Macros (P / C / F) | `text-blue-400` / `text-amber-400` / `text-red-400` (or use `MacroLine`) |

Layout: `space-y-4 p-4` for a screen, `gap-2`/`gap-3` inside cards, `grid grid-cols-2` or
`grid-cols-3` for tiles. Tap targets are at least 44px tall (`min-h-11`). Utilities outside the
everyday Tailwind scale (arbitrary values, rare variants) may not be compiled; stick to the scale.

## Where the truth lives

`styles.css` imports `_ds_bundle.css` (FitLog's compiled Tailwind with its token remaps and the
light theme) and `fonts/fonts.css` (Sora). Read those before inventing styles. Each component's
`.prompt.md` shows real usage; `.d.ts` is its API.

## Components

`FireStreak` (streak pill), `CircularProgress` (goal ring: tone good/neutral/warn), `MacroLine`,
`CountUp` (animated number), `Toggle` (settings switch), `DateNav` (day switcher), `MonthCalendar`,
`EmptyState` (icon + one line), `SkeletonCard` / `SkeletonRow` / `SkeletonLine` (loading),
`ExplainerCard` (what-is-this box with an Example), `RestDayCard`, `Medal`, `TabIcon` (section icons).

## Example

```jsx
<FitLogTheme>
  <div className="space-y-4 p-4">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-white">Today</h2>
      <FireStreak count={9} label="day streak" />
    </div>
    <div className="rounded-3xl border-t border-white/10 bg-slate-900 p-4 shadow-lg shadow-black/20 ring-1 ring-white/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">Eaten</p>
          <p className="text-3xl font-bold text-white">1,333 <span className="text-base font-medium text-slate-400">kcal</span></p>
          <MacroLine macros={{ calories: 1333, protein: 97, carbs: 167, fat: 33 }} />
        </div>
        <CircularProgress percent={58} label="of goal" />
      </div>
    </div>
    <button className="min-h-11 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-on-accent">Log a meal</button>
  </div>
</FitLogTheme>
```
