# Tip Jar (Google Play Billing) - Plan

Written 2026-09-29. Plan only, nothing is implemented. Research was done against the official docs
listed in section 8; anything I could not confirm there is marked **Unconfirmed** and collected in
section 7.

## 1. Summary and verdict

**Approach.** In the Play build only, add a "Tip jar" card to the Feedback and support screen with a
few optional tip amounts. Each tip is a consumable one-time product paid through Google Play Billing.
The web app keeps the Buy Me a Coffee link. The Android package (a Trusted Web Activity built with
PWABuilder) is rebuilt with the "Google Play billing" option on, and the web page talks to Play
through the Digital Goods API plus the Payment Request API. After a purchase, the page sends the
purchase token to a new Vercel function, which asks Google's Play Developer API whether the purchase
is real, records it in Supabase, and consumes it so the same amount can be tipped again. Tips unlock
nothing.

**Is it possible for this developer? Yes.** Serbia is listed as a supported location for both
developer registration and merchant registration in Google's "Supported locations for developer and
merchant registration" table (developer default currency USD). An individual can create a payments
profile there. I found no rule that blocks an individual account from selling in-app products.

**Blockers and near-blockers, in order of how likely they are to slow you down:**

1. A Play payments profile (merchant account) with a Serbian bank account and a W-8BEN tax form has
   to exist and be verified before any product can be sold. Bank verification is a mandatory step.
   Turnaround time is not documented.
2. The rebuilt package must contain Play Billing Library 8 or newer. Google stopped accepting
   Library 7 for new apps and updates on 2026-08-31 (extension form available until 2026-11-01).
   Bubblewrap 1.25.0 ships the billing module version that uses Library 8.3.0, and PWABuilder's
   source on GitHub pins Bubblewrap 1.25.0, but I could not confirm the live PWABuilder service is on
   that build. Step 6.3 checks it.
3. The Digital Goods API only exists when the TWA runs in Chrome. Phones where the TWA falls back to
   another browser (a Samsung Internet case is reported on the PWABuilder issue tracker) will not
   show the Tip jar. That is acceptable, the card simply hides itself.
4. Vercel Hobby is for non-commercial use. Vercel's page says "Asking for Donations does not fall
   under commercial usage", but it also lists "Any method of requesting or processing payment from
   visitors of the site" as commercial. A tip endpoint sits between the two. Ask Vercel support
   before launch (step 0.3).
5. Tax and legal status of the income in Serbia is your call and probably an accountant's. I did not
   research it and this plan gives no tax advice.

### Policy check

- Google Play's Payments policy says apps that require or accept payment for in-app features,
  services, digital content or goods must use Play billing. The same policy says apps may not lead
  users to another payment method, and the list of places where that applies includes "an app's
  listing in Google Play", in-app buttons, links and messaging.
- The tips FAQ says a direct tip from user to creator does not need Play billing only when 100% of
  the tip goes to the creator and the payment grants no digital content or services. It does not say
  whether an app developer counts as the "creator" for their own app, and Buy Me a Coffee takes a
  fee, so the "100%" condition would not hold for it in any case. Routing tips through Play Billing
  removes the question.
- The exemption list in the Payments policy mentions "tax exempt donations". FitLog's developer is a
  private individual, not a tax-exempt organization, so I treat that exemption as not applying.
- Consequence for existing work: the Play build must keep hiding the Buy Me a Coffee link and any
  wording that sends people to it (already done in `FeedbackTab.tsx`). `DONATIONS_PLAN.md` says
  naming the coffee page in the Play Store listing is allowed. The policy sentence above lists the
  listing itself as a place where leading users to another payment method is prohibited. The current
  `store-listing/README.md` description does not mention the coffee page, so leave it that way and do
  not add it back.

### Why consumable one-time products and not subscriptions

- Google's product-type guidance: one-time products are for single charges, subscriptions are for
  benefits users get over a period. A tip has no ongoing benefit, so a subscription would make no
  sense to the buyer or to Play review.
- A one-time product can be bought again only after the purchase is consumed. Consuming is a step
  your backend performs, and it is what makes a tip "consumable". Without it, each user could tip
  each amount once.
- Up to 1,000 products per app, so a few tip tiers cost nothing in catalog space.

## 2. Decisions to make before starting

| # | Decision | Recommendation |
|---|----------|----------------|
| D1 | Legal name on the payments profile | Your real legal name. Public-facing merchant name can be "Department of One". The privacy policy already names Milan Solarov as the developer, keep those consistent. |
| D2 | Tip amounts | Four tiers, section 3. |
| D3 | Link tips to accounts? | No. Require sign-in to call the endpoint (stops random abuse) but store no `user_id`. Tips unlock nothing, so nothing needs the link, and account deletion stays simple. |
| D4 | Who consumes the purchase | The backend, through the Play Developer API. Google recommends this for apps with a secure backend. The web page never calls `consume()`. |
| D5 | Real-time developer notifications | Skip in v1. Use one daily cron that retries unfinished rows and marks refunds. |
| D6 | Service account credentials | JSON key in a Vercel env var (simple). Workload Identity Federation with Vercel OIDC is the keyless alternative if key creation is blocked. |

## 3. Proposed products, prices and copy

Product IDs cannot be changed or reused once created, and they must start with a digit or lowercase
letter and use only lowercase letters, digits, underscores and periods. Name them by size, not by
price, so a later price change does not leave a misleading ID.

| Product ID | Name in Play | Suggested US price | Notes |
|------------|--------------|--------------------|-------|
| `tip_small` | Small tip | $0.99 | Check the minimum allowed price in the price field. **Unconfirmed** that $0.99 is above the floor for every currency. |
| `tip_medium` | Medium tip | $2.99 | |
| `tip_large` | Large tip | $4.99 | |
| `tip_xlarge` | Extra large tip | $9.99 | Optional. Drop it if four buttons feel like a lot on a 360 px screen. |

Description text for each product in Play (keep under 200 characters): "A one-time tip for the
developer of FitLog. It unlocks nothing and changes nothing in your account."

Use a pricing template (Play Console > Settings > Pricing templates) if you want to reuse the same
price set later. Play converts the US price to local currencies automatically; Serbian buyers should
see RSD (a secondary source says RSD is supported, I did not find it on an official page).

**Fees.** Google's service fee is 15% on the first $1M a year of earnings. The help page says the
15% tier needs an account-group enrollment and terms acceptance, so check that your account shows as
enrolled. A $2.99 tip leaves about $2.54 before taxes and any payout costs. **Unconfirmed:** how VAT
interacts with the fee for buyers in Serbia and the EU.

**Payouts.** Orders from one month are paid around the 15th of the next month. The help page lists a
US$1 minimum for local-currency payouts and US$100 for USD wire transfers. Serbia's default currency
in Google's table is USD, so the $100 wire minimum probably applies. **Unconfirmed** for a Serbian
bank account. At about $2.50 net per tip that is roughly 40 tips before the first payout.

### UI copy (English, matches the app's plain tone)

Card title: `Tip jar`

Body: `If FitLog is useful to you, you can leave a tip. It is optional. It doesn't unlock anything or change your account.`

Button labels: `Small tip`, `Medium tip`, `Large tip`, `Extra large tip`, each with the localized price from
Play underneath (from `getDetails`, never hard-coded).

States:

- Buying: button shows `Waiting for Google Play...` and all buttons are disabled.
- Success: `Thank you for the tip.`
- Pending payment: `Google Play is still processing this payment. It will count once it clears.`
- Could not record: `The payment went through, but I couldn't record it yet. It will be retried the next time you open this screen.`
- Failed before payment: `That didn't go through. Please try again.`
- Cancelled by the user: show nothing.
- Tip jar unavailable (no Digital Goods API, no products): render nothing at all.

Do not add lines about costs, guilt, streaks or "supporters". Any thank-you effect should be a fade
only, since some phones report reduced motion.

## 4. Phases and steps

Format of each step: what to do, where, who does it (Dev = you by hand, Code = a code change), and
how you know it is done.

### Phase 0. Preparation

**0.1 Clean the working tree.**
What: `git status` shows uncommitted edits in `public/privacy.html`, `src/features/feedback/FeedbackTab.tsx`,
`store-listing/PLAY_CONSOLE_ANSWERS.md` and others. Leave the untracked `src/features/feedback/donate.tsx`
out: it's an unused leftover that nothing imports.
Commit or stash them so the tip jar work starts from a known state.
Who: Dev. Done when: `git status` is clean or the leftovers are deliberate.

**0.2 Confirm the account facts.**
What: In Play Console open Settings > Developer account (account details) and confirm the account
type is Personal, the country is Serbia, and the developer name matches the privacy policy.
Who: Dev. Done when: you have written down the exact legal name and address on the account.

**0.3 Ask Vercel about commercial use.**
What: Contact Vercel support via https://vercel.com/help. Describe: an optional tip endpoint that
verifies Google Play purchases for an app with no paid features. Ask whether the Hobby plan still
applies. If they say no, the cost is the Pro plan.
Who: Dev. Done when: you have their answer in writing. This can run in parallel with everything else.

### Phase 1. Accounts and merchant setup

**1.1 Create the payments profile.**
Where: Play Console > Settings > Developer account > Payments profile > Create payments profile.
Different Google help pages give slightly different menu labels for this screen (one says
Settings > Payments profile, one says Settings > Developer account > Payments profile, an older one says
Download reports > Financial > Set up a merchant account). Use whichever your console shows.
What: Enter legal name and address exactly as on official documents (no PO box), website
(`https://fitlog-two-gamma.vercel.app`), business category, support email
(`departmentofone.app@gmail.com`), statement descriptor and contact person.
Important: the payments profile country cannot be changed afterwards, and a Play Console account and a
payments profile can be linked only once, with no unlinking.
Who: Dev. Done when: the profile exists and is linked to the developer account.

**1.2 Add and verify the bank account.**
Where: the payments profile page opened from Play Console.
What: Add a bank account in Serbia (the help page requires the account to be in the same country as the
profile address). The account holder name must match. Google verifies it with a test deposit or
instant verification. Bank verification is mandatory before payouts.
Who: Dev. Done when: the bank account shows as verified.

**1.3 Submit tax information.**
Where: Play Console > Settings > Payments settings (or the same section of the payments profile) >
tax info.
What: Non-US individuals submit the Certificate of Foreign Status (W-8BEN) from inside the payments
profile. Without a valid form, Google can withhold 30% on US-source payments (income from US users).
Whether Serbia has a treaty rate that applies to you is a question for a tax professional.
Who: Dev. Done when: the tax form shows as submitted and accepted.

**1.4 Check the service fee tier.**
Where: Play Console help page "Changes to Google Play's service fee in 2021" describes enrolling; the
console shows your fee tier under payments or financial settings.
Who: Dev. Done when: you know whether you are on 15%. **Unconfirmed** where the setting lives.

**Tip: start step 6 early.** Google's older guides say a build that declares the `BILLING`
permission must be uploaded to a track before you can create in-app products. I could not confirm
that this still blocks product creation in the 2026 console. If step 2.1 shows a "upload an APK
first" message, do Phase 6 (rebuild and upload to closed testing) now and come back. Phase 6 needs no
backend or frontend changes.

### Phase 2. Products in Play Console

**2.1 Create the one-time products.**
Where: Play Console > (FitLog) > Monetize with Play > Products > One-time products > Create
one-time product. Older help pages call the same list "In-app products".
What, for each product in section 3:
1. Product ID as in the table (cannot change later).
2. Name and description as above.
3. Add one purchase option: type Buy, an option ID such as `default`. The first Buy option is
   automatically the backwards-compatible one, which is fine.
4. Classify it as digital content or service, and complete the tax and compliance settings the form
   asks for.
5. Set the price on the option. Enter the US price, let Play convert the rest, then look at the
   Serbian price and adjust it if the converted number looks awkward.
6. Save and Activate. Products stay Draft until activated, and `getDetails` will not return drafts.
Who: Dev. Done when: all four products show Active.

**2.2 Add license testers.**
Where: Play Console > Settings > License testing.
What: Add the Gmail accounts of your test phones, using an email list (up to 2,000 addresses) or a
Google Group.
Who: Dev. Done when: your own Gmail and any tester Gmails are listed and saved. Your own developer
account is a tester automatically.

### Phase 3. Google Cloud project and service account

**3.1 Create a Google Cloud project.**
Where: https://console.cloud.google.com/projectcreate. Use a project name such as `fitlog-play-api`.
Linking this project to Play Console is no longer required for the Developer API.
Who: Dev. Done when: the project exists.

**3.2 Enable the API.**
Where: Google Cloud Console > APIs and services > Library > "Google Play Android Developer API" >
Enable.
Who: Dev. Done when: the API shows Enabled.

**3.3 Create the service account and key.**
Where: Google Cloud Console > IAM and admin > Service accounts > Create service account (name
`fitlog-play-verifier`, no project roles needed), then open it > Keys > Add key > Create new key >
JSON. Keep the file out of the repo (`.gitignore` already covers `*.keystore` and `.env*` but not
`*.json`, so store it outside the project folder).
Complication: if the console says "Service account key creation is disabled", an organization policy
(`iam.disableServiceAccountKeyCreation`) is on. A personal Gmail project has no organization and
normally allows keys. If you are blocked, use Workload Identity Federation with Vercel OIDC instead
(Vercel's OIDC docs for GCP, section 8), which needs no key file.
Who: Dev. Done when: you hold a JSON key (or the WIF pool is configured).

**3.4 Give the service account access in Play Console.**
Where: Play Console > Users and permissions > Invite new users. Paste the service account email.
Grant "View financial data, orders and cancellation survey responses" and "Manage orders and
subscriptions". Invite user.
Wait: the ChromeOS billing sample reports permissions can take up to 24 hours to propagate. That is a
sample README, not official policy text.
Who: Dev. Done when: the service account appears in Users and permissions as active.

### Phase 4. Backend (Supabase table and Vercel function)

**4.1 Migration `supabase/migration_v31_tips.sql`.**
Who: Code, then Dev runs it in the Supabase SQL editor (same as the earlier migrations).

```sql
-- FitLog schema v31: Play Billing tips (Android app only). Safe to run more than once.
-- One row per Google Play purchase token. No user id on purpose: tips unlock nothing, so nothing
-- needs to tie a tip to an account, and account deletion has nothing to clean up here.
create table if not exists tips (
  id uuid primary key default gen_random_uuid(),
  purchase_token text not null unique,
  product_id text not null check (product_id in ('tip_small','tip_medium','tip_large','tip_xlarge')),
  order_id text,                         -- can be null (promo purchases have none)
  state text not null check (state in ('pending','purchased','consumed','canceled','refunded')),
  is_test boolean not null default false,
  region_code text,
  purchased_at timestamptz,
  acknowledged_at timestamptz,
  consumed_at timestamptz,
  last_error text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tips_state_idx on tips (state) where state in ('pending','purchased');

alter table tips enable row level security;
-- No policies: the anon and authenticated roles can read or write nothing. Only the
-- service-role key used by api/tips/* touches this table. Owner reads it in the Supabase dashboard.
notify pgrst, 'reload schema';
```

Done when: the table exists and a select with the anon key returns nothing.

**4.2 Server helper `server/playBilling.ts`** (outside `api/`, so Vercel does not expose it as an
endpoint).
Who: Code.
What: build a Google auth client from the JSON key with `google-auth-library` (add it as a
dependency), then three small functions over the REST API:
- `getPurchase(token)`: `GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{package}/purchases/productsv2/tokens/{token}`
- `acknowledge(productId, token)`: `POST .../purchases/products/{productId}/tokens/{token}:acknowledge`
- `consume(productId, token)`: `POST .../purchases/products/{productId}/tokens/{token}:consume`
Scope: `https://www.googleapis.com/auth/androidpublisher`.
Done when: unit tests with a mocked `fetch` cover each call and error mapping.

**4.3 Endpoint `api/tips/verify.ts`.**
Who: Code.
Follows the pattern of `api/account/delete.ts`: `POST` only, `Cache-Control: no-store`, Bearer token
checked with the anon client, service-role client for writes, `503` when env vars are missing.
Request: `{ "productId": "tip_medium", "purchaseToken": "..." }`.
Logic:
1. Reject unknown `productId` (allow-list of four IDs) and tokens longer than a sane limit.
2. Look up the token in `tips`. If `state = 'consumed'`, return `200 { status: 'consumed' }` (idempotent).
3. `getPurchase(token)`. Check the purchased product in the response equals `productId`, and the
   purchase state. Field names in the v2 response (`productLineItem`, `purchaseStateContext`,
   `testPurchaseContext`, `acknowledgementState`, `orderId`, `regionCode`) need checking against the
   reference page when you write the code, I only saw the names, not the shapes.
4. If Google says the token does not exist or the product mismatches: `422 { error }`, no row written.
5. If pending: upsert row with `state='pending'`, return `202 { status: 'pending' }`.
6. If canceled: upsert `canceled`, return `200 { status: 'canceled' }`.
7. If purchased: upsert `purchased`; if not yet acknowledged call `acknowledge`; then `consume`;
   update the row to `consumed` with timestamps; return `200 { status: 'consumed' }`.
   Whether acknowledging first and consuming second is the cleanest sequence for a consumable, or
   consume alone already acknowledges, is **Unconfirmed** from the server-API pages. Test it in
   step 7.
8. Any Google API failure: increment `attempts`, store `last_error`, return `502`. The client retries
   later, and the cron retries too.
Why acknowledgement matters: an unacknowledged (and unconsumed) purchase is refunded automatically
after 3 days and the item revoked. For a pending purchase the 3-day clock starts when it moves to
purchased. For tips a failure therefore costs you the tip, not the user's money.
Done when: handler tests pass for happy path, replay, wrong product, pending, canceled and Google
errors.

**4.4 Environment variables.**
Who: Dev.
Add to the Vercel project, Production only (and Preview only if you want to test there):
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`: the JSON key contents.
- `PLAY_PACKAGE_NAME`: `com.departmentofone.fitlog`.
Existing `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are reused.
Do not prefix the new names with `VITE_`, that would ship them to the browser.
Done when: `vercel env ls` lists them for Production.

**4.5 Reconcile cron `api/cron/tips-reconcile.ts`** plus an entry in `vercel.json` (for example
`0 6 * * *`).
Who: Code.
What: once a day, (a) take rows still `pending` or `purchased` and younger than 3 days and rerun the
same verify logic, (b) call the Voided Purchases API (`GET .../purchases/voidedpurchases`, one-time
products only, last 30 days) and mark matching rows `refunded`. Hobby plans allow a cron once a day
with timing accurate only to the hour, which is enough. Copy the guard the other crons use: a
`Authorization: Bearer ${CRON_SECRET}` check at the top of the handler.
Permission for voided purchases: the service account needs the "View financial data" permission
granted in step 3.4.
Done when: a manual call in a Preview deployment updates a test row.

### Phase 5. Frontend Tip jar

Where it goes: the "About the developer" card in `src/features/feedback/FeedbackTab.tsx`, which is
the Feedback and support screen. The tip jar shows only when the Play Billing service is actually
available. The Buy Me a Coffee block keeps its current `!isAndroidApp()` condition.

**5.1 Detection.** Who: Code.
- In `src/lib/platform.ts` add `hasDigitalGoods(): boolean` returning
  `'getDigitalGoodsService' in window`.
- In `src/features/feedback/FeedbackTab.tsx` change `showDonate` from `!isAndroidApp()` to
  `!isAndroidApp() && !hasDigitalGoods()`. The Digital Goods API exists only inside a Play TWA, so a
  Play launch whose `?source=play` marker or referrer was lost still hides the coffee link.
- Add a global type declaration for `getDigitalGoodsService` (a `src/digital-goods.d.ts` file; the
  TypeScript DOM lib does not include it).

**5.2 Play Billing wrapper `src/features/feedback/tips.ts`.** Who: Code.
Exports: `TIP_PRODUCTS` (the four IDs with labels), `getTipService()`, `loadTipPrices()`,
`buyTip(productId)`, `recoverTips()`.

```ts
const PLAY = 'https://play.google.com/billing'

export async function getTipService() {
  if (!('getDigitalGoodsService' in window)) return null
  try {
    return await window.getDigitalGoodsService(PLAY)
  } catch {
    return null // Play Billing not reachable in this browser
  }
}

// prices: getDetails returns [{ itemId, title, price: { currency, value } }]
// format with Intl.NumberFormat(navigator.language, { style: 'currency', currency })

export async function buyTip(sku: string): Promise<string> {
  const methods = [{ supportedMethods: PLAY, data: { sku } }]
  const details = { total: { label: 'Total', amount: { currency: 'USD', value: '0' } } }
  const request = new PaymentRequest(methods, details)
  const response = await request.show()          // rejects with AbortError if the user cancels
  const { purchaseToken } = response.details as { purchaseToken: string }
  await response.complete('success')             // see gotcha G7
  return purchaseToken
}
```

**5.3 Server call `src/features/feedback/tipApi.ts`.** Who: Code.
Same shape as `src/lib/deleteAccount.ts`: get the session token, `POST /api/tips/verify` with
`Authorization: Bearer`, map `200/202/4xx/5xx` to a result union `consumed | pending | retry | invalid`.

**5.4 Component `src/features/feedback/TipJar.tsx`.** Who: Code.
Client flow:
1. On mount, `getTipService()`. If null, render nothing.
2. `service.getDetails(TIP_IDS)`. If the list is empty, render nothing (products not active yet).
3. Render the buttons with Play's localized price.
4. On tap: disable all buttons, `buyTip(id)`, then `verifyTip(id, token)`.
5. On `consumed`, show the thank-you; on `pending`, show the pending line; on `retry`, keep the token
   in memory and offer a retry, and rely on recovery (next step) if the page closes.
6. Recovery, run once on mount: `service.listPurchases()` returns `{ itemId, purchaseToken }` for
   purchases not yet consumed. For each one whose `itemId` is a tip ID, call the same verify
   endpoint. The endpoint is idempotent, so repeats are harmless.
Styling: reuse the `card` classes and the 48 px minimum button height used in `FeedbackTab.tsx`. The
tip buttons should not use the amber coffee styling, so the two features stay visibly different.

**5.5 Wire it in `FeedbackTab.tsx`.** Who: Code.
Render `<TipJar />` under the developer note, inside `isAndroidApp() || hasDigitalGoods()`. `showDonate`
keeps the web on Buy Me a Coffee (step 5.1).

**5.6 Dev preview and tests.** Who: Code.
Digital Goods is missing from desktop browsers, so add a dev-only fake service
(`import.meta.env.DEV`, selected with `?tipjar=demo`) to see every UI state in the local dev server.
Add vitest tests for `tips.ts` (fake `getDigitalGoodsService` and `PaymentRequest`), for
`TipJar.tsx` (hidden when unavailable, buttons, pending, retry), and for the `showDonate` condition.
Done when: `npm test`, `npm run lint` and `npm run build` pass, and the demo mode shows all states.

**5.7 Deploy order.** Because the TWA loads the live website, the page ships to production with
`vercel --prod` and reaches all Play users at once. Users on the old package have no Digital Goods
API, so the card stays hidden for them. That makes it safe to deploy the web side before the new
Android package is out.

### Phase 6. Rebuild the Android package with Play Billing and upload

**6.1 Generate the package.**
Where: https://www.pwabuilder.com > enter `https://fitlog-two-gamma.vercel.app` > Package for stores >
Android > Google Play.
Who: Dev.
Keep every option from the first release: package ID `com.departmentofone.fitlog`, start URL
`/?source=play`, target SDK 36 or higher, and use the **existing signing key** (choose the "use my
existing key" option and provide the keystore from `first_release/`, which is git-ignored).
Change two things: tick **Google Play billing > Enable** (tooltip: "your PWA can sell in-app
purchases and subscriptions via the Digital Goods API"), and raise the **app version code** above the
one in the closed-testing release (PWABuilder's "updating your existing app" flow asks for it).
Done when: you have a zip with the `.aab`.

**6.2 Check the generated manifest.**
Confirm the merged Android manifest has the billing permission and the payment activity/service, and
still has **no** `com.google.android.gms.permission.AD_ID` (a rule from `PLAY_CONSOLE_ANSWERS.md`).
Open the AAB in Android Studio (Build > Analyze APK) to read the merged manifest.
Who: Dev.

**6.3 Check the billing library version.**
The PWABuilder Android form sends `playBilling.enabled = true` to a service that uses Bubblewrap. Its
`PlayBillingFeature` adds `com.google.androidbrowserhelper:billing:1.2.0` in Bubblewrap 1.25.0 (which
upgrades to Play Billing Library 8.3.0); older Bubblewrap releases add 1.1.0 (Library 7.1.1).
Two checks: the Play Console upload screen warns when a deprecated Library version is used, and in
Android Studio the AAB's dependencies should show billing 1.2.0.
If the build comes out with 1.1.0 or older, do not upload it. Run Bubblewrap 1.25.0 locally
(`npm i -g @bubblewrap/cli`, then `bubblewrap update` on a `twa-manifest.json` with
`"features": {"playBilling": {"enabled": true}}`, and `bubblewrap build`) using the same signing key.
Who: Dev. Done when: the AAB is confirmed on billing 1.2.0.

**6.4 Upload to closed testing.**
Where: Play Console > (FitLog) > Test and release > Testing > Closed testing > your track > Create
new release. Upload the AAB, add release notes, review, roll out. Digital Asset Links do not change
(same package and keys), so `public/.well-known/assetlinks.json` stays as it is.
Who: Dev. Done when: the release shows as available to testers (can take hours per the license
testing docs). Whether a new closed-testing release affects the 12-tester, 14-day production-access
clock is **Unconfirmed**; check the Production access page after uploading.

### Phase 7. Testing with license testers

**7.1 Install the right build.** Each tester opens the closed-test opt-in link on the phone, signed in
with a license-tester Gmail, and installs FitLog **from the Play Store**. Do not sideload. Chrome's docs say the debug flag
(`#enable-debug-for-store-billing`) is only for development devices and is unnecessary for apps
distributed through Play, so a Play install is the case to test. The device needs Chrome as the
browser that hosts the TWA (Chrome 101 or newer per Chrome's docs).
Who: Dev.

**7.2 Run this matrix** (the test payment methods appear in the Play purchase sheet for license
testers, with a test-order banner across the sheet):

| Case | Expected |
|------|----------|
| Test card, always approves | Sheet closes, "Thank you", row `consumed` in `tips`, `is_test = true` |
| Same tip twice in a row | Second purchase works (proves consume worked) |
| Always declines | Failed message, no row |
| Slow card, approves after minutes | Pending line, row `pending`, then `consumed` after the cron or a reopen |
| Slow card, declines | Row ends `canceled` |
| Approve then chargeback | Row ends `refunded` after cron |
| Cancel the sheet | No message, buttons re-enabled |
| Airplane mode right after paying | "couldn't record yet", then recovery on next open |
| Kill the app mid-purchase, reopen | `listPurchases` recovery finishes it |
| Server deliberately fails acknowledge | Test purchases are refunded after about 3 minutes if unacknowledged; row shows the error |
| Web in desktop Chrome and mobile Chrome | Buy Me a Coffee shows, no Tip jar |
| Play build, Chrome not default browser | Tip jar hidden, no coffee link either |

**7.3 Look at the money side.** Play Console > Orders (or Monetize with Play > Orders) shows test
orders; Supabase table editor shows the rows. Test purchases carry no tax and are not charged.
Done when: every row in the matrix behaves as stated.

**7.4 Test with one non-license account** at least once near the end, as the Play docs advise, to be
sure the flow does not depend on test-only behavior.

### Phase 8. Play Console declarations

Do these before rolling out to production. All are under Play Console > Policy and programs > App
content unless noted.

**8.1 Content rating.** Retake the questionnaire. `PLAY_CONSOLE_ANSWERS.md` currently says "Digital
purchases: No"; change it to **Yes**. The rating may shift slightly; accept what IARC returns. Google's
rule: resubmit whenever a change affects your answers.
Who: Dev.

**8.2 Data safety.** Add Financial info > **Purchase history**: collected Yes, optional, purpose App
functionality, not shared, not processed ephemerally. Google says you need not declare the card data
that Play's payment system collects itself, provided your app never sees it and Play collects it
directly. What your own backend stores (token, product, order ID, time) is different, so declare it.
Because the plan stores no account ID with a tip, this is arguably not "linked" data, but declaring
it is the safer reading. Update the "Not collected: financial info" line in `PLAY_CONSOLE_ANSWERS.md`.
Who: Dev.

**8.3 Other answers.**
- Ads: still No.
- Financial features declaration: still None (a tip jar is not a financial service).
- Target audience: the current 16 to 17 and 18+ selection stays. Confirm the questionnaire does not
  ask extra questions for in-app purchases in that age range.
- "Offers in-app purchases" appears on the store listing automatically once active products exist. There
  is nothing to fill in.
- Store listing text: do not mention Buy Me a Coffee. A neutral line such as "Optional tips in the app"
  is fine, but adds nothing you need.
Who: Dev.

### Phase 9. Privacy policy and repo docs

**9.1 `public/privacy.html`.** Who: Code.
- Section 1: add "Tips (Android app only)". Say you store the product tipped, the time, the state,
  and Google's purchase token and order ID. Say you never see card or bank details, Google handles
  payment under its own terms, and no account ID is stored with the record.
- Section 3: legal basis for keeping tip records (for accounting and to finish the transaction). Pick
  the wording with your accountant; I did not research Serbian record-keeping law.
- Section 4 table: add a row for Google Play (payment processing for tips).
- Section 6: how long tip records are kept (decide a period).
- Keep the Data safety form and the policy in sync. `PLAY_CONSOLE_ANSWERS.md` already warns that a
  mismatch is a common rejection cause.

**9.2 Docs.** Who: Code.
- `DONATIONS_PLAN.md`: replace option 2 with "done" and describe the final design.
- `store-listing/PLAY_CONSOLE_ANSWERS.md`: the two answers changed above.
- `store-listing/README.md`: PWABuilder settings section, add "Google Play billing: enabled".
- `src/lib/changelog.ts` (shown in the Play build under What's new): one line such as "Optional tip
  jar on the Feedback screen (Android app)". Do not mention coffee or any outside page.

### Phase 10. Release

1. **Web first.** Deploy with `vercel --prod` after tests pass. Nothing changes for people on the old
   package.
2. Confirm production has the new env vars and the `tips` table (call `/api/tips/verify` without a
   token: expect `401`).
3. **Promote the tested AAB** from closed testing to the next track you use. Follow the same review
   flow as any update. Review time for billing changes is not documented in what I read.
4. **First day watch:** Play Console > Orders, Supabase `tips` table, Vercel function logs for
   `/api/tips/verify`. Look for rows stuck in `pending` or `purchased`.
5. **Payouts:** first payout arrives around the 15th of the month after the first order, and only when
   the minimum is met. Keep the W-8BEN current.

## 5. Code-level design summary

New files:

| File | Purpose |
|------|---------|
| `supabase/migration_v31_tips.sql` | `tips` table, RLS on, no client policies |
| `server/playBilling.ts` | Google auth plus getPurchase, acknowledge, consume |
| `api/tips/verify.ts` | Auth, verify, record, acknowledge, consume |
| `api/cron/tips-reconcile.ts` | Daily retry and refund marking |
| `src/digital-goods.d.ts` | Types for `getDigitalGoodsService` |
| `src/features/feedback/tips.ts` | Wrapper over Digital Goods and Payment Request |
| `src/features/feedback/tipApi.ts` | Client call to `/api/tips/verify` |
| `src/features/feedback/TipJar.tsx` | The card |
| `src/features/feedback/*.test.ts(x)` | Tests |

Changed files: `src/lib/platform.ts` (add `hasDigitalGoods`), `src/features/feedback/FeedbackTab.tsx`
(`showDonate` condition, render `TipJar`), `vercel.json` (cron
entry), `package.json` (`google-auth-library`), `public/privacy.html`, `src/lib/changelog.ts`, and the
docs in step 9.2.

Not changed: `api/account/delete.ts` and `prepare_account_deletion`, because the `tips` table has no
link to users.

### Failure handling

| Situation | What the code does |
|-----------|--------------------|
| No Digital Goods API, or `getDigitalGoodsService` rejects | Hide the card |
| `getDetails` returns nothing | Hide the card |
| `request.show()` rejects with `AbortError` | User cancelled: reset silently |
| `show()` rejects otherwise | Failed message, buttons back on |
| Verify returns `202` pending | Pending message; recovery and cron finish it |
| Verify returns `502` or network error | "couldn't record yet" message; token found again by `listPurchases` on next open |
| Verify returns `422` | Log it, show the generic failure line |
| Same token sent twice | Server returns the stored `consumed` state |

### Keeping the web on Buy Me a Coffee

`showDonate` in `FeedbackTab.tsx` becomes `!isAndroidApp() && !hasDigitalGoods()`. On the web (and on Android Chrome outside
the TWA) `isAndroidApp()` is false and no Digital Goods API exists, so the current coffee card shows
and the tip jar never renders.

## 6. Risks and gotchas

- **G1. Library 8 requirement.** A package with Play Billing Library 7 or older is rejected for new
  updates since 2026-08-31 unless you filed the extension (until 2026-11-01). Check step 6.3.
- **G2. Chrome only.** The Digital Goods API is supported only in Chrome inside a TWA. Samsung or other
  default-browser cases exist (PWABuilder issue #6151 shows `PaymentRequest.show()` failing with
  `AbortError: Invalid state` on Samsung phones until Chrome was made the default browser). Hide the
  card rather than show a button that fails.
- **G3. Testers must install from Play.** A sideloaded APK or an installed PWA from Chrome has no
  Digital Goods API. Testers need the opt-in link and a license-tester Gmail on the device.
- **G4. Nothing external in the Play build.** No Buy Me a Coffee link, wording, image, or link to a page
  that leads there (the Payments policy also lists webviews, messaging and the store listing). Keep
  coffee copy out of `changelog.ts` too.
- **G5. Acknowledge within 3 days.** Otherwise Google refunds the buyer and revokes the item. Test
  purchases are refunded after about 3 minutes. The daily cron is a safety net, not the main path.
- **G6. Refunds.** A refunded tip needs no clawback because nothing was unlocked. The cron only
  updates the row. Voided purchases are visible for 30 days through the API.
- **G7. `PaymentResponse.complete()`.** I could not confirm from docs what `complete('fail')` does
  to the Play order. This plan calls `complete('success')` as soon as `show()` resolves, since the
  purchase already exists at Google, and treats recording as a separate retryable step. Verify in
  testing.
- **G8. Pending purchases.** Billing module 1.2.0 configures pending purchases for one-time products.
  Whether a pending purchase reaches the page through `PaymentRequest` or only appears later in
  `listPurchases` is **Unconfirmed**. The design covers both.
- **G9. Obfuscated account IDs.** Google recommends attaching an obfuscated account ID for fraud
  detection. I found no way to set one through the Digital Goods and Payment Request APIs.
  **Unconfirmed.** Not needed for tips.
- **G10. Vercel Hobby.** See step 0.3. A refusal means Pro plan cost.
- **G11. Service account permission delay.** New Play permissions can take up to a day. Do step 3.4
  early and expect 401 or 403 from Google until then.
- **G12. Key handling.** The JSON key is a secret. Never commit it. Rotate it if it ever leaves the
  Vercel env store.
- **G13. Policy review time.** Not documented in what I read. Plan for days, not hours.
- **G14. Money and tax.** Payout minimum, US withholding without a W-8BEN, VAT and Serbian tax status
  are outside this plan.
- **G15. Uncommitted work.** Several files this plan touches already have local edits (see step 0.1).

## 7. Unconfirmed items (could not verify in official docs)

1. Whether the console still requires an uploaded build with `BILLING` before creating products.
2. Exact 2026 menu label for the payments profile (help pages disagree) and for license testing.
3. Minimum allowed price per currency for one-time products, and character limits for product name
   and description in the new one-time product form.
4. Whether payouts to a Serbian bank account are in local currency or as USD wire (US$100 minimum).
5. Turnaround time for bank verification and for Play review of the updated app.
6. Exact field names and shapes in the `productsv2` purchase response.
7. Whether acknowledge before consume is needed on the server, or consume alone acknowledges.
8. What `PaymentResponse.complete('fail')` does to a Play purchase, and how pending purchases surface.
9. Whether PWABuilder's production service already builds with Bubblewrap 1.25.0 (source says yes).
10. Whether the 15% service fee tier is active on this account by default.
11. Whether a tip to the app's own developer counts as a "creator tip" under Google's FAQ.
12. Whether Vercel treats the tip endpoint as commercial use.
13. Whether a new closed-testing release resets the production-access testing clock.
14. Serbian record-keeping and tax rules, US treaty status for Serbia, and VAT on tips.
15. Serbia's RSD support for buyers (only a secondary news source found).

## 8. Sources

Google Play policy and Console
- Payments policy: https://support.google.com/googleplay/android-developer/answer/9858738
- Payments policy FAQ (tips, links): https://support.google.com/googleplay/android-developer/answer/10281818
- Supported locations for developer and merchant registration: https://support.google.com/googleplay/android-developer/answer/9306917
- Create a payments profile: https://support.google.com/googleplay/android-developer/answer/7161426
- Link a developer account to a payments profile: https://support.google.com/googleplay/android-developer/answer/3092739
- Enter merchant tax information: https://support.google.com/googleplay/android-developer/answer/7163598
- Payments FAQ (bank verification, wire): https://support.google.com/googleplay/android-developer/answer/7161649
- Payouts: https://support.google.com/googleplay/android-developer/answer/137997
- Service fees: https://support.google.com/googleplay/android-developer/answer/112622
- 2021 service fee change: https://support.google.com/googleplay/android-developer/answer/10632485
- Withholding tax (Play): https://support.google.com/googleplay/android-developer/answer/9384608
- US tax reporting and withholding (payments center): https://support.google.com/paymentscenter/answer/10349995
- Overview of one-time products: https://support.google.com/googleplay/android-developer/answer/16430488
- Create an in-app product: https://support.google.com/googleplay/android-developer/answer/1153481
- Product types and catalog considerations: https://support.google.com/googleplay/android-developer/answer/16431770
- Set up prices and pricing templates: https://support.google.com/googleplay/android-developer/answer/6334373
- Multiple currencies: https://support.google.com/googleplay/android-developer/answer/1169947
- License testing: https://support.google.com/googleplay/android-developer/answer/6062777
- Data safety, financial info: https://support.google.com/googleplay/android-developer/answer/10787469
- Content ratings: https://support.google.com/googleplay/android-developer/answer/9898843
- Serbia paid apps and RSD (secondary): https://www.androidpolice.com/2018/11/30/paid-apps-on-the-play-store-are-available-in-georgia-and-myanmar-local-currency-supported-in-paraguay-and-serbia/

Play Billing and Developer API
- Integrate Play Billing (consume, 3-day acknowledge, pending): https://developer.android.com/google/play/billing/integrate
- Security and purchase verification: https://developer.android.com/google/play/billing/security
- Testing: https://developer.android.com/google/play/billing/test
- Billing Library version deprecation (Library 8 by 2026-08-31): https://developer.android.com/google/play/billing/deprecation-faq
- One-time product model (purchase options, legacy compatible): https://developer.android.com/google/play/billing/one-time-product-multi-purchase-options-offers
- Real-time developer notifications: https://developer.android.com/google/play/billing/rtdn-reference
- Developer API getting started (service account, Users and permissions): https://developers.google.com/android-publisher/getting_started
- purchases.products (get, acknowledge, consume): https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products
- purchases.productsv2 get: https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.productsv2/getproductpurchasev2
- Voided purchases: https://developers.google.com/android-publisher/voided-purchases

TWA, Digital Goods, packaging
- Receive payments via Play Billing (Digital Goods and Payment Request): https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing
- Use Google Play Billing in a TWA: https://developer.chrome.com/docs/android/trusted-web-activity/billing
- Play Billing in TWA (Android Browser Helper setup): https://developer.chrome.com/docs/android/trusted-web-activity/play-billing
- Digital Goods API explainer: https://github.com/WICG/digital-goods/blob/main/explainer.md
- ChromeOS Play Billing sample: https://github.com/chromeos/pwa-play-billing
- ChromeOS Play Console setup for billing: https://developers.google.com/chromeos/app-development/publish/play-console-setup-for-billing
- Upgrade Digital Goods API to Billing Library 7: https://chromeos.dev/en/posts/upgrade-digital-goods-api-to-google-play-billing-library-7
- android-browser-helper releases (billing-1.2.0, Library 8.3.0): https://github.com/GoogleChrome/android-browser-helper/releases
- Bubblewrap releases (v1.25.0): https://github.com/GoogleChromeLabs/bubblewrap/releases
- Bubblewrap PlayBillingFeature source: https://github.com/GoogleChromeLabs/bubblewrap/blob/main/packages/core/src/lib/features/PlayBillingFeature.ts
- PWABuilder Android form (Google Play billing option): https://github.com/pwa-builder/PWABuilder/blob/main/apps/pwabuilder/Frontend/src/script/components/android-form.ts
- PWABuilder Google Play service README (Bubblewrap 1.25.0): https://github.com/pwa-builder/PWABuilder/tree/main/apps/pwabuilder-google-play
- PWABuilder issue 6151 (Samsung, PaymentRequest AbortError): https://github.com/pwa-builder/pwabuilder/issues/6151

Vercel and Google Cloud
- Vercel fair use guidelines: https://vercel.com/docs/limits/fair-use-guidelines
- Vercel cron limits: https://vercel.com/docs/cron-jobs/usage-and-pricing
- Vercel OIDC to Google Cloud: https://vercel.com/docs/oidc/gcp
- Service account key creation org policy: https://docs.cloud.google.com/iam/docs/troubleshoot-org-policies

Repo files read: `DONATIONS_PLAN.md`, `store-listing/PLAY_CONSOLE_ANSWERS.md`, `store-listing/README.md`,
`src/lib/platform.ts`, `src/features/feedback/FeedbackTab.tsx`,
`api/account/delete.ts`, `src/lib/deleteAccount.ts`, `vercel.json`, `public/privacy.html`.
