# Donations ("Buy Me a Coffee") — Plan

Status: **live on the web** (2026-09-27). Page: https://buymeacoffee.com/department.of.one.
Hidden inside the Play (TWA) build. Linked from the Department of One site only. It must not appear
in the Play Store listing either (see below). No payment processing exists anywhere in
the app or backend.

## Policy check (verified 2026-09-17)

| Platform | Verdict | Source |
|---|---|---|
| Vercel Hobby | OK. Hobby is non-commercial only, but Vercel's fair-use page states verbatim: "Asking for Donations **does not** fall under commercial usage." (page updated 2026-07-29). This supersedes the Sept 14 launch-briefing note that a Donate link would require leaving Hobby. | https://vercel.com/docs/limits/fair-use-guidelines |
| Supabase | OK. The ToS has no free-tier commercial/donation restriction, and donations never touch Supabase anyway. | https://supabase.com/terms |
| Google Play | **Not OK as an in-app external link.** Payments policy: "Within an app, developers may not lead users to a payment method other than Google Play's billing system" except under the Section 3/8/9 programs (EEA, some US users). The tipping exemption covers tips that go 100% to *another creator*, not to the app's developer. | https://support.google.com/googleplay/android-developer/answer/10281818 |

## What the code does today

- `src/features/feedback/FeedbackTab.tsx` - `DONATE_URL` holds the page URL, so the web build shows a
  real external link (new tab, `noopener`). Setting it to `null` brings back the disabled
  "Coming soon" placeholder.
- `src/lib/platform.ts` - `isAndroidApp()` detects the Play (TWA) build from the
  `android-app://` referrer (remembered in sessionStorage, recorded at startup in `main.tsx`).
  In that build the Feedback tab hides both the button and the "a coffee helps" paragraph; the
  rest of the "Why it's free" text stays. The policy also bans *wording* that encourages paying
  outside the app, not just links, so keep any new coffee copy behind `showDonate` too (and out of
  `src/lib/changelog.ts`, which the Play build shows under What's new).

## Outside the app

- Play Store listing: **not allowed.** Google's Payments policy lists "an app's listing in Google
  Play" among the places that may not lead users to another payment method (rechecked 2026-09-29).
  The listing's old "WHY IT'S FREE" paragraph that named the page was removed on 2026-09-28.
- Department of One site (`departmentofone/department-of-one`): About section and footer.
- Don't add an in-app link to the Department of One site from the Play build: it now leads to the
  coffee page, and the policy covers links to pages that *eventually* lead to another payment
  method (StreetComplete was flagged for this in 2022).

## Android (Play) options, in order of preference

1. **Keep it hidden in the app** (current behavior) and link the Buy Me a Coffee page from the
   developer website only. The Play listing is off limits too (see above).
2. **Play Billing tip jar** (planned, see `TIP_JAR_PLAN.md`): consumable in-app products ("Small / Medium / Large coffee") via the
   Digital Goods API + Payment Request API, which work inside a TWA. Google takes its service fee
   (15% for the first $1M/yr). Needs a Play merchant account and a small verification endpoint.
3. External link under the EEA / US external-offers programs — enrollment + reporting + fees; not
   worth it for optional donations.

## Before flipping the switch — re-verify

- Test `isAndroidApp()` on a real TWA install (package `com.departmentofone.fitlog`) (the referrer is only present on the first page load).
- Re-read the Vercel fair-use and Play Payments pages; both change without notice.
