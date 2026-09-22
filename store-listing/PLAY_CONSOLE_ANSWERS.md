# Play Console — policy form answers

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
> immediately after sign-in; no payment or verification code is required.
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
- **User interaction / user-generated content:** **Yes**. Users can publish presets, recipes, and
  programs (name and contents) that other users can see and import. There is no chat, messaging,
  or free-form public posting.
- Shares the user's current physical location with other users: **No**.
- Digital purchases: **No**.
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
**None to declare.** Supabase and Vercel are *service providers* acting on our behalf, which Play
excludes from "sharing". User-initiated sharing of presets, recipes, and programs is also excluded
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
| App activity → **Other user-generated content** | Yes | Optional | App functionality | Custom foods, recipes, presets, programs, exercise notes, workout notes, food labels |
| App info and performance → **Crash logs** | Yes | Required (automatic) | Analytics | Error messages and stack traces, recorded only while signed in |
| App info and performance → **Diagnostics** | Yes | Required (automatic) | Analytics | Browser user-agent and page recorded with each error |
| Device or other IDs → **Device or other IDs** | Yes | Optional | App functionality | Push-notification subscription (only if notifications are turned on) |

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
| Financial features | None |
| COVID-19 contact tracing / status | No |
| Advertising ID | Not used. The TWA manifest must not declare `com.google.android.gms.permission.AD_ID`; check the generated Android manifest. |
| Account deletion | Yes. In-app, plus `https://fitlog-two-gamma.vercel.app/delete-account` |

## 9. Prominent disclosure (already implemented)

Play's User Data policy wants health data collection disclosed in the app, not only in the policy.
After sign-in, FitLog shows a one-time **"Your health and fitness data"** screen that explains what's
stored and why, links the privacy policy, and requires **Agree** before any data can be entered.
Declining signs the user out. The consent time is stored in `user_settings.health_data_consent_at`.
