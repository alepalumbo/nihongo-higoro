# Building the Android APK — 日本語ひごろ

The app is a Vite/React web app wrapped with **Capacitor**. It runs 100% offline
after install (all data in the WebView `localStorage`; no backend, no network).

## Prerequisites (one time)
- Node.js 18+ and npm
- **Android Studio** (includes the Android SDK + Gradle)
- A JDK 17 (bundled with recent Android Studio)

> Network note: this machine intercepts TLS certificates. If `npm install`
> fails with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, run installs with
> `npm install --strict-ssl=false` (and for native binaries like `sharp`,
> also set `NODE_TLS_REJECT_UNAUTHORIZED=0` for that command).

## Build steps (every time you change the app)
1. Make changes to the React app (under `src/`).
2. Build the web assets:
   ```
   npm run build
   ```
3. Copy the build into the native project:
   ```
   npx cap sync android
   ```
4. Open the Android project in Android Studio:
   ```
   npx cap open android
   ```
5. In Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   (or **Generate Signed Bundle / APK** for a release build).
6. The debug APK lands in:
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```
7. Transfer the APK to your device and install it.
   Enable **Settings → Security → Install from unknown sources** first.

## Command-line APK (optional, no Android Studio UI)
From the `android/` folder, with the SDK on PATH:
```
cd android
./gradlew assembleDebug      # Windows: gradlew.bat assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Regenerating the app icon / splash
Sources live in `assets/` (`icon-only.svg`, `icon-foreground.svg`,
`icon-background.svg`, `splash.svg`, `splash-dark.svg`). To regenerate every
density:
```
npx @capacitor/assets generate --android
```
> The headless rasterizer has no CJK font, so the icon uses a **torii** mark
> instead of a kanji glyph. To use a kanji icon, drop a 1024×1024 PNG with the
> glyph already rendered at `assets/icon-only.png` (+ `icon-foreground.png`) and
> re-run the command.

## Key config
- `capacitor.config.ts` — appId `com.nihongohigoro.app`, appName `日本語ひごろ`,
  webDir `dist`, splash screen settings.
- `vite.config.js` — `base: './'` so assets resolve inside the WebView.
- `android/app/src/main/AndroidManifest.xml` — offline-safe
  (`usesCleartextTraffic="false"`), storage permissions for the file picker,
  `screenOrientation="unspecified"` (portrait + landscape for tablets).

## Offline / persistence check
1. Build, install, open the app.
2. Upload a CSV (flashcards) and an MD (lesson).
3. Force-close the app completely, turn on airplane mode, reopen.
4. Cards and lessons must still be there and fully usable — confirms
   `localStorage` persistence and offline operation.
