---
name: pro-ui-design-stack
description: Playbook for raising the visual quality of websites and apps built with Claude Code - which design tools to use (UI UX Pro Max skill, 21st.dev components, Google Stitch + Nano Banana mockups, Anthropic frontend-design, Impeccable, Taste Skill, Claude Design) and how to combine them per project. Use when the user asks to design, redesign or "make it look better/pro" for a website, landing page or app UI, asks which design tools/skills/MCPs to use, or mentions Stitch, 21st.dev, UI UX Pro Max, Nano Banana, Impeccable or Taste Skill.
---
# Pro UI design stack

Source: https://www.instagram.com/reel/DVbfcdTkZ7R/ (Jens Heitmann, 2026-03-03), plus web research
(Sept 2026) on the tools and their alternatives. The reel's before/after results are the creator's own
examples - unverified.

## When to use
- Building or redesigning a website, landing page or app screen and the output would otherwise look
  generic ("AI slop": centred symmetric layouts, uniform spacing, weak type contrast, safe colours).
- Choosing which design skills/MCPs to install or reach for.

## The idea
Three layers, each fixing a different weakness:
1. **Reference** - get a real visual target before coding (mockups), instead of designing in code.
2. **Rules** - a design-intelligence skill that picks a style, palette, type pairing and UX rules.
3. **Parts** - drop in polished, already-built components instead of hand-rolling them.

## Tools (what each is, how to get it)
| Layer | Tool | Install / access | Cost |
|---|---|---|---|
| Rules | **UI UX Pro Max** (nextlevelbuilder/ui-ux-pro-max-skill): searchable DB of ~67 UI styles, palettes, font pairings, chart types, landing patterns, UX guidelines; generates a design system first | `claude plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` then `claude plugin install ui-ux-pro-max@ui-ux-pro-max-skill` (installed on the owner's Windows machine, user scope). Needs Python 3 for its search scripts. | Free (MIT) |
| Rules | **Anthropic frontend-design** skill/plugin: deliberate typography, composition, colour, motion | Official plugin marketplace | Free |
| Rules / audit | **Impeccable**: builds on frontend-design; `/audit`, `/polish`, `/distill`, `/bolder`, `/quieter` | Plugin | Free |
| Rules / audit | **Taste Skill** (tasteskill.dev, Leonxlnx/taste-skill): anti-slop rules, audit-first redesign | Skill files | Free |
| Parts | **21st.dev** ("21st MCP", formerly Magic MCP): 10k+ React + Tailwind components incl. 3D (Spline) and animated ones; search, generate, "copy prompt" | Claude Code plugin (21st-cli skill + remote MCP); needs a 21st.dev account/API key the user sets up | Free tier + paid components |
| Parts | **shadcn/ui** MCP/skill | For projects already on shadcn | Free |
| Reference | **Google Stitch** via MCP: generates UI screens from prompts; tools get_screen_code, get_screen_image, build_site | Remote MCP `https://stitch.googleapis.com/mcp` + API key from Stitch settings in `.mcp.json` | Free (beta) |
| Reference | **Nano Banana 2** (Gemini image model): image mockups / assets | Gemini API key + an MCP or skill (e.g. kingbootoshi/nano-banana-2-skill) | Paid per image |
| Reference | **Claude Design** (claude.ai/design): designs with a synced design system's real components | `/design-sync` from the repo | Included |

Never enter the user's API keys or sign in for them - tell them where to create the key and where it goes.

## Steps
1. **Classify the project**: static HTML site, React/Tailwind site, or an existing app with its own
   design system. Check what's already installed (`claude plugin list`) before recommending installs.
2. **Set direction first** (rules layer): run UI UX Pro Max (or frontend-design) to choose style,
   palette, type pairing and layout pattern for the product/audience. Write the chosen tokens down
   (CSS variables) before building any component. Avoid generic defaults (purple-blue gradients,
   Inter everywhere, everything centred).
3. **Get a visual target** (reference layer), pick one:
   - App with a synced design system → Claude Design (real components, on-brand by construction).
   - New site/concept → Stitch screens (and/or Nano Banana images), then build to match.
4. **Build with parts** (parts layer): for React/Tailwind projects, search 21st.dev / shadcn for the hero,
   pricing, feature grid, testimonials, 3D scene etc., and adapt them to the tokens from step 2.
   For plain-HTML sites, port the look by hand rather than importing React components.
5. **Audit and polish**: Impeccable `/audit` + `/polish` (or Taste Skill's audit) on the result; check
   phone width (360-430px), light/dark, contrast, tap targets, reduced motion.
6. The human sets the bar: show screenshots, ask what feels off-brand, iterate.

## Picking per project
- **Portfolio / studio site (static HTML)**: UI UX Pro Max for direction + hand-built sections; Stitch
  for a mockup if the direction is unclear. 21st.dev only if the site moves to React.
- **Product marketing site (React/Tailwind)**: UI UX Pro Max + 21st.dev components; reuse the product's
  own tokens/fonts so site and app match.
- **Existing app**: audit with Impeccable/Taste against its current design system; mock new screens in
  Claude Design; don't import foreign component styles that fight the system.

## Pitfalls
- Stacking every tool at once produces a collage - one direction (step 2) governs everything.
- 3D/animated components cost load time and battery; keep them to one hero moment and respect
  prefers-reduced-motion.
- 21st.dev and shadcn components carry their own styling - re-theme them to the project tokens.
- Tool names/setup change fast (Magic MCP became 21st MCP; Stitch is beta) - verify install steps
  from the repo/docs before running them.
