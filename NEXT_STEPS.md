# Next steps

Written 3 October 2026, the morning after a full review of the app: a design critique, an
automated design scan, accessibility and performance checks, and a walk through every screen with
both a busy demo account and a brand-new empty one. Everything that could be fixed without you is
on the `overnight-polish` branch. This file is what's left: what to do to ship it,
what's still on your list from the Android build, the calls only you can make, and what's ready to
build next.

## Shipping the overnight work

1. Run `supabase/migration_v35_official_workouts.sql` in the Supabase SQL editor. It adds 8 official
   workouts and 3 official programs (full body, push/pull/legs, upper/lower) and fixes one exercise
   name that the seed file may have stored with quotes around it. The app copes without it: the
   ready-made sections stay hidden until the rows exist.
2. Merge `overnight-polish` into `master` and deploy from a clean worktree as usual. The Android app
   picks up the new web code at its next launch through live updates, so no new APK is needed.
3. Open What's new in the app afterwards. There's an entry for this batch, written for users.

## Still on your list from the Android build (2 October)

- Add `localhost` to the Turnstile widget's hostnames in Cloudflare, or sign-in fails inside the app.
- Install the debug APK on the old Android phone (uninstall the Play test version first) and go
  through the checklist at the end of NATIVE_DEV.md.
- Point me at the upload keystore and its passwords so I can build the signed `.aab` for internal
  testing.
- Play Console: the foreground-service declaration for the rest timer (text in
  store-listing/PLAY_CONSOLE_ANSWERS.md, section 12).
- Optional, for push from the app: a Firebase project, `google-services.json`, the Vercel key, and
  migration v34.
- For tips: the payments profile and the 18 products in TIP_JAR_PLAN.md.

## Decided on 3 October

Built the same day: Foods > Diets is now Food lists, meal presets live in Meals (with Edit presets
there), the + button is gone from Log and Meals, there's an optional protein goal, the welcome
tour asks for units and weights, and starting a preset plans its sets to tick off. Community keeps
its name. The protein goal and planned sets need migration v36.

## Ready to build next

Each of these has groundwork in the repo already.

- **Insights tab** (pinned in IDEAS_BACKLOG.md). When you train and eat: usual gym time, eating
  window, weekday against weekend. The data has been collected since day one.
- **Home-screen widget** on Android: today's calories and a Start workout button. Needs a small
  native widget in `android/`, fed from the same API the app uses.
- **Health Connect** on Android: weigh-ins from smart scales in, workouts out. Play asks for a
  declaration per data type, similar to the foreground-service one.
- **iOS.** Capacitor makes the code side small, but it needs a Mac or a cloud build service
  (Codemagic or Ionic Appflow), an Apple Developer account at US$99 a year, and an iOS version of
  the rest timer (a Live Activity on the lock screen). CAPACITOR_PLAN.md has the phase written up.
- **Community, the next step.** A "Your shares" list with how many people saved each item, then
  profiles and following. Reporting and the guidelines already exist, so moderation has a base.
- **The running and cycling app.** Keep it separate, as you said. It would share the FitLog account
  and Supabase project, and post finished activities to Community. The hard part is Play's
  background-location policy: a prominent disclosure, a declaration and a video, and a review that
  takes longer than usual. Worth its own plan before any code.
- **Release builds on GitHub Actions**, so a tagged commit produces the signed `.aab` without this
  PC. The workflow is a short file; the keystore goes into GitHub secrets.
- **Screenshot checks per release** with the demo rig (tools/demo-rig): shoot every screen in both
  themes before and after a change and compare them, the same way tonight's review was done.

## Still open from the review

Smaller findings I didn't get to, roughly in order of impact.

- Medals for personal records, bench, squat and deadlift all use the same dumbbell icon, and
  "13 earned" sits above 8 medal tiles (each tile holds several tiers). `features/achievements`.
- The weekly volume body map takes about 700px on every visit to Log. It could start folded once
  the day has sets.
- Recipes open with the create form above your saved recipes. `features/meals/RecipeBuilder.tsx`.
- Workout presets show three identical green Load buttons with a red × and a share checkbox each.
  The new Start card on an empty day covers the common case; the list itself could be calmer.
  `features/workouts/PresetsView.tsx`.
- Feedback: the amber Buy me a coffee button outweighs Send on a support page.

## Where the review notes are

- What changed, commit by commit: `git log master..overnight-polish`.
- The demo rig and how to run it: tools/demo-rig/README.md.
- Migration v35 explains itself at the top of the file.
