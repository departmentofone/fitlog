# Play Console: policy form answers

Prepared 2026-09-17 from the actual code and database (not assumptions). Each answer matches the
privacy policy at `/privacy` (`public/privacy.html`). **If you change one, change the other**: a
mismatch between the Data Safety form and the policy is one of the top rejection causes.

Play Console path: **Policy and programs → App content**.

---

## 1. Privacy policy

`https://fitlog-two-gamma.vercel.app/privacy`. It names the developer as **Milan Solarov**, which must
match the developer name on the Play Console account exactly.

## 2. App access

**All or some functionality is restricted** → add instructions:

> FitLog requires an account. Sign in with the reviewer account below. All features are available
> immediately after sign-in; no verification code is required.
> Email: `<reviewer account email>` · Password: `<reviewer account password>`

⚠️ **You need to create this reviewer account yourself** (a separate account, not your personal
one), and log a few workouts and meals in it so reviewers see a populated app. Don't reuse a
password you use elsewhere.

## 3. Ads

**No**, the app does not contain ads.

## 4. Content rating (IARC questionnaire)

- **Category:** *All Other App Types* (reference, utility, productivity, and similar). Don't pick Game.
- Violence, fear, sexuality, profanity, gambling: **No** to all.
- **Controlled substances:** the app lets users **log alcoholic drinks they consumed** (Diet →
  Alcohol). It doesn't promote or sell alcohol. Answer the "references to alcohol" question
  **Yes**, as a tracking/reference-only use. Being accurate here matters more than a lower rating.
- **User interaction / user-generated content:** **Yes**. Users can share presets, recipes,
  programs, meal plans and diets (name, description and contents) to Community, where other users
  can see and save a copy. There is no chat, messaging, or free-form public posting, and names and
  emails are never shown.
- Shares the user's current physical location with other users: **No**.
- Digital purchases: **No** for now. Change to **Yes** when the Tip Jar ships (section 11).
- Unrestricted web browsing: **No** (the app only shows its own site).

Expected outcome: a low rating (roughly PEGI 3–12 / Everyone–Teen, varying by region, driven by the
alcohol reference and user sharing). Accept whatever IARC assigns.

## 5. Target audience and content

- **Target age groups:** **16–17** and **18 and over**. (The privacy policy says the app isn't
  intended for anyone under 16. Don't select any under-13 group; that would pull the app into
  Families policy requirements.)
- **Could the app unintentionally appeal to children?** No.

## 6. Data safety

### Overview questions
| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS only) |
| Which ways can users request that their data is deleted? | **In-app** (Settings → Delete account) **and** web: `https://fitlog-two-gamma.vercel.app/delete-account` |
| Does your app follow the Families policy? | Not applicable (no under-13 audience) |
| Independent security review | **No** (optional badge) |

### Data shared with third parties
**None to declare.** Supabase, Vercel and Google Firebase Cloud Messaging are *service providers*
acting on our behalf, which Play excludes from "sharing". User-initiated sharing of presets, recipes, and programs is also excluded
("user-initiated action"). The barcode number sent to Open Food Facts isn't a user data type.

### Data collected

For every row: **Processed ephemerally? No.** Data is **not shared**. Purposes use Play's labels.

| Play category → data type | Collected? | Required or optional | Purposes | What it is in FitLog |
|---|---|---|---|---|
| Personal info → **Email address** | Yes | Required | App functionality, Account management | Sign-in email |
| Personal info → **User IDs** | Yes | Required | App functionality, Account management | Internal account ID |
| Personal info → **Other info** | Yes | Optional | App functionality | Age and sex (for calorie calculations) |
| Health and fitness → **Health info** | Yes | Optional | App functionality | Body weight, height, body measurements, meals and nutrition, water, alcohol, fasting |
| Health and fitness → **Fitness info** | Yes | Required | App functionality | Workouts, sets, reps, weights, effort ratings, rest days, activity level, goals |
| Photos and videos → **Photos** | Yes | Optional | App functionality | Progress photos and meal photos the user adds |
| App activity → **Other user-generated content** | Yes | Optional | App functionality | Custom foods, recipes, presets, programs, exercise notes, workout notes, food labels, Community reports |
| App info and performance → **Crash logs** | Yes | Required (automatic) | Analytics | Error messages and stack traces, recorded only while signed in |
| App info and performance → **Diagnostics** | Yes | Required (automatic) | Analytics | Browser user-agent and page recorded with each error |
| Device or other IDs → **Device or other IDs** | Yes | Optional | App functionality | The push token: a Web Push subscription on the web, a Firebase Cloud Messaging token in the Android app (only if notifications are turned on) |

**Not collected:** location, financial info, name, phone number, address, messages, contacts,
calendar, audio, files and docs, web browsing history, app interactions/analytics events,
installed apps, and advertising IDs. Camera frames for barcode scanning are processed on the device
and never uploaded.

> "Crash logs" and "Diagnostics" use the **Analytics** purpose because Play defines it to include
> app-performance monitoring. They're used only to find and fix bugs, and nothing is used for
> advertising.

## 7. Health apps declaration

- **Features:** *Activity and fitness* and *Nutrition and weight management*.
- **Is the app a medical device / does it diagnose or treat?** No. The app and the policy include a
  "not medical advice" disclaimer.
- **Health Connect:** not used. Don't request Health Connect permissions.

## 8. Other declarations

| Declaration | Answer |
|---|---|
| News app | No |
| Government app | No |
| Financial features | None (confirm again when the Tip Jar ships; section 11) |
| COVID-19 contact tracing / status | No |
| Advertising ID | Not used. The app's manifest must not declare `com.google.android.gms.permission.AD_ID`. The Capacitor build doesn't (checked 2026-10-02 with `aapt dump badging` on the APK); check again after adding any plugin. |
| Foreground service | Yes, one, type **special use**: the rest timer. See section 12. |
| Account deletion | Yes. In-app, plus `https://fitlog-two-gamma.vercel.app/delete-account` |

## 9. User-generated content policy (already implemented)

Community makes FitLog a UGC app under Play's User Generated Content policy. What's in place:
- **Rules accepted before sharing:** the first "Share to Community" shows the Community guidelines
  (no offensive, sexual or hateful content, no personal details, no spam, no medical claims) and
  requires "I agree". Stored in `user_settings.community_guidelines_accepted_at`.
- **In-app reporting:** every item from someone else has a Report button (`community_reports`).
- **Blocking:** "Hide items from this person" hides all of that account's items; undo and "Show
  them again" are available (`user_settings.hidden_community_users`).
- **Moderation:** the owner account sees a Reports panel in Community and can remove any item
  (`moderate_community_item`), which unshares it and clears its reports. Review reports regularly.

## 10. Prominent disclosure (already implemented)

Play's User Data policy wants health data collection disclosed in the app, not only in the policy.
After sign-in, FitLog shows a one-time **"Your health and fitness data"** screen that explains what's
stored and why, links the privacy policy, and requires **Agree** before any data can be entered.
Declining signs the user out. The consent time is stored in `user_settings.health_data_consent_at`.

---

## 11. Revisit when the Tip Jar ships

The answers above are correct for the app as it is today: no in-app purchases, no payments. The
Tip Jar will sell optional tips through Google Play Billing, which is a digital purchase, so several
answers and assets change. Work through this list before the build with the Tip Jar goes to any
track, and keep the privacy policy in step with the Data safety form.

### Before the first upload with Billing
- [ ] **Payments profile / merchant account.** Play Console → **Settings → Payments profile** (in
  newer consoles: **Setup → Payments profile**). Create or link a payments profile, add bank
  details and the tax information Play asks for. Confirm the developer name matches the account.
  Check what your own country requires for income from sales; Play does not advise on that.
- [ ] **In-app products.** Play Console → **Monetize with Play → Products → In-app products**. Create
  each tip product, set prices and activate it. Play may not let you create products until an
  upload with the Billing permission exists, so the first Billing build may need to go to a
  test track first.
- [ ] **Billing permission in the manifest.** The generated Android manifest will gain
  `com.android.vending.BILLING`. Check that this is the only new permission and that
  `com.google.android.gms.permission.AD_ID` is still absent (section 8, Advertising ID).
- [ ] **License testers.** Play Console → **Settings → License testing**. Add the tester Google
  accounts so test tips do not charge real cards, and add them to the test track.
- [ ] **App access instructions** (section 2). Reviewers will meet the purchase screen. Say where the
  Tip Jar is and that they can use a license tester account to try it. Do not ask them to pay.

### Policy forms (Policy and programs → App content)
- [ ] **Content rating.** Re-run the questionnaire: **Digital purchases → Yes** (section 4). Submit
  it again, since the old certificate does not update itself.
- [ ] **Data safety** (section 6). Re-open the form and answer from what the code actually does:
  - **Financial info → Purchase history**: declare it if the app or your server stores or reads
    purchase records or purchase tokens. Purpose: App functionality. If tokens are checked on a
    server, confirm that **User IDs** also covers the link between a purchase and an account.
  - If nothing about a purchase reaches your own servers and Google handles everything, write that
    decision down here so the form and the policy say the same thing.
  - Encrypted in transit stays **Yes**. Deletion options stay as they are, but decide what happens
    to purchase records when an account is deleted.
- [ ] **Financial features** (section 8). A Tip Jar is not a banking, loan, or investment feature,
  so **None** should still be right. Re-read the options before submitting.
- [ ] **Target audience** (section 5). The selected age groups start at 16. Check Play's rules on
  purchases by minors for your regions and confirm offering purchases to 16 and 17 year olds is
  what you want.
- [ ] **Ads** (section 3) stays **No**. A tip jar is not advertising.
- [ ] **Payments policy.** Tips must go through Play Billing. The Buy Me a Coffee link stays hidden
  in the Play build (`src/lib/platform.ts`, `?source=play`); keep it that way, and do not point to
  any outside payment method inside the app or in the listing.

### Store listing and app details
- [ ] **Price and badge.** The app stays **Free** to install. Once products are active, Play adds
  "Contains in-app purchases" and a price range to the store page by itself. Check the page after
  release. Play Console → **Grow users → Store presence → Main store listing**.
- [ ] **Full description** in `README.md`. It says nothing about pricing today. If you decide to
  mention tips, keep it plain and factual (for example, that tips are optional), then update the
  character count.
- [ ] **Screenshots and feature graphic.** Retake any screenshot that now shows a Tip Jar entry
  point, and confirm the feature graphic chips make no pricing promises (see `README.md`, Graphics).
- [ ] **What's new** text for the release that adds tips. State what was added and make no promise
  about future pricing.

### Outside Play Console
- [ ] **Privacy policy** (`public/privacy.html`, section 1 above). Add how purchases are handled
  (Google processes the payment; say what, if anything, FitLog stores) and update the "Last
  updated" date. If the opening line still calls FitLog "a free ... tracker", reword it. The Data
  safety form and the policy must agree.
- [ ] **Website and other pages** that describe pricing (landing page, Buy Me a Coffee page) so
  they do not contradict the store listing.
- [ ] **Developer page** (Play Console → **Grow users → Store presence → Store settings →
  Developer page**) for any wording about pricing or a "free" promise.

## 12. The Capacitor app (from versionCode 100)

The TWA is replaced by a Capacitor build of the same package (CAPACITOR_PLAN.md, NATIVE_DEV.md).
Play reviews it as an update. These answers change or are new.

### Permissions in the manifest
INTERNET, POST_NOTIFICATIONS, FOREGROUND_SERVICE, FOREGROUND_SERVICE_SPECIAL_USE, WAKE_LOCK,
VIBRATE and CAMERA (camera optional, asked for only when the scanner or a photo opens), plus from
plugins: com.android.vending.BILLING (tips), com.google.android.c2dm.permission.RECEIVE (push),
ACCESS_NETWORK_STATE and RECEIVE_BOOT_COMPLETED. No AD_ID, no location, no contacts.

### Foreground service declaration
Play Console → **Policy and programs → App content → Foreground service permissions**. Choose
**Special use** and paste:

> FitLog's rest timer. After the user logs a set, the app counts down their rest (usually 1 to 5
> minutes) in a notification and alerts them when rest is over, so it fires on time while the
> phone is locked or another app is open. The service runs only while a rest the user started is
> counting, and stops when it ends or the user skips it. No standard foreground service type
> covers a workout rest timer.

Play may ask for a short video: record the phone logging a set, locking the screen, the
notification counting down, and the "Rest over" alert.

### Data safety
- **Device or other IDs**: now also the Firebase token (row updated above).
- **Financial info → Purchase history**: not collected. Tips are paid through Google Play and
  consumed on the phone; nothing about a purchase reaches FitLog's servers (decision recorded in
  TIP_JAR_PLAN.md, and the privacy policy says the same).
- **Camera**: frames never leave the phone, so nothing to declare beyond the photos users choose
  to upload (already declared).

