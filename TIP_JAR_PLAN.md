# Tip jar - plan

Updated 2026-10-02 for the move to Capacitor (CAPACITOR_PLAN.md). The earlier version of this file
planned tips for the Trusted Web Activity build through Chrome's Digital Goods API, with a Vercel
function that verified and consumed each purchase. That route is dropped: the TWA is being replaced,
the Digital Goods API only works when the TWA runs in Chrome, and the server added a Google service
account and a payments endpoint on Vercel Hobby for a feature that unlocks nothing. The old version
is in git history (commit 6a59bba).

## What it is

Optional one-time tips in the native app, paid through Google Play (and the App Store once FitLog is
on iOS). Each tip is a consumable product, so it can be given again. Tips unlock nothing, and the
screen says so. The web keeps the Buy Me a Coffee link; the store builds never show it, because
both stores forbid pointing people to an outside payment method from inside the app.

Both stores allow this. Apple's guideline 3.1.1 explicitly lets apps use in-app purchase so people
can "tip" the developer. Google Play has no tip-specific rule; tips are in-app digital purchases, so
they go through Play Billing like any other.

## What's built (2026-10-02)

- `src/lib/tipJar.ts`: the four products, the `TipStore` interface a store adapter implements,
  `registerTipStore()`, and a count of tips given on this device. A preview store for development
  (localStorage `fitlog-tipjar-preview` = `1`, `pending` or `error`, dev server only).
- `src/features/feedback/TipJarTab.tsx`: the Tip jar screen (`#/tips`), with prices from the store,
  waiting / thanks / pending / error states, and a fallback where there's no store (the coffee link
  on the web, a short note in the Play web build).
- Entry points, shown only when a store is registered: a "Tip jar" row in Settings (between
  Feedback & support and About FitLog) and a "Leave a tip" button on Feedback & support, where the
  web shows Buy me a coffee.

Nothing is visible in production until the native app registers a store.

## Common practice, and what FitLog does

| Practice | FitLog |
|----------|--------|
| A few fixed tiers, small to large, as consumable products | Four: Small, Medium, Large, Extra large |
| Prices from the store, in the buyer's currency | `priceString` from the plugin, never hard-coded |
| Say plainly that a tip unlocks nothing | In the screen's first paragraph |
| Easy to find, never in the way: Settings or About, no pop-ups or nag screens | Settings row and Feedback & support button only |
| A clear thank-you after paying | "Thank you for the tip.", a fade (some phones report reduced motion), and a quiet count afterwards |
| Handle pending payments and purchases left unfinished when the app closed | Pending state on screen; the adapter finishes leftovers at startup |
| Optional extras some apps add: a "supporter" badge, an alternate icon, a monthly tip subscription | Not now. A perk makes it a purchase rather than a tip, and a subscription needs ongoing value. Worth revisiting later |

## Products

Create these as one-time products in Play Console. IDs can never be changed or reused.

| Product ID | Name | Suggested price |
|------------|------|-----------------|
| `tip_small` | Small tip | US$0.99 |
| `tip_medium` | Medium tip | US$2.99 |
| `tip_large` | Large tip | US$4.99 |
| `tip_xlarge` | Extra large tip | US$9.99 |

Description for each: "A one-time tip for the developer of FitLog. It doesn't unlock anything or
change your account." Play converts the US prices into local currencies.

Google keeps 15% of the first US$1M a year (check that Play Console shows your account on the 15%
tier). A US$2.99 tip leaves about US$2.54 before tax.

## How it works in the app (chunk C8 of CAPACITOR_PLAN.md)

- Plugin: `@capgo/native-purchases` (free, MPL-2.0, Play Billing Library 9.1, Capacitor 8). Its
  README still says Billing 7, but its build file uses 9.1.0. `cordova-plugin-purchase` 13.15+
  (Billing 8.3, native Capacitor adapter) is the fallback. Play has required Billing Library 8 or
  newer for updates since 2026-08-31.
- The adapter (`src/native/tipStore.ts`) implements `TipStore`: `getProducts` for prices,
  `purchaseProduct` with `isConsumable: true` to buy and consume, and at startup `getPurchases` to
  consume anything left unfinished (Google refunds a purchase that isn't consumed or acknowledged
  within 3 days). It calls `registerTipStore()` before the app renders.
- No server. Tips unlock nothing, so there is nothing to protect with server-side verification, and
  Play Console already lists every order. This also keeps payment handling off Vercel Hobby, whose
  terms treat processing payments as commercial use.

## Your steps on Google Play

1. **Now, during the closed test:** set up the payments profile (Play Console > Settings > Payments
   profile, or Monetize with Play > Monetization setup). Legal name, address, bank account (IBAN and
   SWIFT), and tax info (a W-8BEN form as an individual outside the US). Bank verification can take
   days, so start early. This touches nothing in the closed test.
2. **When the first Capacitor build exists:** upload it to the **internal testing** track (it
   doesn't affect the closed test). Play only lets you create products after it has seen a build that
   includes the billing library.
3. Create the four products (Monetize with Play > Products > One-time products), set the prices, and
   activate them.
4. Add yourself and any testers under Settings > License testing. License testers can buy without
   being charged.
5. Test on a phone that installed FitLog from Play (internal or closed testing), signed in with a
   license tester account.
6. Update the privacy policy with one line: tips are processed by Google Play, and FitLog never
   receives payment details. In the Data safety form, purchases handled entirely by Google Play
   usually need no new entry as long as FitLog doesn't send purchase data anywhere; check the form's
   wording when you get there.
7. The listing will show "In-app purchases" automatically.

The closed test can keep running through all of this. New builds don't restart its 14 days.
