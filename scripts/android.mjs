// Builds the Android app (see NATIVE_DEV.md). Run through npm, which first builds the web code
// into the app (npm run build:native):
//
//   npm run android:debug     an APK to install on a phone over USB or by sending the file
//   npm run android:release   the signed .aab to upload to Google Play
//
// Needs JDK 21 and the Android SDK (Android Studio includes both). Release builds need
// android/keystore.properties with the upload key; without it they come out unsigned.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const kind = process.argv[2]
if (kind !== 'debug' && kind !== 'release') {
  console.error('Usage: node scripts/android.mjs debug|release')
  process.exit(1)
}

const android = fileURLToPath(new URL('../android/', import.meta.url))
const windows = process.platform === 'win32'
const task = kind === 'debug' ? 'assembleDebug' : 'bundleRelease'

if (kind === 'release' && !existsSync(android + 'keystore.properties')) {
  console.error('android/keystore.properties is missing, so the release would be unsigned. See NATIVE_DEV.md, "Release builds".')
  process.exit(1)
}

const result = spawnSync(windows ? 'gradlew.bat' : './gradlew', [task], { cwd: android, stdio: 'inherit', shell: windows })
if (result.status !== 0) process.exit(result.status ?? 1)

const { fitlogNative } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const out =
  kind === 'debug' ? 'android/app/build/outputs/apk/debug/app-debug.apk' : 'android/app/build/outputs/bundle/release/app-release.aab'
console.log(`\nFitLog ${fitlogNative.versionName} (versionCode ${fitlogNative.versionCode}): ${out}`)
