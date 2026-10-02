# Capacitor plan

Written 2026-10-02. This is the map for moving FitLog's store app from a Trusted Web Activity (a thin
Android shell around the website, built with PWABuilder) to Capacitor (the same React app inside a
native Android and later iOS project, with access to native features through plugins). Android
comes first; iOS gets its own phase once there's a Mac or a cloud build service.

The work is split into chunks that agents can do in parallel, each reviewed before it's merged.
Agent rules come separately.

## What stays the same

- One codebase. The web app keeps deploying to Vercel exactly as now, and web users notice nothing.
- Supabase, the Vercel functions, the database and every screen.
- The Play listing. The Capacitor app ships as an update to `com.departmentofone.fitlog`, signed
  with the same upload key, so testers just get an update. Play App Signing doesn't change, so
  `assetlinks.json` stays valid.

## What changes for users

- The rest timer counts down in the notification bar on its own (no per-second updates), and
  "Rest over" is an alarm on the phone itself, so it no longer depends on a server push arriving.
- No "Running in Chrome" notice, no address bar risk, and the app opens instantly from local files,
  offline included.
- Real haptics, the Android back button, a native share sheet, and links that open the app.
- The tip jar (TIP_JAR_PLAN.md).
- Later: home-screen widgets, Health Connect, Live Activities on iOS.

## Decisions for you

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| D1 | Where the app's code comes from | (a) Bundled in the app, plus live updates that download new web code on launch. (b) The app loads the live website, like the TWA does now | (a). It starts offline, plugins always work, and Apple accepts it. Live updates keep your deploy-and-it's-there speed. Both stores allow updating web code this way, as long as it doesn't change what the app is |
| D2 | Order | Android first, or Android and iOS together | Android first. The Play account and testers already exist; iOS needs US$99 a year and a Mac or a cloud Mac |
| D3 | How release builds are made | Android Studio on your PC, or GitHub Actions in the cloud | Start in Android Studio (you need it for the emulator anyway). Add GitHub Actions in C11 so a release is one command |
| D4 | How the rest timer alarm fires on Android | Exact alarm (Android 14+ makes the user allow "Alarms & reminders" once), or a foreground service while resting | Decided in chunk C3 after a short test on real phones. Both work; they differ in what the user is asked |
| D5 | Native push for the weekly summary and streak reminders | Firebase Cloud Messaging (a new Google service in the privacy policy), or drop those pushes in the app | Firebase. Web push doesn't work inside an app, so without it those two notifications stop for app users |

## Chunks

Sizes: S is up to half a day of agent work, M up to a day or two, L longer. "Shared files" are
files more than one chunk edits; changes there stay small and are listed in the chunk's summary,
and conflicts get resolved at merge.

Order: C1 and C2 first, one after the other. Then the spikes S1 and S2. Then C3 to C9 in parallel.
Then C10 to C12.

### C1. Foundation (M)

Depends on: nothing. Must merge first.

- Add Capacitor 8 (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`) and commit the
  generated `android/` project. Capacitor 8 needs Node 22+, JDK 21 and Android Studio Otter, and
  targets Android 16 (API 36), which Play requires for updates from 2026-08-31.
- `capacitor.config.ts`: appId `com.departmentofone.fitlog`, appName `FitLog`, webDir `dist`,
  `androidScheme: 'https'`.
- `npm run build:native`: a Vite build with `VITE_NATIVE=1` that leaves out the service worker
  (vite-plugin-pwa), since the app files are local and the worker would only get in the way. Then
  `npx cap sync`.
- Gradle signing reads the upload key from `android/keystore.properties` (gitignored, never
  committed). versionCode and versionName come from one place, and versionCode starts above the
  last TWA build's.
- App icon and adaptive icon from the existing icons (`@capacitor/assets`).
- `NATIVE_DEV.md`: how to set up the PC, build, run on the emulator and on a phone.
- Done when: a debug build installs on the emulator and a real phone, shows the sign-in screen, and
  the web build and all tests still pass.

### C2. Platform layer and server reach (M)

Depends on: C1. Must merge before the parallel chunks.

- `src/lib/platform.ts`: `isNativeApp()` and `nativePlatform()` from Capacitor, next to the TWA
  checks (those go when the TWA is gone). One `isStoreBuild()` that covers both, used wherever the
  Play payments rules apply (`donate.tsx`, `feedback.ts`, `main.tsx`).
- `src/lib/apiBase.ts`: in the app, `/api/...` calls go to `https://fitlog-two-gamma.vercel.app`.
  Callers today: `deleteAccount.ts`, `restAlert.ts`.
- CORS on `api/account/delete.ts` and `api/rest-alert.ts` for the app's origins (`https://localhost`
  on Android, `capacitor://localhost` on iOS), and the same for `api/contact.js` in the
  DepartmentOfOne repo (feedback form).
- Links that must point at the website, never at the app's local address: share links
  (`shareLink.ts`) and the password reset and deletion email links (`Auth.tsx`,
  `delete-account/main.tsx`).
- Done when: in the app on the emulator, sign-in, data loading, feedback, account deletion (on a
  test account) and share links all work, and the website still works.

### S1. Spike: sign-in and bot checks inside the app (S)

Depends on: C2.

- Cloudflare Turnstile and Supabase sign-in, sign-up and password reset inside the Android WebView,
  at `https://localhost`. Turnstile needs `localhost` added to the widget's hostnames in Cloudflare
  (you do that).
- Report what works and what doesn't, with a fix if something fails. This is the biggest unknown,
  so it goes before the bigger chunks.

### S2. Spike: camera inside the app (S)

Depends on: C2.

- Photo upload (progress and meal photos, which use a file input) and the barcode scanner
  (`ScannerTab.tsx`, camera through `getUserMedia`) on a real phone.
- Report whether they work as they are, or whether the scanner should move to a native scanning
  plugin (`@capacitor-mlkit/barcode-scanning`). The result decides how big C7 is.

### C3. Rest timer, native (M)

Depends on: C2. Parallel with C4 to C9.

- A small Capacitor plugin of our own, in Kotlin (`android/app/src/main/java/.../RestTimerPlugin`):
  a silent ongoing notification whose countdown Android draws itself (a chronometer counting down
  to the end time), and a "Rest over" alert with sound, vibration and a heads-up popup at the end.
  Start, +15s and Skip change or cancel both.
- Settles D4 on two real phones, including one on Android 14 or newer.
- `restNotification.ts` uses the plugin in the app and keeps today's web behaviour on the web. The
  server push (`api/rest-alert.ts`) stays for the web only.
- Asks for notification permission (Android 13+) the same way it's asked now.
- Shared files: `AndroidManifest.xml` (permissions).
- Done when: on a phone with the screen locked, "Rest over" arrives at the end, within a second,
  across 90 s and 5 min rests, +15s and Skip, and the web still works as before.

### C4. Native push (M)

Depends on: C2, and you creating a Firebase project (D5). Parallel.

- `@capacitor/push-notifications` with Firebase Cloud Messaging. The device's token is stored with
  its platform in `push_subscriptions` (new columns, migration v34).
- The weekly summary and streak crons send to app devices through FCM and to web devices through
  web push, as now.
- `PushNotificationsCard.tsx` works the same in the app.
- Shared files: `AndroidManifest.xml`, `android/app/build.gradle` (Firebase), `package.json`.
- Done when: a test send reaches the app on a phone, with the app closed.

### C5. System integration (M)

Depends on: C2. Parallel.

- The Android back button goes back through screens and sheets (the app already keeps history
  entries for this, see `useBackToClose`), and leaves the app from the main screen.
- Status bar, edge-to-edge and safe areas (Android 15+ always draws edge to edge), splash screen,
  and the keyboard pushing content up instead of covering inputs.
- Refreshing data when the app comes back to the front.
- `haptics.ts` uses `@capacitor/haptics`, which also gives iPhones haptics later.
- External links (privacy policy, email, Buy Me a Coffee on the web only) open in the system
  browser or mail app.
- Shared files: `capacitor.config.ts`, `package.json`.

### C6. Links into the app, and sharing (M)

Depends on: C2. Parallel.

- Android App Links: share links (`/s/...`) and the password reset link open the app when it's
  installed, and the website when it isn't. `assetlinks.json` already lists the right keys.
- The app routes the opened link: a share link opens the item in Community, and a reset link opens
  the new-password step.
- `ShareLinkButton.tsx` uses the native share sheet (`@capacitor/share`), since the web share API
  doesn't exist inside the app.
- Optional: receiving text shared from other apps into FitLog (today's `share_target`).
- Shared files: `AndroidManifest.xml` (intent filters).

### C7. Camera and photos (S to M, set by S2)

Depends on: S2. Parallel.

- Whatever S2 found: permissions in the manifest, and the native scanner if the web one isn't good
  enough.
- Shared files: `AndroidManifest.xml`.

### C8. Tip jar billing (S)

Depends on: C2. Parallel. TIP_JAR_PLAN.md has the details.

- `@capgo/native-purchases`, and an adapter (`src/native/tipStore.ts`) that implements `TipStore`
  from `src/lib/tipJar.ts` and registers it at startup. It also consumes purchases left unfinished.
- The screen and entry points already exist and appear on their own once the store is registered.
- Done when: a license tester can tip each amount, tip the same amount twice, and see the right
  messages for a cancelled and a failed purchase.

### C9. Live updates (M, only with D1 option a)

Depends on: C1. Parallel.

- `@capgo/capacitor-updater`, self-hosted (free): each web deploy also publishes a zip of the app
  build on Vercel with a small manifest. The app checks on launch and resume, downloads in the
  background, and switches on the next launch. If a new bundle fails to start, it rolls back.
- Each bundle states the oldest app version it runs on, so web code that needs a newer native
  plugin waits for the store update.
- Done when: a change deployed to Vercel shows up in an installed app after one restart, with no
  store release.

### C10. Store and policy paperwork (S)

Depends on: C3, C4, C8 (it describes what they added).

- Privacy policy: Firebase Cloud Messaging, tips through Google Play, and anything else the chunks
  added.
- Data safety answers (`PLAY_CONSOLE_ANSWERS.md`): an FCM token counts as a device ID used for app
  functionality. Camera stays on the device.
- `store-listing/README.md`: the PWABuilder sections replaced with the Capacitor build steps.

### C11. Release builds (S)

Depends on: C1. Can start any time after it.

- A signed release bundle (`.aab`) from one command, and optionally a GitHub Actions workflow with
  the upload key kept in GitHub's secrets.
- `scripts/check-app-links.mjs` checks the release build's signing key, as it does for the TWA
  build today.
- Upload to the internal testing track first, then closed testing.

### C12. Testing on phones (S, mostly you and your testers)

Depends on: everything above.

- A checklist in `NATIVE_DEV.md` covering sign-in, logging, offline, notifications, rest timer,
  links, sharing, photos, scanner, tips and account deletion, on your Android phone and your
  cousin's.
- Then the release goes to closed testing.

## iOS, later (its own plan when it starts)

- An Apple Developer account (US$99 a year), and a Mac or a cloud Mac service (Codemagic, GitHub
  Actions macOS runners, or Xcode Cloud, which needs a Mac once to set up).
- `npx cap add ios`, signing, APNs for push, and Universal Links (`apple-app-site-association` in
  `public/.well-known`).
- The rest timer as a scheduled notification, plus a Live Activity on the lock screen (a small Swift
  extension).
- Tips through StoreKit with the same plugin, App Store privacy labels, a privacy manifest, and
  TestFlight.

## What I need from you

1. Answers to D1 to D5.
2. Android Studio and JDK 21 installed on your PC (C1 explains how).
3. The upload keystore and its password, from PWABuilder's `first_release` folder, kept on your PC
   and never committed (C1 and C11).
4. The versionCode of the last TWA build you uploaded (Play Console > App bundle explorer).
5. `localhost` added to the Turnstile widget's hostnames in Cloudflare (S1).
6. A Firebase project, if D5 is Firebase (C4).
7. The Play payments profile for tips (TIP_JAR_PLAN.md step 1). It can start now.

## How chunks get merged

Each agent works on its own branch in its own worktree. Before anything reaches master, I review
the diff and run the typecheck, lint, tests, the web build, the native build and a Gradle debug
build, and check the chunk's "done when" evidence. A chunk that falls short goes back with notes.
Merged chunks are deployed to the web only when they change the web app, and released to the store
only through C11.
