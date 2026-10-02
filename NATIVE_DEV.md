# The Android app: building, testing, releasing

FitLog's Play app is the same React app in a Capacitor shell (CAPACITOR_PLAN.md has the why).
The web code is bundled into the app, and live updates keep it current after each web deploy, so
most changes still ship with a normal deploy and no store release.

## What's where

| Part | Where |
|------|-------|
| Capacitor config | `capacitor.config.ts` |
| The Android project | `android/` (committed; `android/app/src/main/assets/public` is the web build, not committed) |
| Version numbers | `package.json` → `fitlogNative` (versionCode, versionName, minVersionCodeForWebUpdates) |
| App-only startup | `src/native/init.ts`, called from `src/main.tsx` only inside the app |
| Rest timer | `android/.../RestTimerService.java`, `RestTimerPlugin.java`, `src/native/restTimer.ts` |
| Links into the app, shortcuts, sharing in | `AndroidManifest.xml`, `IncomingPlugin.java`, `src/native/links.ts` |
| Live updates | `src/native/updates.ts`, `scripts/pack-web-update.mjs` |
| Push | `src/native/push.ts`, `api/_fcm.ts`, migration v34 |
| Tips | `src/native/tipStore.ts`, `src/lib/tipJar.ts`, TIP_JAR_PLAN.md |
| Icons and splash | `scripts/generate-android-assets.mjs` |

## Setting up a PC

1. Install **Android Studio** (it includes the Android SDK and a JDK). Open it once and let it
   finish its setup.
2. Node 22 or newer, then `npm install` in the repo.
3. Open the `android/` folder in Android Studio once, so it writes `android/local.properties`
   with the SDK path.

## Running it on a phone

1. On the phone: Settings → About phone → tap **Build number** seven times, then Settings →
   Developer options → turn on **USB debugging**.
2. Plug the phone in and allow the computer when it asks.
3. `npm run android:debug`, then install `android/app/build/outputs/apk/debug/app-debug.apk`
   (drag it onto the phone, or in Android Studio press Run with the phone selected).

The debug build is signed with a debug key, so share links and password reset links open the
browser instead of the app. Only Play-signed builds can open those links.

To look inside the running app: Chrome on the PC → `chrome://inspect` → the FitLog WebView
→ inspect. Console, network and elements work as on the web.

## Release builds

1. Put the upload keystore somewhere outside the repo (it's in PWABuilder's `first_release`
   folder, with its password in `signing-key-info.txt`).
2. Create `android/keystore.properties` (gitignored, never commit it):

   ```
   storeFile=C:/path/to/signing.keystore
   storePassword=...
   keyAlias=my-key-alias
   keyPassword=...
   ```

3. Raise `fitlogNative.versionCode` in `package.json` (Play rejects a repeat), and versionName if
   you like.
4. `npm run android:release` → `android/app/build/outputs/bundle/release/app-release.aab`.
5. Upload to **internal testing** first, check it on a phone, then promote to closed testing.
6. After Play processes it: App bundle explorer → the version → Downloads → "Signed, universal
   APK", then `npm run check:app-links -- <that apk>`.

## Live updates

Every `npm run build` (which Vercel runs on deploy) also builds the app's web code and publishes it
as `/app-updates/<version>.zip` with `/app-updates/latest.json`. The app checks a few seconds after
launch, downloads in the background, and switches at the next launch. A bundle that fails to start
is rolled back by itself.

Bump `fitlogNative.minVersionCodeForWebUpdates` to the new versionCode when a release adds or
changes native code (a plugin, the manifest, the Java files). Web code that needs it then waits
for people to get the store update, instead of loading into an app that can't run it.

## Push notifications (needs a Firebase project, once)

1. https://console.firebase.google.com → Add project ("FitLog"); Google Analytics not needed.
2. Add an Android app with package `com.departmentofone.fitlog`. Download `google-services.json`
   into `android/app/`.
3. Project settings → Service accounts → Generate new private key. In Vercel (fitlog project) add
   `FIREBASE_SERVICE_ACCOUNT` with the whole JSON as the value, for Production.
4. Run `supabase/migration_v34_native_push_tokens.sql`.
5. Build and upload a new versionCode (push needs the file at build time).

Until then the app works fully; only the Notifications card in Settings stays hidden.

## Sign-in inside the app

Cloudflare Turnstile checks sign-in, sign-up and password resets. The app's pages come from
`localhost`, so add `localhost` to the widget's hostnames: Cloudflare dashboard → Turnstile →
the FitLog widget → Hostname management.

## Testing on a phone

Go through this on at least one phone with Android 14 or newer before each release:

- [ ] Opens to the sign-in screen with the navy splash, no white flash; sign in and sign up work
      (Turnstile).
- [ ] Back button: closes sheets, steps back through screens, and from the first screen puts the
      app in the background.
- [ ] Status bar icons readable in dark and light theme; nothing hidden under the bars or the
      keyboard.
- [ ] Log a set: the rest timer starts, a silent "Resting" notification counts down by itself.
- [ ] Lock the phone: "Rest over" arrives on time with sound, vibration and a popup.
- [ ] +15s and Skip in the notification change the timer in the app too.
- [ ] Rest ends while FitLog is on screen: the card says "Rest over" and there's no notification.
- [ ] Haptics on logging a set and finishing a fast.
- [ ] Barcode scanner opens the camera after asking; meal and progress photos upload.
- [ ] Share link button opens the share sheet; a link sent to yourself opens the item (Play builds
      only).
- [ ] Share text from another app into FitLog: it lands in Meals.
- [ ] Long-press the icon: Log set, Log meal, Start a fast.
- [ ] Privacy policy and other links open in the browser, not inside the app.
- [ ] Settings → Tip jar: prices load, a license tester can tip.
- [ ] Airplane mode: the app opens and shows the last data.
- [ ] Deploy a small web change, open the app, close it, open again: the change is there.
- [ ] Account deletion with a throwaway account.
