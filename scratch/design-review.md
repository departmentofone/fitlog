# FitLog Design Directions — Review

Reviewed by rendering `scratch/design-directions.html` in-browser at a 375×812 mobile
viewport (Vite dev server, `localhost:5173`) and inspecting each of the 10 directions'
six shared components (header, bottom nav, stat card, button row, list item, input +
segmented control), cross-referenced against the actual CSS custom properties each
direction sets. Scored 1–10 against: (1) competitive visual fidelity, (2) internal
consistency, (3) avoidance of generic-AI tells, (4) practicality in real Tailwind, (5)
real elevation/depth on cards and buttons — the specific brief given to the design
agent.

---

## 01 — Blackout (Whoop) — **7/10**

True black canvas, monospace stat digits, a single emerald signal color, hairline
`rgba(255,255,255,.09)` dividers — this is a faithful, confident read of Whoop's actual
minimalism and it holds up next to it in a screenshot. But it sets `--shadow: none` on
every card and button, so the stat card and list item are distinguished from the page
only by a one-shade-lighter fill (`#0a0a0a` vs `#000`) — there is no elevation system
here at all, which is a direct miss on the brief's explicit ask for real depth. Internally
consistent and cheap to build (flat fills, no shadow math), but it reads as "faithful
homage" rather than a system that was pushed anywhere new.

**Verdict:** promising but needs work — needs an actual elevation pass before it's shippable.

## 02 — Ledger (Strong) — **7/10**

Clean white-on-white Inter system with tabular numerals and an orange accent used
sparingly — genuinely looks like it could sit next to Strong's own screenshots, and the
restraint (one accent, only where it matters) is the right instinct. The card shadow
(`0 1px 2px rgba(0,0,0,.05)`) is so subtle it borders on invisible at mobile screen
brightness — on a real device this will likely read as flat, not "quietly elevated."
Extremely practical to build; the risk is purely that the depth is too timid to notice.

**Verdict:** promising but needs work — turn up the elevation just slightly and this ships.

## 03 — Recovery Map (Fitbod) — **6.5/10**

The directional gradient glow on the stat card (`linear-gradient(160deg, rgba(34,197,94,.14), var(--surface) 60%)`)
plus a real `0 14px 32px` shadow gives this actual dimensionality, and the muscle-group
status dot is a smart, non-emoji way to carry Fitbod's color-coding idea. But the bottom
nav uses 🏋️/🍽️/🥗 emoji glyphs even though this direction's own rationale never asks
for that — the brief says emoji-as-icon-substitute is a tell to avoid and reserves the
"keep emoji" call for Podium specifically, so this reads as an inconsistency rather than
an intentional choice.

**Verdict:** promising but needs work — real depth here, but fix the unexplained nav emoji.

## 04 — Ring System (Apple Fitness) — **8/10**

The best-executed direction visually: true black, 44px phone radius, oversized rounded
type, and a soft `0 0 44px` accent-colored glow under the stat card that reads as real
light/depth rather than a filter effect. The mini activity-rings under the headline
number and as nav glyphs are a genuinely nice, on-brand touch that would take real work
to fake with icons. The one drag is originality — this is very close to reskinning
Apple Fitness's own visual language in green rather than synthesizing something FitLog-
specific, so it risks feeling like "Apple Fitness, but for lifting" rather than its own
system.

**Verdict:** ship it (with the caveat that it should be pushed further from its source).

## 05 — Field Notes (Oura) — **5/10**

This is the one direction that falls into exactly the trap the brief warned about: warm
paper background + italic serif display numerals is the "AI design tell" combo almost
verbatim, and swapping the accent from terracotta to ink-navy doesn't fix that — the
cream+serif pairing is the tell, not the color. It's also fully flat (`--shadow: none`),
so it fails the depth brief outright. The restrained text-only nav with an underline is
a nice idea, but it's not enough to rescue the direction.

**Verdict:** not distinctive enough — reads as generic warm-editorial AI styling.

## 06 — Clinical (Cronometer) — **5.5/10**

Internally coherent — uppercase tracked micro-labels, monospace figures, 6px corners,
muted teal — and it's honest to Cronometer's dense, clinical spirit. But visually it is
the least memorable of the ten: light gray-blue on white with no shadows and no texture
reads as a generic enterprise dashboard rather than a fitness app with any personality,
and a screenshot of it next to Whoop or Fitbod would look noticeably less considered.
Zero elevation on cards or buttons, same as Field Notes and Blackout.

**Verdict:** not distinctive enough — too close to "generic B2B admin panel."

## 07 — Signal (neo-brutalist, "go crazy") — **9/10**

This is the standout. Thick 3px black borders and hard, un-blurred offset shadows
(`6px 6px 0 #0d0d0d` on cards, `4px 4px 0` on buttons) deliver real, obvious elevation
through actual layering rather than a drop-shadow filter — exactly what the brief asked
for, executed better than any other direction here. It's completely internally
consistent (every interactive element shares the same border weight, shadow offset, and
uppercase Space Grotesk treatment), it contains zero generic-AI tells, and — because
corner radius is uniformly zero and colors are flat — it is trivially reproducible in
real Tailwind with arbitrary-value borders and shadows. It doesn't resemble any of the
soft reference apps by design, but it reads as a confident, professional execution of
its own genre rather than an amateur pastiche, which is what the bar actually is.

**Verdict:** ship it.

## 08 — Trackside (Swiss/athletic) — **7/10**

Distinctive and well-crafted typographically — condensed all-caps Barlow, numbered
01/02/03 nav tabs instead of icons, a single race-red accent, hairline rule dividers
instead of cards-on-cards. It's a genuinely fresh idea for a fitness app nav. But it
explicitly rejects the depth brief: cards are just `border-top`/`border-bottom` rules
with `--shadow: none`, so buttons and list items sit perfectly flush with the page. That
is a coherent design choice for the "scoreboard" concept, but it means this direction
cannot pass criterion 5 no matter how well-executed the rest of it is.

**Verdict:** promising but needs work — striking, but needs a real elevation layer added.

## 09 — Aurora Glass (frosted glass) — **7.5/10**

The most visually striking of the ten in a screenshot: real `backdrop-filter: blur(18px)`
on cards over soft ambient emerald/amber glow orbs, with a top highlight border standing
in for a shadow — a legitimately different way to express elevation that still counts as
"real" depth rather than decoration. Swapping the usual purple-to-blue gradient for
emerald/amber avoids the most obvious AI-glassmorphism tell. Practicality is the real
risk: backdrop-blur over scrolling content is expensive on low/mid-range Android and can
render inconsistently, so this would need real device testing before committing to it
site-wide. It also has the same unexplained nav-emoji issue as Recovery Map.

**Verdict:** promising but needs work — gorgeous, but validate performance before shipping.

## 10 — Podium (gamified) — **6/10**

Competent, energetic, and the emoji-in-nav choice is at least earned here since the
rationale explicitly calls it out as intentional (unlike #3 and #9). The problem is
distinctiveness within this set: the dark canvas, green gradient stat card, and rounded
glow-shadow button are all extremely close to Recovery Map's formula, just swapped to a
rounder typeface (Baloo 2) and a gold accent added for streaks. Sitting the two
side-by-side, Podium reads as a variant of #3 more than a wholly separate system, which
undercuts its case as a distinct tenth direction.

**Verdict:** doesn't suit FitLog — not different enough from Recovery Map to justify existing separately.

---

## Scores at a glance

| # | Direction | Score |
|---|---|---|
| 1 | Blackout | 7 |
| 2 | Ledger | 7 |
| 3 | Recovery Map | 6.5 |
| 4 | Ring System | 8 |
| 5 | Field Notes | 5 |
| 6 | Clinical | 5.5 |
| 7 | **Signal** | **9** |
| 8 | Trackside | 7 |
| 9 | Aurora Glass | 7.5 |
| 10 | Podium | 6 |

## Directions scoring 9+

**Signal** is the only direction clearing the 9/10 bar. It earns it specifically because
it's the one direction that actually satisfies the "real depth, not flat decoration"
brief on its own terms — hard offset shadows are elevation you can't fake with a CSS
filter — while remaining completely internally consistent and free of every generic-AI
tell in the checklist.

---

## Implementation spec — Signal (top-scoring direction)

This is written to be implemented directly without re-deriving decisions. It extends
FitLog's existing `html[data-theme]` token-override pattern in `src/index.css` — the
distinctive part of this system (black border, hard offset shadow, orange accent) is
theme-invariant by design: only the page canvas and muted-text shade change between
light and dark. Cards stay white with black borders in both themes because the border +
shadow do the contrast work, not the card-vs-background fill.

### Color tokens

Add alongside the existing `--color-slate-*` block in `src/index.css`. Dark is the
`:root` default (matches current app default); light overrides under
`html[data-theme="light"]`, same pattern already used there.

```css
:root {
  /* Signal system — dark (default) */
  --color-canvas: #0d0d0d;       /* page background */
  --color-surface: #ffffff;      /* card / button / input fill — constant across themes */
  --color-surface-2: #f2f2f2;    /* secondary button fill, inactive segmented option */
  --color-text: #0d0d0d;         /* text on white surfaces — constant across themes */
  --color-text-inverse: #ffffff; /* text on the black header/canvas */
  --color-muted: #4b4b4b;
  --color-border: #0d0d0d;       /* the 3px hairline everywhere — constant across themes */
  --color-accent: #ff4d00;       /* safety orange — constant across themes */
  --color-accent-contrast: #0d0d0d;
  --color-danger: #ff1e3c;
  --color-danger-contrast: #ffffff;
  --color-shadow: #0d0d0d;       /* offset-shadow color — constant across themes */
}

html[data-theme="light"] {
  --color-canvas: #eeeeec;   /* neutral cool off-white — NOT cream, avoid the warm-paper tell */
  --color-muted: #55555a;
  /* surface, text, border, accent, danger, shadow are intentionally unchanged */
}
```

Keep the header itself pinned to `bg-[#0d0d0d] text-white` in both themes (a constant
"masthead" element, like the mockup's `#d7 .app-header` override) — do not let it follow
`--color-canvas` in light mode, or the brand identity gets diluted.

### Fonts

Google Fonts, exact families/weights used in the mockup:

```html
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

- **Archivo Black** (single weight, 400/900 — it only ships one cut): brand wordmark,
  stat-card headline numerals only. Do not use it for body copy; it gets unreadable
  below ~20px.
- **Space Grotesk**, weights 400/500/600/700: everything else — body text, buttons,
  labels, nav, inputs. Use 700 for all button/label/nav text (this system reads
  "brutalist" partly because nothing is ever regular-weight on a colored surface).

### Tailwind treatment (arbitrary values)

```
Card (stat card / list item):
  bg-white border-[3px] border-[#0d0d0d] rounded-none
  shadow-[6px_6px_0_0_#0d0d0d] p-4

Primary button:
  bg-[#ff4d00] text-[#0d0d0d] border-[3px] border-[#0d0d0d] rounded-none
  font-bold uppercase tracking-wide px-4 py-3
  shadow-[4px_4px_0_0_#0d0d0d]
  active:translate-x-[2px] active:translate-y-[2px]
  active:shadow-[2px_2px_0_0_#0d0d0d] transition-transform duration-100

Secondary button:
  bg-white text-[#0d0d0d] border-[3px] border-[#0d0d0d] rounded-none
  font-bold uppercase tracking-wide px-4 py-3
  shadow-[4px_4px_0_0_#0d0d0d]
  active:translate-x-[2px] active:translate-y-[2px]
  active:shadow-[2px_2px_0_0_#0d0d0d] transition-transform duration-100

Destructive button (filled, per the mockup's own override — NOT an outline):
  bg-[#ff1e3c] text-white border-[3px] border-[#0d0d0d] rounded-none
  font-bold uppercase tracking-wide px-4 py-3
  shadow-[4px_4px_0_0_#0d0d0d]
  active:translate-x-[2px] active:translate-y-[2px]
  active:shadow-[2px_2px_0_0_#0d0d0d] transition-transform duration-100

Text input:
  bg-white border-[3px] border-[#0d0d0d] rounded-none
  px-3 py-2.5 font-medium text-[#0d0d0d] placeholder:text-[#4b4b4b]
  focus:outline-none focus:shadow-[3px_3px_0_0_#ff4d00]

Segmented control option (inactive):
  bg-white text-[#0d0d0d] border-[3px] border-[#0d0d0d] rounded-none
  font-bold uppercase text-xs py-2.5

Segmented control option (active):
  bg-[#ff4d00] text-[#0d0d0d] border-[3px] border-[#0d0d0d] rounded-none
  font-bold uppercase text-xs py-2.5

App header:
  bg-[#0d0d0d] text-white border-b-[3px] border-[#0d0d0d] px-4 py-[15px]
  (pinned black in both themes — see token note above)

Bottom nav:
  bg-[var(--color-canvas)] border-t-[3px] border-[#0d0d0d]
  nav-item.active: bg-[#0d0d0d] text-white  (filled pill behind the whole tab, not just the icon)
```

The `active:translate-x/y` + shadow-shrink combo on every clickable surface is the one
addition beyond the static mockup — it makes the offset shadow read as a physical press
(card "sinks" into the page on tap), which is cheap to implement, costs nothing on any
device, and is the single highest-leverage way to make the depth read as real
interaction rather than a static illustration.

### Tab-bar icons (emoji retirement)

Do not introduce emoji here, including in the bottom nav. Signal's whole identity is a
tight, monochrome-plus-orange graphic system; a colorful default-OS emoji glyph would be
the one element that breaks the system rather than reinforcing it, unlike Podium where
color chips are the point. Use the same stroke-based SVG icon sprite already defined in
the mockup (`ic-barbell`, `ic-fork`, `ic-leaf` or FitLog's real equivalents) at
`stroke-width: 2.5–2.6` to match the display type's weight, rendered at 19–20px. Active
tab gets the filled black pill (`bg-[#0d0d0d] text-white`, applied to the whole
icon+label button, not a separate chip behind just the icon) rather than a color change
on the icon alone — that filled-pill-on-active pattern is what the mockup already does
and is what keeps the nav legible against both the dark canvas and light canvas variants
without needing a second icon color per theme.
