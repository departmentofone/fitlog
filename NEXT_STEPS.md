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

## Calls only you can make

These came up in the review. Each would change how the app is organised, so I left them alone.

| # | What the review found | Options | My pick |
|---|---|---|---|
| 1 | **Diet and Diets.** Eat > Diet is your calorie goal; Eat > Foods > Diets is lists of foods like Mediterranean. People will mix them up. | Rename the tab to "Goal", or rename the food lists to "Food lists" | Rename Foods > Diets to "Food lists" and keep "Diet" for the goal. Smaller change, and "follow a diet" still reads naturally in Community |
| 2 | **Meal presets live in two places**: Meals > Presets and Foods > Presets. | Keep both, or keep one | Keep the one in Meals (where you use them) and make Foods > Presets a link to it |
| 3 | **The + button on Log and Meals** repeats the big Add exercise and Add food buttons right above it, and sits over list rows. | Keep it everywhere, or hide it on Log and Meals | Hide it on those two screens. It earns its place on the others, where it's the quickest way to log something from elsewhere |
| 4 | **No protein target.** Most lifters track protein first; the app only has a calorie goal. | Add a protein goal (one settings column) shown next to calories on Meals and Diet | Yes. Small migration, big payoff for the people this app is for |
| 5 | **First run asks nothing.** The tour explains the app but doesn't ask for units, weight or a goal, so a new account starts blank. Tonight's empty-state cards cover most of this. | Add one setup step to the tour, or leave it | One optional step: units, current weight and goal weight, all skippable |
| 6 | **"Community" while everything in it is official.** Every item in it is FitLog's own (20 today, 31 once migration v35 runs). | Keep the name, or call it "Library" until people share | Keep the name. Sharing is built and the guidelines are in place; the first few shares change the picture |
| 7 | **Loading a preset logs every set as done**, with the preset's weights. Templates now fill in your own last weights, but the sets still count before you lift them. | Keep it, or add "planned" sets you tick off as you go | Planned sets. It's the bigger change on this list, and it's how Strong and Hevy work, so lifters will expect it |

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
